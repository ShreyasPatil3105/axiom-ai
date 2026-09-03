from llm_client.fallback_chain import LLMClient
from llm_client import cache
import ast


def run_func(code: str, inputs: dict) -> int:
    """Execute the function from code with given inputs and return its output."""
    namespace = {}
    exec(code, namespace)
    tree = ast.parse(code)
    func = tree.body[0]
    return namespace[func.name](**inputs)


def build_repair_prompt(original_code: str, current_code: str, counterexample: dict) -> str:
    """Build a prompt asking the LLM to fix the translated code."""
    # Get input values (exclude old_output and new_output if present)
    inputs = {k: v for k, v in counterexample.items() if k not in ("old_output", "new_output")}
    # Fill missing params with 0 (Z3 counterexamples may only show divergent vars)
    import ast as _ast
    tree = _ast.parse(original_code.strip())
    func = tree.body[0]
    for arg in func.args.args:
        if arg.arg not in inputs:
            inputs[arg.arg] = 0

    # Compute actual outputs by running both functions
    try:
        old_out = run_func(original_code.strip(), inputs)
    except Exception:
        old_out = "ERROR"
    try:
        new_out = run_func(current_code.strip(), inputs)
    except Exception:
        new_out = "ERROR"

    ce_str = ", ".join(f"{k}={v}" for k, v in inputs.items())

    return f"""You are fixing a code translation bug.

ORIGINAL CODE:
{original_code.strip()}

CURRENT TRANSLATION (has a bug):
{current_code.strip()}

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

            repaired = repaired.strip()

            if not repaired:
                continue

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
