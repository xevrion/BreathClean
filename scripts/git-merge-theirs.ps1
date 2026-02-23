Param($O, $A, $B)
if (-not (Test-Path $B)) {
    Write-Error "git-merge-theirs.ps1: missing 'their' file"
    exit 1
}
Get-Content -Raw -LiteralPath $B | Set-Content -LiteralPath $A -Encoding UTF8
exit 0
