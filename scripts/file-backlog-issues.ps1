# File local backlog issues to GitHub when gh is available
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$issuesDir = Join-Path $root "docs\backlog\issues"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "gh CLI not found. Install: winget install GitHub.cli"
    Write-Host "Then: gh auth login"
    exit 1
}

$labels = @("sprint:S1","sprint:S2","sprint:S3","sprint:S4","sprint:S5","sprint:S6","sprint:S7","sprint:S8")
foreach ($label in $labels) {
    gh label create $label --color "0E8A16" --force 2>$null
}

$files = Get-ChildItem $issuesDir -Filter "*.md" | Sort-Object Name
$i = 0
foreach ($file in $files) {
    $title = (Get-Content $file.FullName -TotalCount 1) -replace '^#\s*', ''
    $body = Get-Content $file.FullName -Raw
    $label = "sprint:S$($i + 1)"
    Write-Host "Creating: $title"
    gh issue create --title $title --body $body --label $label
    $i++
}
Write-Host "Done. $($files.Count) issues created."
