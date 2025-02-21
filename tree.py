import os
import fnmatch

def get_ignore_patterns():
    ignore_patterns = []
    if os.path.exists('.gitignore'):
        with open('.gitignore', 'r') as f:
            ignore_patterns = [line.strip() for line in f.readlines() if line.strip() and not line.startswith('#')]
    return ignore_patterns

def should_ignore(file_path, ignore_patterns):
    if 'node_modules' in file_path or '.git' in file_path:
        return True
    
    for pattern in ignore_patterns:
        if fnmatch.fnmatch(file_path, pattern):
            return True
    return False

def print_tree(dir_path, ignore_patterns, prefix=""):
    try:
        items = os.listdir(dir_path)
    except PermissionError:
        return

    for item in items:
        full_path = os.path.join(dir_path, item)

        if should_ignore(full_path, ignore_patterns):
            continue

        print(f"{prefix}|_ {item}")

        if os.path.isdir(full_path):
            print_tree(full_path, ignore_patterns, prefix + "   ")

def generate_tree():
    ignore_patterns = get_ignore_patterns()
    print_tree('.', ignore_patterns)

generate_tree()
