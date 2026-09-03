# ⚠️ MANUAL REVIEW REQUIRED: The benchmark ground-truth labels below must be
# manually verified by Shreyas before final submission. These are placeholders
# to demonstrate the evaluation structure — adjust the labelled cases and
# expected statuses to match your actual demo dataset.

BENCHMARK_CASES = [
    {
        "name": "clean_commutative_add",
        "old_code": "def add(a: int, b: int) -> int:\n    return a + b",
        "new_code": "def add(a: int, b: int) -> int:\n    return b + a",
        "expected": "PROVEN",
        "buggy_line": None,
    },
    {
        "name": "buggy_subtract_instead_of_add",
        "old_code": "def add(a: int, b: int) -> int:\n    return a + b",
        "new_code": "def add(a: int, b: int) -> int:\n    return a - b",
        "expected": "DISPROVEN",
        "buggy_line": 2,
    },
    {
        "name": "clean_multiply_commutative",
        "old_code": "def mul(a: int, b: int) -> int:\n    return a * b",
        "new_code": "def mul(a: int, b: int) -> int:\n    return b * a",
        "expected": "PROVEN",
        "buggy_line": None,
    },
]


CLAIM_CASES = [
    {
        "name": "supported_water_boiling",
        "claim": "Water boils at 100 degrees Celsius at sea level.",
        "source": "Water boils at 100 degrees Celsius at standard atmospheric pressure.",
        "expected": "SUPPORTED",
    },
    {
        "name": "contradicted_water_boiling",
        "claim": "Water boils at 50 degrees Celsius at sea level.",
        "source": "Water boils at 100 degrees Celsius at standard atmospheric pressure.",
        "expected": "CONTRADICTED",
    },
    {
        "name": "unsupported_irrelevant_claim",
        "claim": "Water is the most common liquid on Mars.",
        "source": "Water boils at 100 degrees Celsius at standard atmospheric pressure.",
        "expected": "UNSUPPORTED",
    },
]


def run_code_benchmark() -> dict:
    """Run Engine A on all code benchmark cases and compute accuracy."""
    from engine_a_code.verify_code import verify_code

    correct = 0
    results = []
    for case in BENCHMARK_CASES:
        item = verify_code(case["old_code"], case["new_code"])
        is_correct = item.status == case["expected"]
        if is_correct:
            correct += 1
        results.append({
            "name": case["name"],
            "expected": case["expected"],
            "actual": item.status,
            "correct": is_correct,
            "counterexample": item.counterexample,
        })

    accuracy = correct / len(BENCHMARK_CASES) if BENCHMARK_CASES else 0.0
    return {"accuracy": accuracy, "correct": correct, "total": len(BENCHMARK_CASES), "results": results}


def run_claim_benchmark() -> dict:
    """Run the entailment judge on all claim benchmark cases and compute accuracy."""
    from engine_b_claims.entailment_judge import judge_claim

    correct = 0
    results = []
    for case in CLAIM_CASES:
        judgement = judge_claim(case["claim"], case["source"])
        is_correct = judgement["verdict"] == case["expected"]
        if is_correct:
            correct += 1
        results.append({
            "name": case["name"],
            "expected": case["expected"],
            "actual": judgement["verdict"],
            "correct": is_correct,
            "confidence": judgement.get("confidence"),
        })

    accuracy = correct / len(CLAIM_CASES) if CLAIM_CASES else 0.0
    return {"accuracy": accuracy, "correct": correct, "total": len(CLAIM_CASES), "results": results}


def run_full_benchmark() -> dict:
    """Run both benchmarks and return combined metrics."""
    code_results = run_code_benchmark()
    claim_results = run_claim_benchmark()
    return {
        "code_equivalence_pass_rate": code_results["accuracy"],
        "claim_grounding_accuracy": claim_results["accuracy"],
        "code_details": code_results,
        "claim_details": claim_results,
    }
