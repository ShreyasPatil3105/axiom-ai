from engine_b_claims.authority_scorer import compute_authority_score, compute_freshness_decay


def resolve_dispute(claim: str, judgements: list[dict]) -> dict:
    """Section 6.2: When multiple sources disagree on a claim, surface both.
    judgements: list of dicts with keys: source_name, verdict, exact_span, confidence,
                doc_type, published_date.
    Returns: dict with final_status and conflicting_sources if DISPUTED."""
    supported = [j for j in judgements if j["verdict"] == "SUPPORTED"]
    contradicted = [j for j in judgements if j["verdict"] == "CONTRADICTED"]

    # If all agree, no dispute
    if supported and not contradicted:
        return {"final_status": "SUPPORTED", "conflicting_sources": None}
    if contradicted and not supported:
        return {"final_status": "CONTRADICTED", "conflicting_sources": None}

    # Dispute: some support, some contradict
    if supported and contradicted:
        # Weight each source by authority score * freshness decay
        conflicting = []
        for j in judgements:
            if j["verdict"] in ("SUPPORTED", "CONTRADICTED"):
                auth = compute_authority_score(j.get("doc_type", "unknown"))
                freshness = compute_freshness_decay(j.get("published_date"))
                weighted = auth * freshness
                conflicting.append({
                    "source_name": j["source_name"],
                    "verdict": j["verdict"],
                    "authority_score": auth,
                    "freshness_decay": freshness,
                    "weighted_score": weighted,
                    "exact_span": j.get("exact_span"),
                })

        # Sort by weighted score descending
        conflicting.sort(key=lambda x: x["weighted_score"], reverse=True)
        return {"final_status": "DISPUTED", "conflicting_sources": conflicting}

    # No clear verdict
    return {"final_status": "UNSUPPORTED", "conflicting_sources": None}
