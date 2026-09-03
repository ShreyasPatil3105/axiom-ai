from datetime import datetime, date


# ⚠️ MANUAL REVIEW REQUIRED: These tier weights are placeholders from the blueprint.
# Before final submission, verify these values against Section 3.1 of the blueprint
# and adjust if needed. The values below are the Section 3.1 defaults:
# statutory=1.0, vendor=0.6, unattributed=0.2
# Do NOT treat these as final until Shreyas has manually confirmed them.

TIER_WEIGHTS = {
    "statutory": 1.0,
    "official": 1.0,
    "vendor": 0.6,
    "documentation": 0.6,
    "unattributed": 0.2,
    "unknown": 0.2,
}


def compute_authority_score(doc_type: str) -> float:
    """Return the authority weight for a document type.
    Falls back to 'unknown' tier if the type isn't recognised."""
    return TIER_WEIGHTS.get(doc_type, TIER_WEIGHTS["unknown"])


def compute_freshness_decay(published_date: str | None, reference_date: str | None = None) -> float:
    """Compute a freshness multiplier based on document age.
    Newer docs get higher multipliers. No date = no decay (1.0)."""
    if published_date is None:
        return 1.0

    try:
        pub = datetime.fromisoformat(published_date).date()
    except ValueError:
        return 1.0

    if reference_date is None:
        ref = date.today()
    else:
        ref = datetime.fromisoformat(reference_date).date()

    age_days = max(0, (ref - pub).days)

    # Simple decay: 1.0 for <1 year old, down to 0.5 for 5+ years old
    if age_days < 365:
        return 1.0
    if age_days < 1825:  # 5 years
        return 0.8
    if age_days < 3650:  # 10 years
        return 0.6
    return 0.5
