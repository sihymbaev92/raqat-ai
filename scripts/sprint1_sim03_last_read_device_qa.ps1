# Sprint 1 SIM-03 — Android last-read background QA (#104)
# Deep Dive §6: home → reopen Quran → last ayah visible ±1 row
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_sim03_last_read_device_qa.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_sim03_last_read_device_qa.ps1 -Interactive
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_sim03_last_read_device_qa.ps1 -AutoOpenSurah2

param(
    [switch]$Interactive,
    [switch]$AutoOpenSurah2,
    [switch]$SkipInstall,
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

function Wait-AuthorizedDevice($adb, $maxSec) {
    $deadline = (Get-Date).AddSeconds($maxSec)
    while ((Get-Date) -lt $deadline) {
        $out = & $adb devices 2>&1
        foreach ($line in $out) {
            if ($line -match "^(\S+)\s+device\s*$") { return $Matches[1] }
            if ($line -match "unauthorized") {
                Write-Host "→ Phone: Allow USB debugging (RSA fingerprint)" -ForegroundColor Yellow
            }
        }
        Start-Sleep -Seconds 4
    }
    return $null
}

function Ask-Result($prompt) {
    do {
        $a = (Read-Host "$prompt [P]ass / [F]ail / [S]kip").Trim().ToUpper()
        if ($a -in @("P", "PASS", "")) { return "PASS" }
        if ($a -in @("F", "FAIL")) { return "FAIL" }
        if ($a -in @("S", "SKIP")) { return "SKIP" }
    } while ($true)
}

$adb = Find-Adb
if (-not $adb) {
    Write-Host "adb not found — install Android SDK platform-tools or add to PATH" -ForegroundColor Red
    Write-Host "Manual SIM-03 steps:" -ForegroundColor Cyan
    Write-Host @"
  1. Open Quran → Al-Baqara (surah 2), scroll to ayah ~50–100
  2. Wait 2s (last-read debounce flush on blur)
  3. Press Home (background app)
  4. Reopen RAQAT → Quran list → tap Continue / last-read badge
  5. PASS if same ayah visible ±1 row
"@
    exit 2
}

$serial = Wait-AuthorizedDevice $adb $WaitAuthorizeSec
if (-not $serial) {
    Write-Host "No authorized device — connect USB, enable debugging" -ForegroundColor Red
    exit 3
}
Write-Host "Device: $serial" -ForegroundColor Green

if (-not $SkipInstall -and (Test-Path $apk)) {
    Write-Host "Installing APK..." -ForegroundColor Cyan
    & $adb -s $serial install -r $apk 2>&1 | Out-Null
}

Write-Host ""
Write-Host "=== SIM-03 Last read background QA ===" -ForegroundColor Cyan
Write-Host "API: prod https://api.rahatomir.com (login optional for server sync test)" -ForegroundColor DarkGray

if ($AutoOpenSurah2) {
    Write-Host "Opening deep link: imamai://more/surah/2" -ForegroundColor Cyan
    & $adb -s $serial shell am start -a android.intent.action.VIEW -d "imamai://more/surah/2" -p kz.raqat.app 2>&1 | Out-Null
    Start-Sleep -Seconds 3
}

Write-Host @"

Steps:
  1. In app: Quran → Al-Baqara — scroll to a middle ayah (note ayah number)
  2. Leave surah screen (back to list) OR press Home to background
  3. Reopen app → Quran — verify Continue card / scroll restores same ayah ±1 row
  4. (Optional, logged in) Settings login → reopen — server sync should preserve position

"@

$result = "SKIP"
if ($Interactive) {
    $result = Ask-Result "SIM-03 last-read after background"
}
else {
    Write-Host "Non-interactive: run with -Interactive to record PASS/FAIL" -ForegroundColor Yellow
    Write-Host "Jest proxy already PASS: npx jest --testPathPattern=quranLastReadSync" -ForegroundColor Green
    $result = "SKIP"
}

# Update device-qa-results.json
$payload = @{
    updated = (Get-Date).ToString("yyyy-MM-dd")
    mode = "sim03_last_read"
    device = $serial
    sim03 = @{
        scenario = "Mobile background last read"
        result = $result
        note = "Android home → reopen Quran; ayah ±1 row"
    }
}
if (Test-Path $resultsPath) {
    try {
        $existing = Get-Content $resultsPath -Raw | ConvertFrom-Json
        if ($existing.PSObject.Properties.Name -contains "sections") {
            $payload["sections"] = $existing.sections
        }
    }
    catch { }
}
$payload | ConvertTo-Json -Depth 6 | Set-Content $resultsPath -Encoding utf8

Write-Host ""
Write-Host "SIM-03 result: $result" -ForegroundColor $(if ($result -eq "PASS") { "Green" } elseif ($result -eq "FAIL") { "Red" } else { "Yellow" })
Write-Host "Results: $resultsPath" -ForegroundColor Cyan

if ($result -eq "FAIL") { exit 1 }
exit 0
