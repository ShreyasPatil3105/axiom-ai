import ast
from typing import Literal

CheckStatus = Literal["COMPATIBLE", "SIGNATURE_MISMATCH", "SIDE_EFFECT_CHANGED", "UNRESOLVED_DYNAMIC"]


def check_call_site_compatibility(
    new_function_code: str,
    call_site: dict,
) -> dict:
    """Compare the new function's signature against a single call site.

    new_function_code: the migrated function's source code
    call_site: dict from find_call_sites() with keys:
        file_path, line_number, call_expression, caller_function

    Returns:
        {status: CheckStatus, detail: str}
    """
    tree = ast.parse(new_function_code.strip())
    func = tree.body[0]
    if not isinstance(func, ast.FunctionDef):
        return {"status": "UNRESOLVED_DYNAMIC", "detail": "New function code is not a valid function definition"}

    new_params = [arg.arg for arg in func.args.args]
    new_defaults = len(func.args.defaults)
    has_varargs = func.args.vararg is not None
    has_kwargs = func.args.kwarg is not None

    # Check for dynamic patterns we cannot statically resolve
    call_expr = call_site.get("call_expression", "")
    dynamic_patterns = ['getattr', 'eval', 'exec', 'globals()', 'locals()', '__import__']
    call_lower = call_expr.lower()
    for pattern in dynamic_patterns:
        if pattern in call_lower:
            return {
                "status": "UNRESOLVED_DYNAMIC",
                "detail": f"Call expression contains dynamic pattern '{pattern}' which cannot be statically resolved",
            }

    # Check if the call expression uses named args that no longer exist
    call_expr = call_site.get('call_expression', '')
    if '(' in call_expr:
        args_part = call_expr.split('(', 1)[1].rstrip(')')
        if '=' in args_part:
            # Named argument usage — check against new params
            named_args = [a.split('=')[0].strip() for a in args_part.split(',') if '=' in a]
            for arg in named_args:
                if arg not in new_params:
                    return {
                        "status": "SIGNATURE_MISMATCH",
                        "detail": f"Call site uses named argument '{arg}' which no longer exists in new signature",
                    }

    # Check positional arg count
    # Count args in call expression (naive split on comma)
    if '(' in call_expr:
        args_part = call_expr.split('(', 1)[1].rstrip(')').strip()
        if args_part:
            positional_args = [a for a in args_part.split(',') if '=' not in a]
            required_params = len(new_params) - new_defaults
            if has_varargs:
                # Unlimited positional args — compatible
                pass
            elif len(positional_args) < required_params:
                return {
                    "status": "SIGNATURE_MISMATCH",
                    "detail": f"Call site provides {len(positional_args)} positional args but new function requires {required_params}",
                }

    # Check for side-effect changes (writes to globals, self, or passed objects)
    side_effect_nodes = []
    for subnode in ast.walk(func):
        if isinstance(subnode, ast.Assign):
            for target in subnode.targets:
                if isinstance(target, ast.Name) and target.id in func.args.args[0].arg if hasattr(func.args.args[0], 'arg') else False:
                    pass  # Assignment to local param — not a side effect
                elif isinstance(target, ast.Attribute):
                    side_effect_nodes.append(ast.unparse(target))
        elif isinstance(subnode, ast.Global):
            side_effect_nodes.extend(subnode.names)

    if side_effect_nodes:
        return {
            "status": "SIDE_EFFECT_CHANGED",
            "detail": f"New function writes to external state: {', '.join(side_effect_nodes[:3])}",
        }

    return {"status": "COMPATIBLE", "detail": "Signature check passed"}
