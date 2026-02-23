#!/bin/sh
# Register the 'theirs' merge driver locally and make scripts executable.
git config --local merge.theirs.name "Keep theirs (incoming) during merges"
git config --local merge.theirs.driver "./scripts/git-merge-theirs.sh %O %A %B"
chmod +x ./scripts/git-merge-theirs.sh || true
chmod +x ./scripts/git-merge-theirs.ps1 || true
echo "Registered merge.theirs driver (local git config)."
