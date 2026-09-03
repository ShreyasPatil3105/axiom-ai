import re


def chunk_text(text: str, chunk_size: int = 3) -> list[str]:
    """Split source document text into chunks of a few sentences each.
    Uses simple sentence splitting — no heavy NLP needed."""
    # Split on sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]

    # Group sentences into chunks
    chunks = []
    for i in range(0, len(sentences), chunk_size):
        chunk = " ".join(sentences[i:i + chunk_size])
        chunks.append(chunk)

    return chunks
