from pydantic import BaseModel
from typing import Literal, Optional, Union
from datetime import datetime
import uuid


class CodeItem(BaseModel):
    id: str
    status: Literal["PROVEN", "DISPROVEN", "FUZZ_PASS", "FUZZ_FAIL", "TIMEOUT_INCONCLUSIVE"]
    risk_tier: Literal["GREEN", "YELLOW", "RED"]
    localisation: Optional[dict] = None
    counterexample: Optional[dict] = None
    repair_attempts: int = 0
    reproducible_command: str


class ClaimItem(BaseModel):
    id: str
    claim_text: str
    status: Literal["SUPPORTED", "CONTRADICTED", "UNSUPPORTED", "DISPUTED"]
    cited_passage: Optional[str] = None
    exact_span: Optional[str] = None
    source_name: Optional[str] = None
    authority_score: Optional[float] = None
    freshness_decay: Optional[float] = None
    conflicting_sources: Optional[list[dict]] = None
    confidence: float
    reproducible_command: str


# === MOVED UP: CallSiteCheck and IntegrationReport before Verdict ===
class CallSiteCheck(BaseModel):
    id: str
    file_path: str
    line_number: int
    call_expression: str
    status: Literal["COMPATIBLE", "SIGNATURE_MISMATCH", "SIDE_EFFECT_CHANGED", "UNRESOLVED_DYNAMIC"]
    detail: str
    reproducible_command: str


class IntegrationReport(BaseModel):
    audit_trail_id: str = str(uuid.uuid4())
    repo_url: str
    repo_commit_sha: str
    target_function: str
    total_files_indexed: int
    indexing_time_seconds: float
    total_call_sites_found: int
    unresolved_dynamic_count: int
    call_site_checks: list[CallSiteCheck]
    codebase_integration_score: float


# === Now Verdict can reference IntegrationReport ===
class Verdict(BaseModel):
    audit_trail_id: str = str(uuid.uuid4())
    artefact_type: Literal["code", "claim_set"]
    overall_trust_score: float
    items: list[Union[CodeItem, ClaimItem]]
    generated_at: datetime = datetime.utcnow()
    verdict_hash: Optional[str] = None
    integration_report: Optional[IntegrationReport] = None  # Engine A2, populated for code artefacts with repo URL