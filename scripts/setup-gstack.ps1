# Wire botme to the local gstack checkout for Cursor skills runtime.
# Re-run after `git pull` in gstack if binaries or assets change.

$ErrorActionPreference = "Stop"
$GstackSource = "C:\Users\dsc-2\projects\gstack"
$ProjectRoot = Split-Path $PSScriptRoot -Parent

function Ensure-Junction([string]$Link, [string]$Target) {
    if (-not (Test-Path $Target)) {
        Write-Warning "Missing gstack path: $Target"
        return
    }
    $parent = Split-Path $Link -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    if (Test-Path $Link) {
        Remove-Item $Link -Force -Recurse
    }
    cmd /c mklink /J "$Link" "$Target" | Out-Null
}

$runtimeRoots = @(
    Join-Path $ProjectRoot ".cursor\skills\gstack"
    Join-Path $env:USERPROFILE ".cursor\skills\gstack"
)

foreach ($root in $runtimeRoots) {
    New-Item -ItemType Directory -Force -Path (Join-Path $root "review") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $root "browse") | Out-Null

    Ensure-Junction (Join-Path $root "bin") (Join-Path $GstackSource "bin")
    Ensure-Junction (Join-Path $root "browse\dist") (Join-Path $GstackSource "browse\dist")
    Ensure-Junction (Join-Path $root "browse\bin") (Join-Path $GstackSource "browse\bin")
    Ensure-Junction (Join-Path $root "gstack-upgrade") (Join-Path $GstackSource "gstack-upgrade")

    Copy-Item (Join-Path $GstackSource "ETHOS.md") (Join-Path $root "ETHOS.md") -Force
    Copy-Item (Join-Path $GstackSource ".cursor\skills\gstack\SKILL.md") (Join-Path $root "SKILL.md") -Force

    foreach ($file in @("checklist.md", "TODOS-format.md")) {
        $src = Join-Path $GstackSource "review\$file"
        if (Test-Path $src) {
            Copy-Item $src (Join-Path $root "review\$file") -Force
        }
    }
}

Write-Host "gstack runtime linked from $GstackSource"
Write-Host "  project: $ProjectRoot\.cursor\skills\gstack"
Write-Host "  global:  $env:USERPROFILE\.cursor\skills\gstack"
