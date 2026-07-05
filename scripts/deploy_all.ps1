# Deploy rahatomir.com web + Timur supermarket
# Usage: powershell -ExecutionPolicy Bypass -File scripts/deploy_all.ps1
#        powershell -ExecutionPolicy Bypass -File scripts/deploy_all.ps1 -SkipWebBuild
param(
  [switch]$SkipWebBuild,
  [switch]$SupermarketOnly,
  [switch]$WebOnly
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

if (-not $WebOnly) {
  Write-Host "======== SUPERMARKET ========"
  $validateArgs = @()
  if ($SupermarketOnly) { $validateArgs += "-ValidateOnly" }
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\deploy_supermarket.ps1") @validateArgs
  if ($LASTEXITCODE -ne 0) { throw "supermarket deploy failed" }
}

if ($SupermarketOnly) { exit 0 }

Write-Host "======== MAIN WEB ========"
$webArgs = @()
if ($SkipWebBuild) { $webArgs += "-SkipBuild" }
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\vps_deploy_web.ps1") @webArgs
if ($LASTEXITCODE -ne 0) { throw "web deploy failed" }

Write-Host "======== ALL DONE ========"
