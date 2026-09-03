import ast
import hashlib
import json
from pathlib import Path


def index_repo(repo_path: str | Path, exclude_dirs: list[str] | None = None) -> dict:
    """Walk a repo, parse every .py file with ast, extract function/class
    definitions and call expressions, return a dict keyed by file path.

    Returns:
        {
          "files": {file_path: {"functions": [...], "classes": [...], "calls": [...]}},
          "total_files": int,
          "total_functions": int,
        }
    """
    if exclude_dirs is None:
        exclude_dirs = ['node_modules', 'venv', 'build', 'dist', '.git', '__pycache__']

    repo_path = Path(repo_path)
    files = {}
    total_files = 0
    total_functions = 0

    for py_file in repo_path.rglob('*.py'):
        rel_path = py_file.relative_to(repo_path)
        parts = rel_path.parts

        # Skip excluded directories
        if any(excluded in parts for excluded in exclude_dirs):
            continue

        try:
            source = py_file.read_text()
            tree = ast.parse(source)
            visitor = RepoVisitor()
            visitor.visit(tree)

            files[str(rel_path)] = {
                'functions': visitor.functions,
                'classes': visitor.classes,
            }
            total_files += 1
            total_functions += len(visitor.functions)
        except (SyntaxError, UnicodeDecodeError):
            continue

    return {
        'files': files,
        'total_files': total_files,
        'total_functions': total_functions,
    }


def extract_function_info(node: ast.FunctionDef, parent_class: str | None = None) -> dict:
    """Extract qualified name, parameters, and body call expressions from a function definition."""
    qualified_name = f"{parent_class}.{node.name}" if parent_class else node.name

    params = []
    for arg in node.args.args:
        params.append({
            "name": arg.arg,
            "annotation": ast.unparse(arg.annotation) if arg.annotation else None,
        })

    # Find all Call expressions inside the function body
    # Use ast.unparse on the full Call node to capture arguments too
    calls = []
    for subnode in ast.walk(node):
        if isinstance(subnode, ast.Call):
            try:
                calls.append(ast.unparse(subnode))
            except Exception:
                if isinstance(subnode.func, ast.Name):
                    calls.append(subnode.func.id)
                elif isinstance(subnode.func, ast.Attribute):
                    calls.append(ast.unparse(subnode.func))

    return {
        "qualified_name": qualified_name,
        "params": params,
        "calls": calls,
        "lineno": node.lineno,
    }


class RepoVisitor(ast.NodeVisitor):
    """Walks a single file's AST, collecting function/class definitions and calls."""

    def __init__(self):
        self.functions = []
        self.classes = []

    def visit_ClassDef(self, node):
        self.classes.append(node.name)
        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                self.functions.append(extract_function_info(item, parent_class=node.name))
        # Don't call generic_visit — we've already handled the body manually
        for item in node.body:
            if not isinstance(item, ast.FunctionDef):
                self.visit(item)

    def visit_FunctionDef(self, node):
        self.functions.append(extract_function_info(node))
        # Don't call generic_visit to avoid double-counting nested functions
