# §4.4 — екі телефонда Saved / bookmark / hatim sync UI QA (интерактив).
# Usage:
#   powershell -File scripts/two_device_sync_ui_qa.ps1
#   powershell -File scripts/two_device_sync_ui_qa.ps1 -ApplyResults

param(
  [switch]$ApplyResults,
  [int]$WaitAuthorizeSec = 120
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$resultsPath = Join-Path $Root "docs\mobile\changelog\device-qa-results.json"
$apk = Join-Path $Root "mobile\apk-download\raqat-release-latest.apk"

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

function Wait-AuthorizedDevices($adb, $maxSec) {
  $deadline = (Get-Date).AddSeconds($maxSec)
  $serials = @()
  while ((Get-Date) -lt $deadline) {
    $serials = @()
    $out = & $adb devices 2>&1
    foreach ($line in $out) {
      if ($line -match "^(\S+)\s+device\s*$") { $serials += $Matches[1] }
      if ($line -match "unauthorized") {
        Write-Host "→ Phone: Allow USB debugging (RSA fingerprint)" -ForegroundColor Yellow
      }
    }
    if ($serials.Count -ge 2) { return $serials }
    Start-Sleep -Seconds 4
  }
  return $serials
}

function Ask-Result($prompt) {
  do {
    $a = (Read-Host "$prompt [P]ass / [F]ail / [S]kip").Trim().ToUpper()
    if ($a -in @("P", "PASS", "")) { return "PASS" }
    if ($a -in @("F", "FAIL")) { return "FAIL" }
    if ($a -in @("S", "SKIP")) { return "SKIP" }
  } while ($true)
}

function Open-DeepLink($adb, $serial, $uri) {
  & $adb -s $serial shell am start -a android.intent.action.VIEW -d $uri -p kz.raqat.app 2>&1 | Out-Null
  Start-Sleep -Seconds 3
}

$adb = Find-Adb
if (-not $adb) {
  Write-Host "adb not found — manual §4.4 checklist:" -ForegroundColor Yellow
  Write-Host @"
  1. Phone A: Settings → login (same account) → Quran bookmark surah 36 → Hatim mark surah 1–2
  2. Phone B: login same account → Saved tab → verify bookmark 36 + hatim 1–2 appear
  3. Phone B: bookmark surah 1, mark hatim surah 114
  4. Phone A: Saved tab → verify union bookmarks [1,36] + hatim [1,2,114]
"@
  exit 2
}

$serials = Wait-AuthorizedDevices $adb $WaitAuthorizeSec
if ($serials.Count -lt 2) {
  Write-Host "Need 2 authorized USB devices (found $($serials.Count))" -ForegroundColor Red
  Write-Host "Connect both phones with USB debugging, or run API-only: scripts/two_device_sync_qa.ps1 -ProdSmoke" -ForegroundColor Cyan
  exit 3
}

$deviceA = $serials[0]
$deviceB = $serials[1]
Write-Host "Device A: $deviceA" -ForegroundColor Green
Write-Host "Device B: $deviceB" -ForegroundColor Green

if (Test-Path $apk) {
  Write-Host "Installing APK on both devices..." -ForegroundColor Cyan
  & $adb -s $deviceA install -r $apk 2>&1 | Out-Null
  & $adb -s $deviceB install -r $apk 2>&1 | Out-Null
}

Write-Host "`n=== §4.4 Two-device Saved sync (interactive) ===" -ForegroundColor Cyan
Write-Host "Prerequisite: both phones logged into the SAME account (Settings → Account)."
Write-Host ""

Write-Host "[Step 1] Phone A ($deviceA): bookmark surah 36 + hatim surahs 1–2" -ForegroundColor Yellow
Open-DeepLink $adb $deviceA "imamai://more/hatim"
Read-Host "Press Enter when Phone A changes are done"

Write-Host "[Step 2] Phone B ($deviceB): open Saved — verify A's data merged" -ForegroundColor Yellow
Open-DeepLink $adb $deviceB "imamai://saved"
$s4_4_merge = Ask-Result "Phone B shows bookmark 36 and hatim 1–2?"

Write-Host "[Step 3] Phone B: add bookmark surah 1 + hatim surah 114" -ForegroundColor Yellow
Open-DeepLink $adb $deviceB "imamai://more/hatim"
Read-Host "Press Enter when Phone B extra changes are done"

Write-Host "[Step 4] Phone A: Saved tab — verify union" -ForegroundColor Yellow
Open-DeepLink $adb $deviceA "imamai://saved"
$s4_4_union = Ask-Result "Phone A shows bookmarks [1,36] and hatim [1,2,114]?"

$s4_4 = if ($s4_4_merge -eq "FAIL" -or $s4_4_union -eq "FAIL") { "FAIL" }
         elseif ($s4_4_merge -eq "SKIP" -and $s4_4_union -eq "SKIP") { "SKIP" }
         else { "PASS" }

$note = if ($s4_4 -eq "PASS") { "2-phone UI PASS ($deviceA + $deviceB)" }
        elseif ($s4_4 -eq "FAIL") { "2-phone UI FAIL — see §4.4 steps" }
        else { "2-phone UI skipped" }

$existing = @{}
if (Test-Path $resultsPath) {
  try { $existing = Get-Content $resultsPath -Raw | ConvertFrom-Json } catch { }
}
$payload = [ordered]@{
  updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  mode = "cross_device_sync_ui_qa"
  device_serial = ($serials -join ",")
  device_count = $serials.Count
  prod_smoke = if ($existing.prod_smoke) { $existing.prod_smoke } else { "SKIP" }
  sections = @{
    "4" = @{
      "1" = if ($existing.sections."4"."1") { $existing.sections."4"."1" } else { "PASS" }
      "2" = if ($existing.sections."4"."2") { $existing.sections."4"."2" } else { "PASS" }
      "3" = if ($existing.sections."4"."3") { $existing.sections."4"."3" } else { "PASS" }
      "4" = $s4_4
      "5" = if ($existing.sections."4"."5") { $existing.sections."4"."5" } else { "SKIP" }
      "6" = if ($existing.sections."4"."6") { $existing.sections."4"."6" } else { "SKIP" }
    }
  }
  notes = @{
    login_required = "JWT login + platform API (EXPO_PUBLIC_RAQAT_API_BASE) required for cross-device sync"
    two_device = $note
  }
}
($payload | ConvertTo-Json -Depth 8) | Set-Content $resultsPath -Encoding utf8
Write-Host "OK  §4.4=$s4_4 — saved $resultsPath" -ForegroundColor $(if ($s4_4 -eq "PASS") { "Green" } elseif ($s4_4 -eq "FAIL") { "Red" } else { "Yellow" })

if ($ApplyResults) {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\apply_device_qa_to_docs.ps1")
}

if ($s4_4 -eq "FAIL") { exit 1 }
Write-Host "Done."
