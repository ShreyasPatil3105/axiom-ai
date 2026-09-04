import random
from typing import Optional


def run_func(code: str, func_name: str, inputs: dict):
    local_ns = {}
    exec(code, {}, local_ns)
    func = local_ns.get(func_name)
    if func is None:
        raise ValueError(f"Function {func_name} not found")
    return func(**inputs)


def differential_fuzz(old_code: str, new_code: str, func_name: str = None, num_cases: int = 1000):
    """
    Run differential fuzzing with safe input generation.
    """
    if func_name is None:
        # extract function name
        tree = ast.parse(old_code)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                func_name = node.name
                break
        if func_name is None:
            raise ValueError("Could not find function name")

    # get parameter names from old code
    tree = ast.parse(old_code)
    param_names = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == func_name:
            for arg in node.args.args:
                param_names.append(arg.arg)
            break

    counterexamples = []
    passed = True

    for _ in range(num_cases):
        inputs = {}
        for name in param_names:
            if 'rate' in name.lower() or 'interest' in name.lower():
                inputs[name] = random.uniform(0.0, 1.0)       # rate between 0 and 1
            elif 'years' in name.lower() or 'year' in name.lower():
                inputs[name] = random.randint(0, 30)          # years 0-30
            elif 'principal' in name.lower() or 'amount' in name.lower():
                inputs[name] = random.uniform(1.0, 100000.0)  # positive principal
            elif 'b' in name.lower():
                inputs[name] = random.randint(1, 100)         # avoid division by zero
            else:
                inputs[name] = random.randint(-100, 100)

        # skip if any input is invalid for known patterns
        if 'rate' in inputs and inputs['rate'] < 0:
            continue
        if 'years' in inputs and inputs['years'] < 0:
            continue

        try:
            old_out = run_func(old_code, func_name, inputs)
            new_out = run_func(new_code, func_name, inputs)
        except Exception as e:
            # treat as failed test
            counterexamples.append({
                **inputs,
                'error': str(e),
                'old_output': None,
                'new_output': None
            })
            passed = False
            continue

        # compare outputs
        if isinstance(old_out, float) and isinstance(new_out, float):
            if abs(old_out - new_out) > 1e-6:
                counterexamples.append({**inputs, 'old_output': old_out, 'new_output': new_out})
                passed = False
        else:
            if old_out != new_out:
                counterexamples.append({**inputs, 'old_output': old_out, 'new_output': new_out})
                passed = False

    return counterexamples, passed