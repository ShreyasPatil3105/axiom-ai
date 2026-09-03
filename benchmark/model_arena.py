"""Model Arena — compare LLM providers on the repair loop task.
Section 6.3 of the blueprint: benchmark which cheap model is good enough."""

import time
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from llm_client.fallback_chain import LLMClient


OLD_CODE = "def add(a: int, b: int) -> int:\n    return a + b"
NEW_CODE = "def add(a: int, b: int) -> int:\n    return a - b"
COUNTEREXAMPLE = {"b": 1, "old_output": 1, "new_output": -1}


def test_provider(provider_name: str) -> dict:
    """Test a single provider on the repair task."""
    llm = LLMClient()
    prompt = f"""You are fixing a code translation bug.

ORIGINAL CODE:
{OLD_CODE}

CURRENT TRANSLATION (has a bug):
{NEW_CODE}

The following counterexample was found:
Input: b=1, a=0
Expected output: 1
Actual output: -1

Fix the CURRENT TRANSLATION so it produces the expected output for this input.
Return ONLY the corrected Python code, no markdown fences, no explanation.
The corrected code must be a single function definition with type annotations."""

    start = time.time()
    try:
        response, _ = llm.complete(prompt)
        elapsed = time.time() - start
        repaired = response.strip()
        if repaired.startswith("```"):
            repaired = repaired.split("\n", 1)[1]
            repaired = repaired.rsplit("```", 1)[0]
        repaired = repaired.strip()
        success = "a + b" in repaired
        return {"provider": provider_name, "success": success, "time": elapsed, "response": repaired[:100]}
    except Exception as e:
        elapsed = time.time() - start
        return {"provider": provider_name, "success": False, "time": elapsed, "error": str(e)[:100]}


def run_arena():
    """Run repair task on all configured providers and show comparison."""
    print("=" * 60)
    print("AXIOM AI — Model Arena")
    print("Task: Repair buggy code (a - b should be a + b)")
    print("=" * 60)
    print()

    providers = ["deepseek", "groq", "openrouter"]
    results = []
    for p in providers:
        print(f"Testing {p}...")
        result = test_provider(p)
        results.append(result)
        print(f"  Success: {result['success']}, Time: {result['time']:.2f}s")
        print()

    print("=" * 60)
    print("Results Table:")
    print(f"{'Provider':<15} {'Success':<10} {'Time (s)':<10}")
    print("-" * 35)
    for r in results:
        status = "✅" if r["success"] else "❌"
        print(f"{r['provider']:<15} {status:<10} {r['time']:.2f}s")
    print("=" * 60)


if __name__ == "__main__":
    run_arena()
