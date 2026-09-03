import ast


FORBIDDEN_NODES = {
    ast.Call,          # function calls (print, open, input, etc.)
    ast.While,         # unbounded loops
    ast.Try,           # exceptions
    ast.Global,        # global state
    ast.Nonlocal,      # closure mutation
    ast.ClassDef,      # classes
    ast.Import,        # imports
    ast.ImportFrom,    # imports
}


def has_float_annotation(node: ast.FunctionDef) -> bool:
    """Return True if any parameter or return annotation is float."""
    for arg in node.args.args:
        if arg.annotation and ast.unparse(arg.annotation) == "float":
            return True
    if node.returns and ast.unparse(node.returns) == "float":
        return True
    return False


def has_forbidden_node(tree: ast.AST) -> bool:
    """Return True if the AST contains any node that makes code unprovable."""
    for node in ast.walk(tree):
        if type(node) in FORBIDDEN_NODES:
            return True
    return False


def has_for_loop(tree: ast.AST) -> bool:
    """Return True if the AST contains any for loop."""
    return any(isinstance(node, ast.For) for node in ast.walk(tree))


def classify(code: str) -> str:
    """Classify code as GREEN (provable), YELLOW (provable with bounded loops),
    or RED (fuzz-only fallback)."""
    tree = ast.parse(code)
    func = tree.body[0]
    if not isinstance(func, ast.FunctionDef):
        raise ValueError("Code must be a single function definition")

    if has_float_annotation(func) or has_forbidden_node(tree):
        return "RED"
    if has_for_loop(tree):
        return "YELLOW"
    return "GREEN"
