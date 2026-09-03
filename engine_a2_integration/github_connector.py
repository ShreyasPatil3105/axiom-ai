import os
from git import Repo
import shutil

def clone_and_list_files(repo_url, clone_path):
    """
    Clones a GitHub repo and returns a list of file paths.
    Skips common non-source folders like node_modules, venv, build, dist, etc.
    """
    # Delete the folder if it already exists, so we start fresh
    if os.path.exists(clone_path):
        shutil.rmtree(clone_path)
    
    # Shallow clone: only downloads the latest commit (fast!)
    print(f"Cloning {repo_url} ...")
    repo = Repo.clone_from(repo_url, clone_path, depth=1)
    
    # Folders to ignore (dependencies, build outputs, git metadata)
    SKIP_DIRS = {'.git', 'node_modules', 'venv', 'env', 'build', 'dist', '__pycache__', '.vscode', 'target', 'out'}
    
    file_list = []
    
    # Walk through the cloned directory
    for root, dirs, files in os.walk(clone_path):
        # Remove skipped directories so we don't go into them
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        
        # Get the relative path from the clone root
        rel_path = os.path.relpath(root, clone_path)
        if rel_path == '.':
            rel_path = ''
        
        for file in files:
            # Ignore hidden files like .DS_Store if you want, but we'll include them for now
            full_path = os.path.join(rel_path, file)
            file_list.append(full_path)
    
    return file_list

if __name__ == "__main__":
    # Test it with a small public repo
    # Change this to your demo repo later
    test_url = "https://github.com/ShreyasPatil3105/axiom-ai.git"
    test_path = "temp_clone"
    
    files = clone_and_list_files(test_url, test_path)
    print(f"Found {len(files)} files:")
    for f in files:
        print(f"  - {f}")
    
    # Clean up after test
    #if os.path.exists(test_path):
     #   shutil.rmtree(test_path)
      #  print("Cleaned up temporary clone.")