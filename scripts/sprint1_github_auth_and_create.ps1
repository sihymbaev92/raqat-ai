# One-shot: GitHub device login (if needed) + create Sprint 1 issues.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/sprint1_github_auth_and_create.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "Installing GitHub CLI..." -ForegroundColor Yellow
    winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "GitHub login required. Browser will open — approve device code." -ForegroundColor Cyan
    Start-Process "https://github.com/login/device"
    gh auth login --hostname github.com --git-protocol https --web
}

Push-Location $Root
try {
    & powershell -ExecutionPolicy Bypass -File "$Root\scripts\sprint1_create_github_issues.ps1"
}
finally {
    Pop-Location
}
