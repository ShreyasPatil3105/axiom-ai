from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from shared.schema import Verdict, CodeItem, ClaimItem
from engine_a_code.verify_code import verify_code
from engine_b_claims.verify_claims import verify_claims

app = FastAPI(title="AXIOM AI", description="Universal Verification Oracle")


class VerifyCodeRequest(BaseModel):
    old_code: str
    new_code: str
    unroll_bound: int = 20


class VerifyClaimsRequest(BaseModel):
    claims_or_text: str
    sources: list[dict]


@app.post("/verify-code")
async def verify_code_endpoint(req: VerifyCodeRequest) -> Verdict:
    """Run Engine A: prove or disprove behavioural equivalence."""
    item = verify_code(req.old_code, req.new_code, req.unroll_bound)
    trust_score = compute_code_trust_score([item])
    return Verdict(
        artefact_type="code",
        overall_trust_score=trust_score,
        items=[item],
    )


@app.post("/verify-claims")
async def verify_claims_endpoint(req: VerifyClaimsRequest) -> Verdict:
    """Run Engine B: ground claims against source documents."""
    items = verify_claims(req.claims_or_text, req.sources)
    trust_score = compute_claims_trust_score(items)
    return Verdict(
        artefact_type="claim_set",
        overall_trust_score=trust_score,
        items=items,
    )


@app.get("/status/{audit_trail_id}")
async def get_status(audit_trail_id: str) -> dict:
    """Re-serve a stored verdict by ID. Placeholder until we add persistence."""
    return {"audit_trail_id": audit_trail_id, "note": "Verdict persistence to be wired"}


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
        weight = 1.0  # default weight; will be replaced by authority_score * freshness_decay later
        if item.authority_score is not None:
            weight = item.authority_score
        if item.freshness_decay is not None:
            weight *= item.freshness_decay
        weighted_sum += base * weight
        weight_sum += weight

    if weight_sum == 0:
        return 0.0
    return weighted_sum / weight_sum
