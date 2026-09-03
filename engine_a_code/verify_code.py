from engine_a_code.risk_classifier import classify
from engine_a_code.z3_verifier import verify_equivalence
from engine_a_code.fuzz_fallback import differential_fuzz
from engine_a_code.repair_loop import repair_loop
from shared.schema import CodeItem


def verify_code(old_code: str, new_code: str, unroll_bound: int = 20) -> CodeItem:
    """Full Engine A pipeline: classify -> prove/fuzz -> repair -> re-verify."""
    risk_tier = classify(new_code)
    item_id = "c1"
    repair_attempts = 0

    if risk_tier in ("GREEN", "YELLOW"):
        result = verify_equivalence(old_code, new_code)
    else:
        result = differential_fuzz(old_code, new_code, num_cases=1000)

    status = result["status"]
    counterexample = result["counterexample"]

    # If disproven, attempt repair
    if status in ("DISPROVEN", "FUZZ_FAIL") and counterexample:
        repair = repair_loop(old_code, new_code, counterexample)
        repair_attempts = repair["attempts_used"]
        if repair["status"] == "REPAIRED":
            new_code = repair["repaired_code"]
            # Re-verify with repaired code
            if risk_tier in ("GREEN", "YELLOW"):
                result = verify_equivalence(old_code, new_code)
            else:
                result = differential_fuzz(old_code, new_code, num_cases=1000)
            status = result["status"]
            counterexample = result["counterexample"]

    # Map status to CodeItem
    return CodeItem(
        id=item_id,
        status=status,
        risk_tier=risk_tier,
        localisation={"counterexample": counterexample} if counterexample else None,
        counterexample=counterexample,
        repair_attempts=repair_attempts,
        reproducible_command=f"python -c \"from engine_a_code.verify_code import verify_code; verify_code({repr(old_code)}, {repr(new_code)})\"",
    )
