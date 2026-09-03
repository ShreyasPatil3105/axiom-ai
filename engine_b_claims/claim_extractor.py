import json
from llm_client.fallback_chain import LLMClient
from llm_client import cache


EXTRACT_SYSTEM_PROMPT = """You are a claim extraction engine. Given a paragraph of text, extract every atomic factual claim from it.

Rules:
- Each claim must be independently checkable against a source document.
- Strip hedging language (e.g. "might", "could", "reportedly", "allegedly").
- Split compound claims into separate atomic claims.
- Return a JSON array of strings, each string being one claim.
- Return ONLY the JSON array, no markdown fences, no explanation."""


def extract_claims(text: str) -> list[str]:
    """Split a paragraph into atomic factual claims using the LLM."""
    llm = LLMClient()

    # Check cache first
    cached = cache.get(text, EXTRACT_SYSTEM_PROMPT)
    if cached:
        return json.loads(cached)

    response, _ = llm.complete(text, system=EXTRACT_SYSTEM_PROMPT)
    cache.put(text, EXTRACT_SYSTEM_PROMPT, response)

    # Clean and parse JSON
    response = response.strip()
    if response.startswith("```"):
        response = response.split("\n", 1)[1]
        response = response.rsplit("```", 1)[0]
    return json.loads(response)
