from engine_b_claims.claim_extractor import extract_claims
from engine_b_claims.chunker import chunk_text
from engine_b_claims.retriever import retrieve_top_chunks
from engine_b_claims.entailment_judge import judge_claim
from shared.schema import ClaimItem


def verify_claims(claims_or_text: str, sources: list[dict], top_k: int = 3) -> list[ClaimItem]:
    """Full Engine B pipeline: extract -> retrieve -> judge -> produce ClaimItems.
    sources: list of dicts with keys: name, text, doc_type, published_date."""
    # If input is raw text, extract atomic claims; otherwise assume it's already a claim list
    if isinstance(claims_or_text, str):
        claims = extract_claims(claims_or_text)
    else:
        claims = claims_or_text

    # Chunk all sources
    all_chunks = []
    for src in sources:
        chunks = chunk_text(src["text"])
        for chunk in chunks:
            all_chunks.append({
                "chunk": chunk,
                "source_name": src["name"],
                "doc_type": src.get("doc_type", "unattributed"),
                "published_date": src.get("published_date"),
            })

    results = []
    for i, claim in enumerate(claims):
        # Retrieve top chunks for this claim
        chunks_only = [c["chunk"] for c in all_chunks]
        top = retrieve_top_chunks(claim, chunks_only, top_k=top_k)

        if not top:
            results.append(ClaimItem(
                id=f"claim_{i}",
                claim_text=claim,
                status="UNSUPPORTED",
                confidence=0.0,
                reproducible_command=f"python -c \"from engine_b_claims.verify_claims import verify_claims; verify_claims([{repr(claim)}], sources)\"",
            ))
            continue

        # Judge against the best chunk
        best_chunk, best_score = top[0]
        judgement = judge_claim(claim, best_chunk)

        # Find which source this chunk came from
        chunk_info = next(c for c in all_chunks if c["chunk"] == best_chunk)

        results.append(ClaimItem(
            id=f"claim_{i}",
            claim_text=claim,
            status=judgement["verdict"],
            cited_passage=best_chunk,
            exact_span=judgement.get("exact_span"),
            source_name=chunk_info["source_name"],
            confidence=judgement.get("confidence", 0.0),
            reproducible_command=f"python -c \"from engine_b_claims.verify_claims import verify_claims; verify_claims([{repr(claim)}], sources)\"",
        ))

    return results


# Patch: Wire authority scores into the pipeline
from engine_b_claims.authority_scorer import compute_authority_score, compute_freshness_decay

# Store original function
_original_verify_claims = verify_claims


def verify_claims(claims_or_text: str, sources: list[dict], top_k: int = 3) -> list[ClaimItem]:
    """Wrapper that adds authority scores and freshness decay to ClaimItems."""
    items = _original_verify_claims(claims_or_text, sources, top_k)
    for item in items:
        # Find the source for this item
        for src in sources:
            if src["name"] == item.source_name:
                item.authority_score = compute_authority_score(src.get("doc_type", "unknown"))
                item.freshness_decay = compute_freshness_decay(src.get("published_date"))
                break
    return items
