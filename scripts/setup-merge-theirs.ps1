Write-Host "Registering merge.theirs driver..."
git config --local merge.theirs.name "Keep theirs (incoming) during merges"
git config --local merge.theirs.driver ".\scripts\git-merge-theirs.ps1 %O %A %B"
Write-Host "Registered merge.theirs driver (local git config)."
