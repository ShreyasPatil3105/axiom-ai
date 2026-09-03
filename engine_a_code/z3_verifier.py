from z3 import Solver, sat, unsat, unknown, Int, parse_smt2_string
from engine_a_code.ast_to_smt import function_to_smt


def build_equivalence_query(old_code: str, new_code: str) -> str:
    """Build a full SMT-LIB2 query that asks: is there an input where old != new?"""
    print(f"DEBUG old_code repr: {old_code!r}")
    print(f"DEBUG new_code repr: {new_code!r}")
    old_smt = function_to_smt(old_code, "old_func")
    new_smt = function_to_smt(new_code, "new_func")

    # Extract parameter names from old code to declare as constants
    import ast
    tree = ast.parse(old_code.strip())
    func = tree.body[0]
    params = [arg.arg for arg in func.args.args]

    # Declare input parameters as constants
    param_decls = "\n".join(f"(declare-const {p} Int)" for p in params)

    # Build the query
    query = f"""
{param_decls}

{old_smt}

{new_smt}

(assert (not (= (old_func {" ".join(params)}) (new_func {" ".join(params)}))))
(check-sat)
(get-model)
"""
    return query


def verify_equivalence(old_code: str, new_code: str, timeout_ms: int = 5000) -> dict:
    """Check if two Python functions are equivalent using Z3.
    Returns a dict with status and optional counterexample."""
    query = build_equivalence_query(old_code, new_code)

    s = Solver()
    s.set("timeout", timeout_ms)

    # Parse the full query into the solver
    parsed = parse_smt2_string(query)
    for assertion in parsed:
        s.add(assertion)

    result = s.check()

    if result == unsat:
        return {"status": "PROVEN", "counterexample": None}
    if result == sat:
        model = s.model()
        ce = {}
        for d in model.decls():
            if d.name() != "old_func" and d.name() != "new_func":
                ce[d.name()] = model[d].as_long() if model[d].is_int() else str(model[d])
        return {"status": "DISPROVEN", "counterexample": ce}
    return {"status": "TIMEOUT_INCONCLUSIVE", "counterexample": None}
