import random
from typing import Optional


def run_func(code: str, func_name: str, inputs: dict) -> int:
    """Execute the function from code with given inputs and return its output."""
    namespace = {}
    exec(code, namespace)
    func = namespace[func_name]
    return func(**inputs)


def differential_fuzz(old_code: str, new_code: str, num_cases: int = 1000) -> dict:
    """Run both functions on the same random inputs and flag any mismatch.
    Returns dict with status and optional counterexample."""
    import ast

    # Get function name and parameter names from old code
    tree = ast.parse(old_code)
    func = tree.body[0]
    func_name = func.name
    params = [arg.arg for arg in func.args.args]

    for _ in range(num_cases):
        # Generate random integer inputs in a small range
        inputs = {p: random.randint(-100, 100) for p in params}

        old_out = run_func(old_code, func_name, inputs)
        new_out = run_func(new_code, func_name, inputs)

        if old_out != new_out:
            return {
                "status": "FUZZ_FAIL",
                "counterexample": {**inputs, "old_output": old_out, "new_output": new_out},
            }

    return {"status": "FUZZ_PASS", "counterexample": None}
