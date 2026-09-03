import json
from llm_client.fallback_chain import LLMClient
from llm_client import cache


ENTAILMENT_SYSTEM_PROMPT = """You are a strict entailment judge. Given a claim and a candidate passage, determine whether the passage explicitly SUPPORTS, CONTRADICTS, or is UNSUPPORTED regarding the claim.

Rules:
- Mark SUPPORTED only if the passage EXPLICITLY states the claim. Mere implication is NOT sufficient — if the passage only hints at or suggests the claim, mark UNSUPPORTED.
- Mark CONTRADICTED only if the passage explicitly states something that directly conflicts with the claim.
- When in doubt, prefer UNSUPPORTED over guessing.
- Return exact JSON: {"verdict": "SUPPORTED"|"CONTRADICTED"|"UNSUPPORTED", "exact_span": "the verbatim substring from the passage that justifies your verdict", "confidence": 0.0 to 1.0}
- Return ONLY the JSON object, no markdown fences, no explanation."""


def judge_claim(claim: str, passage: str) -> dict:
    """Check if a passage supports, contradicts, or is silent on a claim.
    Returns dict with verdict, exact_span, and confidence."""
    llm = LLMClient()
    prompt = f"Claim: {claim}\n\nPassage: {passage}"

    # Check cache first
    cached = cache.get(prompt, ENTAILMENT_SYSTEM_PROMPT)
    if cached:
        return json.loads(cached)

    response, _ = llm.complete(prompt, system=ENTAILMENT_SYSTEM_PROMPT)
    cache.put(prompt, ENTAILMENT_SYSTEM_PROMPT, response)

    # Clean and parse JSON
    response = response.strip()
    if response.startswith("```"):
        response = response.split("\n", 1)[1]
        response = response.rsplit("```", 1)[0]
    return json.loads(response)
