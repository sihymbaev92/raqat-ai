# Start RAQAT Expo app (mobile/). Set API URL for Metro bundle (EXPO_PUBLIC_RAQAT_API_BASE).
# Run platform API first: scripts\run_platform_api.ps1 -Dev (or start_raqat_local.ps1)
#
# Usage from repo root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\run_expo.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\run_expo.ps1 -AndroidEmulator
#   powershell -ExecutionPolicy Bypass -File .\scripts\run_expo.ps1 -ApiBase "http://192.168.1.10:8787"
param(
    [string]$ApiBase = "",
    [switch]$AndroidEmulator
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Mobile = Join-Path $Root "mobile"

if (-not (Test-Path (Join-Path $Mobile "package.json"))) {
    Write-Error "mobile/package.json not found."
}

if ($AndroidEmulator) {
    $ApiBase = "http://10.0.2.2:8787"
}
if ([string]::IsNullOrWhiteSpace($ApiBase)) {
    $ApiBase = "http://127.0.0.1:8787"
}

$env:EXPO_PUBLIC_RAQAT_API_BASE = $ApiBase
Set-Location $Mobile

Write-Host "EXPO_PUBLIC_RAQAT_API_BASE=$ApiBase"
Write-Host "Physical phone on Wi-Fi: use -ApiBase http://<PC_LAN_IP>:8787 (ipconfig)"
Write-Host "Starting Expo..."
& npm run start
