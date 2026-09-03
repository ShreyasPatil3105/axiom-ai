from engine_a2_integration.indexer import index_repo


def find_call_sites(index: dict, target_function: str) -> list[dict]:
    """Find every call site of target_function across the entire indexed repo.

    target_function: qualified name like 'helper' or 'Calculator.add'

    Returns list of dicts:
        {file_path, line_number, call_expression, caller_function}
    """
    call_sites = []

    for file_path, file_data in index['files'].items():
        for func in file_data['functions']:
            caller_name = func['qualified_name']

            for call in func.get('calls', []):
                # Extract the function name from the full call expression
                call_name = call.split('(')[0].strip()
                if call_name == target_function or call_name.endswith('.' + target_function):
                    call_sites.append({
                        'file_path': file_path,
                        'line_number': func['lineno'],
                        'call_expression': call,
                        'caller_function': caller_name,
                    })

    return call_sites
