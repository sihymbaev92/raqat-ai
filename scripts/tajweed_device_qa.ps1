# Tajweed colors — automated device QA (Hatim page 1 + Surah 1).
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/tajweed_device_qa.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/tajweed_device_qa.ps1 -SkipBuild
#
# Phone: USB debugging ON → Allow RSA fingerprint when prompted.

param(
  [switch]$SkipBuild,
  [int]$WaitAuthorizeSec = 180,
  [string]$Apk = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $Root "mobile\qa-tajweed-device"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Find-Adb {
  if (Get-Command adb -ErrorAction SilentlyContinue) { return "adb" }
  $c = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
  if (Test-Path $c) { return $c }
  return $null
}

function Wait-AuthorizedDevice($adb, $maxSec) {
  $deadline = (Get-Date).AddSeconds($maxSec)
  while ((Get-Date) -lt $deadline) {
    $lines = & $adb devices 2>&1
    foreach ($line in $lines) {
      if ($line -match "^(\S+)\s+device\s*$") { return $Matches[1] }
      if ($line -match "unauthorized") {
        Write-Host "→ Телефон: USB debugging → Allow (RSA)"
      }
    }
    Start-Sleep -Seconds 4
  }
  return $null
}

function Invoke-Adb($adb, $serial, [string[]]$Args) {
  & $adb -s $serial @Args
  if ($LASTEXITCODE -ne 0) { throw "adb $($Args -join ' ') failed ($LASTEXITCODE)" }
}

function Shot($adb, $serial, $name) {
  Invoke-Adb $adb $serial @("shell", "screencap", "-p", "/sdcard/tajweed-qa.png")
  $dest = Join-Path $OutDir "$name.png"
  Invoke-Adb $adb $serial @("pull", "/sdcard/tajweed-qa.png", $dest)
  return $dest
}

function Test-DeepLinkNoCrash($adb, $serial, $uri, $waitSec = 8) {
  & $adb -s $serial logcat -c 2>&1 | Out-Null
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $adb -s $serial shell am start -a android.intent.action.VIEW -d $uri -p kz.raqat.app 2>&1 | Out-Null
  $ErrorActionPreference = $prev
  Start-Sleep -Seconds $waitSec
  $log = & $adb -s $serial logcat -d 2>&1 | Out-String
  return -not ($log -match "FATAL EXCEPTION|AndroidRuntime.*FATAL")
}

function Test-UiHasArabic($adb, $serial) {
  & $adb -s $serial shell uiautomator dump /sdcard/tajweed-ui.xml 2>&1 | Out-Null
  $xml = (& $adb -s $serial shell cat /sdcard/tajweed-ui.xml 2>&1) -join "`n"
  if ($xml -match "[\u0600-\u06FF]") { return $true }
  return $false
}

function Test-UiHasTofu($adb, $serial) {
  & $adb -s $serial shell uiautomator dump /sdcard/tajweed-ui.xml 2>&1 | Out-Null
  $xml = (& $adb -s $serial shell cat /sdcard/tajweed-ui.xml 2>&1) -join "`n"
  if ($xml -match "&#65533;|\uFFFD|replacement") { return $true }
  return $false
}

Write-Host "== Tajweed device QA =="

$adb = Find-Adb
if (-not $adb) { throw "adb not found" }

$serial = Wait-AuthorizedDevice $adb $WaitAuthorizeSec
if (-not $serial) { throw "No authorized device in ${WaitAuthorizeSec}s" }
Write-Host "OK device $serial"

if (-not $Apk) {
  $Apk = Join-Path $Root "mobile\android\app\build\outputs\apk\release\app-release.apk"
}
if (-not $SkipBuild -and -not (Test-Path $Apk)) {
  Write-Host "== Build release APK =="
  Push-Location (Join-Path $Root "mobile")
  npm run build:apk
  if ($LASTEXITCODE -ne 0) { throw "build:apk failed" }
  Pop-Location
}
if (-not (Test-Path $Apk)) { throw "APK missing: $Apk" }

Write-Host "== Install APK =="
Invoke-Adb $adb $serial @("install", "-r", $Apk)

$results = [ordered]@{
  updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  device_serial = $serial
  scenarios = @()
}

$scenarios = @(
  @{
    id = "hatim_tajweed_on"
    label = "Hatim page 1 + tajweed=1"
    uri = "imamai://more/mushaf-book/1?continuousMushaf=1&focusSurah=1&focusAyah=1&tajweed=1"
    waitSec = 14
  },
  @{
    id = "hatim_tajweed_off"
    label = "Hatim page 1 QCF4 (tajweed off)"
    uri = "imamai://more/mushaf-book/1?continuousMushaf=1&focusSurah=1&focusAyah=1"
    waitSec = 10
  },
  @{
    id = "surah1_classic"
    label = "Surah 1 classic list"
    uri = "imamai://more/surah/1"
    waitSec = 8
  }
)

foreach ($sc in $scenarios) {
  Write-Host "`n--- $($sc.label) ---"
  $crashFree = Test-DeepLinkNoCrash $adb $serial $sc.uri $sc.waitSec
  $png = Shot $adb $serial $sc.id
  $hasArabic = Test-UiHasArabic $adb $serial
  $hasTofu = Test-UiHasTofu $adb $serial
  $pass = $crashFree -and $hasArabic -and (-not $hasTofu)
  Write-Host $(if ($pass) { "PASS" } else { "FAIL" }) " crashFree=$crashFree arabic=$hasArabic tofu=$hasTofu → $png"
  $results.scenarios += [ordered]@{
    id = $sc.id
    uri = $sc.uri
    pass = $pass
    crash_free = $crashFree
    ui_arabic = $hasArabic
    ui_tofu = $hasTofu
    screenshot = $png
  }
}

$jsonPath = Join-Path $OutDir "tajweed-qa-results.json"
($results | ConvertTo-Json -Depth 6) | Set-Content $jsonPath -Encoding utf8
Write-Host "`nOK saved $jsonPath"

$allPass = ($results.scenarios | Where-Object { -not $_.pass }).Count -eq 0
if (-not $allPass) { exit 1 }
exit 0
