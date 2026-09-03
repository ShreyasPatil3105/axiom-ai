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
    raise NotImplementedError(f"Unsupported expression node: {type(node)}")


def encode_stmt(node: ast.AST) -> str:
    """Convert a Python AST statement to SMT-LIB2 string(s)."""
    if isinstance(node, ast.Assign):
        target = node.targets[0].id
        value = encode_expr(node.value)
        return f"(assert (= {target} {value}))"
    if isinstance(node, ast.Return):
        value = encode_expr(node.value)
        return f"(assert (= result {value}))"
    if isinstance(node, ast.If):
        cond = encode_expr(node.test)
        then_stmts = [encode_stmt(s) for s in node.body]
        else_stmts = [encode_stmt(s) for s in node.orelse] if node.orelse else []
        then_part = "\n  ".join(then_stmts)
        else_part = "\n  ".join(else_stmts) if else_stmts else "(assert true)"
        return f"(ite {cond}\n  {then_part}\n  {else_part})"
    if isinstance(node, ast.For):
        # Only handle: for i in range(N): body
        target = node.target.id
        if not isinstance(node.iter, ast.Call) or not isinstance(node.iter.func, ast.Name):
            raise NotImplementedError("Only 'for i in range(N)' loops supported")
        if node.iter.func.id != "range":
            raise NotImplementedError("Only 'for i in range(N)' loops supported")
        if len(node.iter.args) != 1:
            raise NotImplementedError("Only range(N) with single arg supported")
        n = node.iter.args[0].value
        body = "\n  ".join(encode_stmt(s) for s in node.body)
        lines = []
        for i in range(n):
            lines.append(f"; iteration {i}")
            lines.append(f"(assert (= {target} {i}))")
            lines.append(body)
        return "\n".join(lines)
    raise NotImplementedError(f"Unsupported statement node: {type(node)}")


def function_to_smt(code: str, name_prefix: str = "f") -> str:
    """Convert a Python function to SMT-LIB2 constraints.
    The output is a named function with parameters and a result variable."""
    tree = ast.parse(code)
    func = tree.body[0]
    if not isinstance(func, ast.FunctionDef):
        raise ValueError("Code must be a single function definition")

    params = [arg.arg for arg in func.args.args]
    param_str = " ".join(f"({p} Int)" for p in params)

    body_stmts = "\n".join(encode_stmt(s) for s in func.body)

    return f"""; Function: {func.name}
(define-fun {name_prefix} ({param_str}) Int
  (let ((result 0))
    {body_stmts}
    result
  )
)"""
