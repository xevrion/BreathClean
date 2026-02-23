This repository includes a custom merge driver that prefers the incoming ("theirs") side during merges.

Setup

- Unix / Git Bash:
  - Run: `./scripts/setup-merge-theirs.sh`
- Windows PowerShell:
  - Run: `./scripts/setup-merge-theirs.ps1`

Notes

- After registering the driver, Git will use the 'theirs' version for all files during merges.
- To accept incoming changes for an ongoing conflict manually:

```powershell
git checkout --theirs -- .
git add -A
git commit -m "Accept incoming changes (theirs) for merge"
```

Be cautious: this will overwrite local changes with incoming ones for files that conflict.
