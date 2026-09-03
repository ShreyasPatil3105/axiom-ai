import ast


BINOPS = {
    ast.Add: "+",
    ast.Sub: "-",
    ast.Mult: "*",
    ast.Div: "div",
    ast.Mod: "mod",
}

COMPARE_OPS = {
    ast.Eq: "=",
    ast.NotEq: "distinct",
    ast.Lt: "<",
    ast.LtE: "<=",
    ast.Gt: ">",
    ast.GtE: ">=",
}


def encode_expr(node: ast.AST) -> str:
    """Convert a Python AST expression to an SMT-LIB2 expression string."""
    if isinstance(node, ast.Constant):
        return str(node.value)
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.BinOp):
        op = BINOPS.get(type(node.op))
        if op is None:
            raise NotImplementedError(f"Unsupported binop: {type(node.op)}")
        left = encode_expr(node.left)
        right = encode_expr(node.right)
        if op == "div":
            return f"(div {left} {right})"
        if op == "mod":
            return f"(mod {left} {right})"
        return f"({op} {left} {right})"
    if isinstance(node, ast.UnaryOp):
        if isinstance(node.op, ast.USub):
            operand = encode_expr(node.operand)
            return f"(- {operand})"
        raise NotImplementedError(f"Unsupported unary op: {type(node.op)}")
    if isinstance(node, ast.Compare):
        if len(node.ops) != 1:
            raise NotImplementedError("Only single comparisons supported")
        op = COMPARE_OPS.get(type(node.ops[0]))
        if op is None:
            raise NotImplementedError(f"Unsupported comparison: {type(node.ops[0])}")
        left = encode_expr(node.left)
        right = encode_expr(node.comparators[0])
        if op == "distinct":
            return f"(distinct {left} {right})"
        return f"({op} {left} {right})"
    if isinstance(node, ast.IfExp):
        cond = encode_expr(node.test)
        then_expr = encode_expr(node.body)
        else_expr = encode_expr(node.orelse)
        return f"(ite {cond} {then_expr} {else_expr})"
    raise NotImplementedError(f"Unsupported expression node: {type(node)}")


def function_to_smt(code: str, name_prefix: str = "f") -> str:
    """Convert a Python function body to an SMT-LIB2 expression.
    Handles simple arithmetic, comparisons, if/elif/else, and bounded for loops."""
    tree = ast.parse(code)
    func = tree.body[0]
    if not isinstance(func, ast.FunctionDef):
        raise ValueError("Code must be a single function definition")

    params = [arg.arg for arg in func.args.args]
    param_str = " ".join(f"({p} Int)" for p in params)

    # Build the body as a nested expression
    body_expr = stmts_to_expr(func.body)

    return f"(define-fun {name_prefix} ({param_str}) Int {body_expr})"


def stmts_to_expr(stmts: list) -> str:
    """Convert a list of statements to a single SMT expression using let bindings."""
    # Build up backwards: start with the last statement's expression,
    # wrap each previous assignment as a let binding.
    if not stmts:
        return "0"

    # Collect assignments and find the final expression
    bindings = []
    final_expr = "0"

    for stmt in stmts:
        if isinstance(stmt, ast.Assign):
            target = stmt.targets[0].id
            value = encode_expr(stmt.value)
            bindings.append((target, value))
        elif isinstance(stmt, ast.Return):
            final_expr = encode_expr(stmt.value)
        elif isinstance(stmt, ast.If):
            # Build ite with body expressions
            cond = encode_expr(stmt.test)
            then_expr = stmts_to_expr(stmt.body)
            else_expr = stmts_to_expr(stmt.orelse) if stmt.orelse else final_expr
            final_expr = f"(ite {cond} {then_expr} {else_expr})"
        elif isinstance(stmt, ast.For):
            # Unroll bounded loop: for i in range(N): body
            target = stmt.target.id
            if not isinstance(stmt.iter, ast.Call) or not isinstance(stmt.iter.func, ast.Name):
                raise NotImplementedError("Only 'for i in range(N)' loops supported")
            if stmt.iter.func.id != "range":
                raise NotImplementedError("Only 'for i in range(N)' loops supported")
            if len(stmt.iter.args) != 1:
                raise NotImplementedError("Only range(N) with single arg supported")
            n = stmt.iter.args[0].value
            # Unroll by substituting i with 0, 1, ..., n-1
            unrolled = []
            for i in range(n):
                # Replace target variable with constant i in body
                unrolled.append(substitute_var(stmt.body, target, i))
            final_expr = stmts_to_expr([s for sublist in unrolled for s in sublist])
        else:
            raise NotImplementedError(f"Unsupported statement: {type(stmt)}")

    # Wrap in let bindings
    for target, value in reversed(bindings):
        final_expr = f"(let (({target} {value})) {final_expr})"

    return final_expr


def substitute_var(stmts: list, var_name: str, value: int) -> list:
    """Replace all occurrences of var_name with the constant value."""
    # We don't need complex substitution — just add an assignment binding.
    return [ast.Assign(targets=[ast.Name(id=var_name, ctx=ast.Store())], value=ast.Constant(value=value))] + stmts
