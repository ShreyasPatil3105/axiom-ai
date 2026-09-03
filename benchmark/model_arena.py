"""Model Arena — compare LLM providers on the repair loop task.
Section 6.3 of the blueprint: benchmark which cheap model is good enough."""

import time
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from engine_a_code.repair_loop import repair_loop

# The buggy code pair to test
OLD_CODE = "def add(a: int, b: int) -> int:\n    return a + b"
NEW_CODE = "def add(a: int, b: int) -> int:\n    return a - b"
COUNTEREXAMPLE = {"b": 1, "old_output": 1, "new_output": -1}


def run_arena():
    """Run the repair loop and report results."""
    print("=" * 60)
    print("AXIOM AI — Model Arena")
    print("Task: Repair buggy code (a - b should be a + b)")
    print("=" * 60)
    print()

    start = time.time()
    repair = repair_loop(OLD_CODE, NEW_CODE, COUNTEREXAMPLE)
    elapsed = time.time() - start

    print(f"Provider: Groq (openai/gpt-oss-20b)")
    print(f"Status: {repair['status']}")
    print(f"Attempts: {repair['attempts_used']}")
    print(f"Time: {elapsed:.2f}s")
    print()

    if repair["status"] == "REPAIRED":
        print("✅ Repair successful — cheap model is sufficient for triage")
    else:
        print("❌ Repair failed")

    print("=" * 60)


if __name__ == "__main__":
    run_arena()
