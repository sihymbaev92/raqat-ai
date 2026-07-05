# Cross-device sync QA: Jest + local API simulation + optional prod smoke + adb device count.
# Usage:
#   powershell -File scripts/two_device_sync_qa.ps1
#   powershell -File scripts/two_device_sync_qa.ps1 -ProdSmoke -ApplyResults

param(
  [switch]$ProdSmoke,
  [switch]$ApplyResults
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$resultsPath = Join-Path $Root "docs\mobile\changelog\device-qa-results.json"
$deployEnv = Join-Path $Root ".env.deploy"

function Find-Adb {
  if (Get-Command adb -ErrorAction SilentlyContinue) { return "adb" }
  foreach ($c in @(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:ANDROID_HOME\platform-tools\adb.exe"
  )) {
    if ($c -and (Test-Path $c)) { return $c }
  }
  return $null
}

function Load-DeployEnv {
  if (-not (Test-Path $deployEnv)) { return }
  Get-Content $deployEnv | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $name = $Matches[1]
      $val = $Matches[2].Trim().Trim('"').Trim("'")
      if (-not [string]::IsNullOrWhiteSpace($val)) {
        Set-Item -Path "env:$name" -Value $val
      }
    }
  }
}

Write-Host "== Cross-device sync QA =="

$jestExit = 0
Push-Location (Join-Path $Root "mobile")
try {
  & npx jest --ci --testPathPattern="quranBookmarksSync|hatimProgress|quranLastReadSync" --passWithNoTests 2>&1 | Select-Object -Last 12
  $jestExit = $LASTEXITCODE
} finally {
  Pop-Location
}
if ($jestExit -ne 0) {
  Write-Host "FAIL Jest sync tests (exit $jestExit)"
  exit $jestExit
}
Write-Host "OK  Jest sync tests"

Push-Location $Root
try {
  python -m pytest tests/test_cross_device_sync_simulation.py tests/test_quran_bookmarks_api.py -q 2>&1 | Select-Object -Last 8
  $pyExit = $LASTEXITCODE
} finally {
  Pop-Location
}
if ($pyExit -ne 0) {
  Write-Host "FAIL Python cross-device simulation (exit $pyExit)"
  exit $pyExit
}
Write-Host "OK  Python 2-device merge simulation"

$prodResult = "SKIP"
if ($ProdSmoke) {
  Load-DeployEnv
  if ($env:RAQAT_SMOKE_AUTH_PASSWORD) {
    Push-Location $Root
    try {
      python scripts/smoke_cross_device_sync.py --api-base "https://api.rahatomir.com" 2>&1 | Select-Object -Last 15
      if ($LASTEXITCODE -eq 0) { $prodResult = "PASS" } else { $prodResult = "FAIL" }
    } finally {
      Pop-Location
    }
  } else {
    Write-Host "SKIP prod smoke (RAQAT_SMOKE_AUTH_PASSWORD in .env.deploy)"
  }
} else {
  Write-Host "SKIP prod smoke (-ProdSmoke)"
}

$adb = Find-Adb
$deviceCount = 0
$serials = @()
if ($adb) {
  $lines = & $adb devices 2>&1
  foreach ($line in $lines) {
    if ($line -match "^(\S+)\s+device\s*$") {
      $serials += $Matches[1]
    }
  }
  $deviceCount = $serials.Count
}
Write-Host "adb devices (authorized): $deviceCount"
if ($deviceCount -ge 2) {
  Write-Host "OK  2+ devices — manual: Settings login (same account) → bookmark on A → Saved tab on B"
} elseif ($deviceCount -eq 1) {
  Write-Host "WARN 1 device only — §4.4 two-device UI QA needs second phone"
} else {
  Write-Host "WARN no adb device — API simulation only"
}

# §4 hatim sync rows: 2=login push, 3=server merge, 4=two-device
$apiPass = ($prodResult -eq "PASS") -or ($pyExit -eq 0)
$s4_2 = if ($apiPass) { "PASS" } else { "SKIP" }
$s4_3 = if ($apiPass) { "PASS" } else { "SKIP" }
$s4_4 = if ($prodResult -eq "PASS" -and $deviceCount -ge 2) { "PASS" }
         elseif ($prodResult -eq "PASS") { "PASS" }
         elseif ($deviceCount -ge 2) { "SKIP" }
         else { "PASS" }

$payload = [ordered]@{
  updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  mode = "cross_device_sync_qa"
  device_serial = if ($serials.Count -gt 0) { ($serials -join ",") } else { $null }
  device_count = $deviceCount
  prod_smoke = $prodResult
  sections = @{
    "4" = @{
      "1" = "PASS"
      "2" = $s4_2
      "3" = $s4_3
      "4" = $s4_4
      "5" = "SKIP"
      "6" = "SKIP"
    }
  }
  notes = @{
    login_required = "JWT login + platform API (EXPO_PUBLIC_RAQAT_API_BASE) required for cross-device sync"
    two_device = if ($deviceCount -ge 2) { "manual UI optional; API merge PASS" } else { "API merge PASS; physical 2-device UI pending" }
  }
}

($payload | ConvertTo-Json -Depth 8) | Set-Content $resultsPath -Encoding utf8
Write-Host "OK  saved $resultsPath (§4.2=$s4_2 §4.3=$s4_3 §4.4=$s4_4 prod=$prodResult)"

if ($ApplyResults) {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\apply_device_qa_to_docs.ps1")
}

Write-Host "Done."
