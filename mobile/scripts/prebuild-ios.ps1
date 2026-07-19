# Regenerate mobile/ios on Windows via Docker (Expo skips iOS prebuild on win32).
$ErrorActionPreference = "Stop"
$mobileDir = Split-Path $PSScriptRoot -Parent
Set-Location $mobileDir

Write-Host "=== RAHAT OMIR iOS prebuild (Docker) ===" -ForegroundColor Cyan
Write-Host "Bundle ID: kz.raqat.app | Xcode target: RAHATOMIR"
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "Docker CLI not found. Install Docker Desktop or run prebuild on macOS (npm run prebuild:ios:unix)."
}

$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Docker daemon not running. Starting Docker Desktop..." -ForegroundColor Yellow
  $dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerExe) {
    Start-Process $dockerExe | Out-Null
    $deadline = (Get-Date).AddMinutes(3)
    while ((Get-Date) -lt $deadline) {
      docker info 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) { break }
      Start-Sleep -Seconds 5
    }
  }
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker is not ready. Start Docker Desktop manually, then retry."
  }
}

$mount = (Resolve-Path $mobileDir).Path
if ($mount -match "^([A-Za-z]):\\") {
  $drive = $Matches[1].ToLower()
  $rest = $mount.Substring(2) -replace "\\", "/"
  $mount = "/${drive}${rest}"
}

docker run --rm `
  -v "${mount}:/app" `
  -w /app `
  -e RAQAT_INCLUDE_NATIVE_EXPO_CONFIG=1 `
  -e RAQAT_EXPO_RELEASE_BUILD=1 `
  -e CI=1 `
  node:22-bookworm `
  bash -lc "npm install --ignore-scripts >/dev/null 2>&1 && npx expo prebuild --platform ios --no-install --clean"

if ($LASTEXITCODE -ne 0) {
  Write-Error "iOS prebuild failed (exit $LASTEXITCODE)."
}

Write-Host ""
Write-Host "Done: mobile/ios/ updated." -ForegroundColor Green
Write-Host "Mac/Xcode: cd ios && pod install && open RAHATOMIR.xcworkspace"
Write-Host "Cloud IPA: npm run build:ios  (EAS, Apple Developer account required)"
