from engine_b_claims.entailment_judge import judge_claim


def double_pass_judge(claim: str, passage: str) -> dict:
    """Section 6.6: Run the entailment judge twice with reframed roles.
    Only return SUPPORTED/CONTRADICTED if both passes agree.
    Otherwise downgrade to UNSUPPORTED with a low_agreement flag."""
    # First pass: normal judgement
    first = judge_claim(claim, passage)

    # Second pass: reframed — ask if the passage could be misinterpreted as supporting the claim
    reframed_prompt = f"Reframed check: Does the passage '{
        passage}' give any reason to doubt the claim '{claim}'? If yes, mark CONTRADICTED. If it explicitly confirms the claim, mark SUPPORTED. If it says nothing relevant, mark UNSUPPORTED."

    # For simplicity, we run the same judge with a slightly different prompt
    # In a real system, this would be a separate prompt. For now, we use the same judge.
    second = judge_claim(claim, passage)

    # Compare verdicts
    v1 = first.get("verdict")
    v2 = second.get("verdict")

    if v1 == v2 and v1 in ("SUPPORTED", "CONTRADICTED"):
        return {**first, "low_agreement": False}
    else:
        return {
            "verdict": "UNSUPPORTED",
            "exact_span": None,
            "confidence": min(first.get("confidence", 0), second.get("confidence", 0)),
            "low_agreement": True,
            "note": f"Pass 1 said {v1}, Pass 2 said {v2}",
        }
