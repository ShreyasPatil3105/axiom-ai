from llm_client.fallback_chain import LLMClient
from llm_client import cache


def build_repair_prompt(original_code: str, current_code: str, counterexample: dict) -> str:
    """Build a prompt asking the LLM to fix the translated code."""
    ce_str = ", ".join(f"{k}={v}" for k, v in counterexample.items() if k not in ("old_output", "new_output"))
    old_out = counterexample.get("old_output")
    new_out = counterexample.get("new_output")

    return f"""You are fixing a code translation bug.

ORIGINAL CODE:
{original_code}

CURRENT TRANSLATION (has a bug):
{current_code}

The following counterexample was found:
Input: {ce_str}
Expected output: {old_out}
Actual output: {new_out}

Fix the CURRENT TRANSLATION so it produces the expected output for this input.
Return ONLY the corrected Python code, no markdown fences, no explanation.
The corrected code must be a single function definition with type annotations."""


def repair_loop(original_code: str, current_code: str, counterexample: dict, max_attempts: int = 5) -> dict:
    """Attempt to repair the translated code using the LLM.
    Returns dict with status, repaired_code, and attempts_used."""
    llm = LLMClient()
    prompt = build_repair_prompt(original_code, current_code, counterexample)

    for attempt in range(1, max_attempts + 1):
        try:
            # Check cache first
            cached = cache.get(prompt)
            if cached:
                repaired = cached
            else:
                repaired, _ = llm.complete(prompt)
                cache.put(prompt, "", repaired)

            # Clean up any markdown fences
            repaired = repaired.strip()
            if repaired.startswith("```"):
                repaired = repaired.split("\n", 1)[1]
                repaired = repaired.rsplit("```", 1)[0]

            return {
                "status": "REPAIRED",
                "repaired_code": repaired,
                "attempts_used": attempt,
            }
        except Exception as e:
            continue

    return {
        "status": "REPAIR_FAILED",
        "repaired_code": None,
        "attempts_used": max_attempts,
    }
