import re


def tokenize(text: str) -> set[str]:
    """Simple word tokenizer: lowercase, remove punctuation, split on whitespace."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return set(text.split())


def score_overlap(claim: str, chunk: str) -> float:
    """Jaccard similarity between claim tokens and chunk tokens."""
    claim_tokens = tokenize(claim)
    chunk_tokens = tokenize(chunk)
    if not claim_tokens or not chunk_tokens:
        return 0.0
    intersection = claim_tokens & chunk_tokens
    union = claim_tokens | chunk_tokens
    return len(intersection) / len(union)


def retrieve_top_chunks(claim: str, chunks: list[str], top_k: int = 3) -> list[tuple[str, float]]:
    """Return the top-k most relevant chunks for a claim, with scores."""
    scored = [(chunk, score_overlap(claim, chunk)) for chunk in chunks]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]
