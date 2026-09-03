from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from shared.schema import Verdict, CodeItem, ClaimItem, IntegrationReport, CallSiteCheck
from engine_a_code.verify_code import verify_code
from engine_b_claims.verify_claims import verify_claims
from engine_a2_integration.indexer import index_repo
from engine_a2_integration.impact_slicer import find_call_sites
from engine_a2_integration.call_site_checker import check_call_site_compatibility
from engine_a2_integration.github_connector import clone_and_list_files
import hashlib
import json
import subprocess

app = FastAPI(title="AXIOM AI", description="Universal Verification Oracle")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VerifyCodeRequest(BaseModel):
    old_code: str
    new_code: str
    unroll_bound: int = 20


class VerifyClaimsRequest(BaseModel):
    claims_or_text: str
    sources: list[dict]


class VerifyIntegrationRequest(BaseModel):
    repo_path: Optional[str] = None
    repo_url: Optional[str] = None
    target_function: str
    new_function_code: str


def compute_verdict_hash(verdict: Verdict) -> str:
    """Section 6.7: SHA-256 hash of the canonical JSON."""
    canonical = verdict.model_dump_json(exclude={"verdict_hash"})
    return hashlib.sha256(canonical.encode()).hexdigest()


def compute_code_trust_score(items: list[CodeItem]) -> float:
    """Section 6B formula: 100 * (pass/total) - 15 * (fuzz_only/total) - 5 * avg(repair_attempts)."""
    total = len(items)
    if total == 0:
        return 0.0

    proven_or_pass = sum(1 for i in items if i.status in ("PROVEN", "FUZZ_PASS"))
    fuzz_only = sum(1 for i in items if i.status in ("FUZZ_PASS", "FUZZ_FAIL"))
    avg_repairs = sum(i.repair_attempts for i in items) / total

    score = 100 * (proven_or_pass / total) - 15 * (fuzz_only / total) - 5 * avg_repairs
    return max(0.0, min(100.0, score))


def compute_claims_trust_score(items: list[ClaimItem]) -> float:
    """Section 6B formula: weighted average of per-claim scores."""
    total = len(items)
    if total == 0:
        return 0.0

    per_claim_scores = {
        "SUPPORTED": 100,
        "CONTRADICTED": 0,
        "UNSUPPORTED": 30,
        "DISPUTED": 40,
    }

    weighted_sum = 0.0
    weight_sum = 0.0
    for item in items:
        base = per_claim_scores.get(item.status, 0)
        weight = 1.0
        if item.authority_score is not None:
            weight = item.authority_score
        if item.freshness_decay is not None:
            weight *= item.freshness_decay
        weighted_sum += base * weight
        weight_sum += weight

    if weight_sum == 0:
        return 0.0
    return weighted_sum / weight_sum


@app.post("/verify-code")
async def verify_code_endpoint(req: VerifyCodeRequest) -> Verdict:
    """Run Engine A: prove or disprove behavioural equivalence."""
    item = verify_code(req.old_code, req.new_code, req.unroll_bound)
    trust_score = compute_code_trust_score([item])
    v = Verdict(
        artefact_type="code",
        overall_trust_score=trust_score,
        items=[item],
    )
    v.verdict_hash = compute_verdict_hash(v)
    return v


@app.post("/verify-claims")
async def verify_claims_endpoint(req: VerifyClaimsRequest) -> Verdict:
    """Run Engine B: ground claims against source documents."""
    items = verify_claims(req.claims_or_text, req.sources)
    trust_score = compute_claims_trust_score(items)
    v = Verdict(
        artefact_type="claim_set",
        overall_trust_score=trust_score,
        items=items,
    )
    v.verdict_hash = compute_verdict_hash(v)
    return v


@app.get("/status/{audit_trail_id}")
async def get_status(audit_trail_id: str) -> dict:
    """Re-serve a stored verdict by ID. Placeholder until we add persistence."""
    return {"audit_trail_id": audit_trail_id, "note": "Verdict persistence to be wired"}

@app.post("/verify-integration")
async def verify_integration_endpoint(req: VerifyIntegrationRequest) -> IntegrationReport:
    """Run Engine A2: check if the migrated function integrates with the whole repo."""
    import time

    start = time.time()
    if req.repo_url:
        clone_path = "/tmp/axiom_clone"
        clone_and_list_files(req.repo_url, clone_path)
        index = index_repo(clone_path)
    else:
        index = index_repo(req.repo_path)
    indexing_time = time.time() - start

    call_sites = find_call_sites(index, req.target_function)
    checks = []
    unresolved_count = 0

    for i, site in enumerate(call_sites):
        result = check_call_site_compatibility(req.new_function_code, site)
        if result["status"] == "UNRESOLVED_DYNAMIC":
            unresolved_count += 1

        checks.append(CallSiteCheck(
            id=f"cs_{i}",
            file_path=site["file_path"],
            line_number=site["line_number"],
            call_expression=site["call_expression"],
            status=result["status"],
            detail=result["detail"],
            reproducible_command=f"python -c \"from engine_a2_integration.call_site_checker import check_call_site_compatibility; check_call_site_compatibility({repr(req.new_function_code)}, {site})\"",
        ))

    resolvable = [c for c in checks if c.status != "UNRESOLVED_DYNAMIC"]
    compatible = [c for c in resolvable if c.status == "COMPATIBLE"]
    integration_score = (len(compatible) / len(resolvable) * 100) if resolvable else 0.0

    return IntegrationReport(
        repo_url=req.repo_url or req.repo_path,
        repo_commit_sha=subprocess.run(["git", "-C", clone_path if req.repo_url else req.repo_path, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()[:8],
        target_function=req.target_function,
        total_files_indexed=index["total_files"],
        indexing_time_seconds=indexing_time,
        total_call_sites_found=len(call_sites),
        unresolved_dynamic_count=unresolved_count,
        call_site_checks=checks,
        codebase_integration_score=integration_score,
    )
