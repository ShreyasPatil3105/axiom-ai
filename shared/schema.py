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


class Verdict(BaseModel):
    audit_trail_id: str = str(uuid.uuid4())
    artefact_type: Literal["code", "claim_set"]
    overall_trust_score: float
    items: list[Union[CodeItem, ClaimItem]]
    generated_at: datetime = datetime.utcnow()
    verdict_hash: Optional[str] = None
