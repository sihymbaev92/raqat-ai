# Expo web — статикалық сайт (dist/). Windows.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
$env:RAQAT_EXPO_RELEASE_BUILD = "1"

function Invoke-NativeWebExport {
  if (Test-Path ".env.production") {
    Get-Content ".env.production" | ForEach-Object {
      if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim('"'), "Process")
      }
    }
  }
  npx expo export --platform web --output-dir dist
  if ($LASTEXITCODE -ne 0) {
    throw "expo export failed with exit code $LASTEXITCODE"
  }
}

$exported = $false
$bash = Get-Command bash -ErrorAction SilentlyContinue
if ($bash) {
  $mobileRoot = (Get-Location).Path -replace '\\', '/'
  bash -lc "export MOBILE_ROOT='$mobileRoot'; source scripts/load-raqat-expo-env.sh; npx expo export --platform web --output-dir dist"
  $exported = ($LASTEXITCODE -eq 0)
  if (-not $exported) {
    Write-Warning "bash-based export failed; retrying with native PowerShell env loader."
  }
}

if (-not $exported) {
  Invoke-NativeWebExport
}

node scripts/patch-web-boot-html.js
node scripts/copy-web-bundled-json.js
node scripts/copy-web-quran-assets.js

Write-Host ""
Write-Host "Done: mobile/dist/"
Write-Host "Local: npx serve dist -l 8090"
Write-Host "VPS deploy: docs/operations/web-app-deploy.md"
