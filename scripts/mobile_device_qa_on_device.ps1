# Device QA §1–§4 + optional perf timings → device-qa-results.json → docs.
# Usage:
#   powershell -File scripts/mobile_device_qa_on_device.ps1
#   powershell -File scripts/mobile_device_qa_on_device.ps1 -Interactive
#   powershell -File scripts/mobile_device_qa_on_device.ps1 -Interactive -ApplyResults

param(
  [switch]$SkipInstall,
  [switch]$StartApkServer,
  [switch]$Interactive,
  [switch]$AutoSmoke,
  [switch]$ApplyResults,
  [int]$WaitAuthorizeSec = 120
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$resultsPath = Join-Path $Root "docs\mobile\changelog\device-qa-results.json"

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
        Write-Host "→ Phone: tap **Allow USB debugging** (RSA fingerprint)"
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

function Ask-Seconds($prompt) {
  $raw = Read-Host "$prompt (seconds, empty=skip)"
  if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
  return $raw.Trim()
}

function Test-DeepLinkNoCrash($adb, $serial, $uri, $waitSec = 4) {
  & $adb -s $serial logcat -c 2>&1 | Out-Null
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $adb -s $serial shell am start -a android.intent.action.VIEW -d $uri -p kz.raqat.app 2>&1 | Out-Null
  $ErrorActionPreference = $prev
  Start-Sleep -Seconds $waitSec
  $log = & $adb -s $serial logcat -d 2>&1 | Out-String
  $fatal = ($log -match "FATAL EXCEPTION|AndroidRuntime.*FATAL|Process: kz\.raqat\.app.*has died")
  return -not $fatal
}

function Run-AutoSmoke($adb, $serial) {
  Write-Host "`n=== Auto smoke (deep links, crash-free) ==="
  $links = @(
    @{ Sec = "1"; Row = "1"; Uri = "imamai://more/surah/1"; Label = "Al-Fatiha classic" },
    @{ Sec = "1"; Row = "1"; Uri = "imamai://more/surah/2"; Label = "Al-Baqara classic" },
    @{ Sec = "1"; Row = "5"; Uri = "imamai://more/mushaf-surah/2"; Label = "Mushaf Baqara" },
    @{ Sec = "2"; Row = "1"; Uri = "imamai://more/halal"; Label = "Halal screen" },
    @{ Sec = "4"; Row = "1"; Uri = "imamai://more/hatim"; Label = "Hatim screen" }
  )
  $sections = @{ "1" = @{}; "2" = @{}; "3" = @{}; "4" = @{} }
  $allPass = $true
  foreach ($l in $links) {
    $ok = Test-DeepLinkNoCrash $adb $serial $l.Uri
    $st = if ($ok) { "PASS" } else { "FAIL"; $allPass = $false }
    Write-Host "$st  $($l.Label) ($($l.Uri))"
    $prev = $sections[$l.Sec][$l.Row]
    if ($prev -eq "FAIL") { $st = "FAIL" }
    elseif ($prev -eq "PASS" -and $st -eq "PASS") { $st = "PASS" }
    $sections[$l.Sec][$l.Row] = $st
  }
  foreach ($n in @("2","3","4","6","7")) { if (-not $sections["1"][$n]) { $sections["1"][$n] = "SKIP" } }
  foreach ($n in @("2","3","4","5","6")) { if (-not $sections["2"][$n]) { $sections["2"][$n] = "SKIP" } }
  foreach ($n in @("1","2","3","4","5")) { $sections["3"][$n] = "SKIP" }
  foreach ($n in @("2","3","4","5","6")) { if (-not $sections["4"][$n]) { $sections["4"][$n] = "SKIP" } }
  $baqara = $sections["1"]["1"]
  $perf = @{ "Al-Baqara classic scroll" = $baqara }
  return @{ sections = $sections; perf = $perf; allPass = $allPass }
}

if ($ApplyResults) {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\apply_device_qa_to_docs.ps1")
  exit $LASTEXITCODE
}

Write-Host "== Device QA on-device (sections 1-4) =="

$adb = Find-Adb
$apk = Join-Path $Root "mobile\apk-download\raqat-release-latest.apk"
if (-not (Test-Path $apk)) {
  $apk = Join-Path $Root "mobile\android\app\build\outputs\apk\release\app-release.apk"
}

if (-not $adb) {
  Write-Host "FAIL adb not found (winget install Google.PlatformTools)"
  exit 2
}

Write-Host "OK  adb: $adb"
$serial = Wait-AuthorizedDevice $adb $WaitAuthorizeSec
if (-not $serial) {
  Write-Host "FAIL device not authorized. Enable USB debugging + Allow on phone."
  exit 3
}
Write-Host "OK  device $serial"

if (-not (Test-Path $apk)) {
  Write-Host "WARN APK missing — build: cd mobile; npm run build:apk"
  if (-not $Interactive) { exit 4 }
} elseif (-not $SkipInstall) {
  Write-Host "Installing APK..."
  & $adb -s $serial install -r $apk
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host "OK  APK installed"
}

if ($StartApkServer) {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$Root\mobile\apk-download'; python -m http.server 8083"
}

if (-not $Interactive -and -not $AutoSmoke) {
  Write-Host ""
  Write-Host "Next: -AutoSmoke (adb deep links) or -Interactive (manual PASS/FAIL)"
  Write-Host "Widget: scripts/widget_boot_regression_adb.ps1"
  exit 0
}

if ($AutoSmoke) {
  $smoke = Run-AutoSmoke $adb $serial
  $payload = [ordered]@{
    updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    device_serial = $serial
    mode = "auto_smoke"
    sections = $smoke.sections
    perf = $smoke.perf
  }
  ($payload | ConvertTo-Json -Depth 8) | Set-Content $resultsPath -Encoding utf8
  Write-Host "`nOK  saved $resultsPath"
  & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\apply_device_qa_to_docs.ps1")
  & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\widget_boot_regression_adb.ps1")
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=== Interactive QA (Enter=PASS) ==="
$sections = @{}

Write-Host "`n--- §1 Quran ---"
$s1 = @{}
$s1["1"] = Ask-Result "1 Al-Fatiha/Baqara classic list"
$s1["2"] = Ask-Result "2 Play + pulse scroll"
$s1["3"] = Ask-Result "3 Pause/resume no re-scroll"
$s1["4"] = Ask-Result "4 Queue scroll next ayah"
$s1["5"] = Ask-Result "5 Mushaf pulse"
$s1["6"] = Ask-Result "6 Airplane + last-read"
$s1["7"] = Ask-Result "7 Switch surah + play"
$sections["1"] = $s1

Write-Host "`n--- §2 Halal ---"
$s2 = @{}
$s2["1"] = Ask-Result "1 Open catalog loading"
$s2["2"] = Ask-Result "2 Pull refresh"
$s2["3"] = Ask-Result "3 Company card"
$s2["4"] = Ask-Result "4 Search"
$s2["5"] = Ask-Result "5 Products empty OK"
$s2["6"] = Ask-Result "6 Camera AI (optional)"
$sections["2"] = $s2

Write-Host "`n--- §3 Hadith ---"
$s3 = @{}
$s3["1"] = Ask-Result "1 Hadith hub open"
$s3["2"] = Ask-Result "2 Cross-link KK/Sahih"
$s3["3"] = Ask-Result "3 Trusted sources table"
$s3["4"] = Ask-Result "4 Offline KK excerpts"
$s3["5"] = Ask-Result "5 Sahih Arabic+citation only"
$sections["3"] = $s3

Write-Host "`n--- §4 Hatim ---"
$s4 = @{}
$s4["1"] = Ask-Result "1 Offline progress saved"
$s4["2"] = Ask-Result "2 Login push to server"
$s4["3"] = Ask-Result "3 Server merge to local"
$s4["4"] = Ask-Result "4 Two-device sync"
$s4["5"] = Ask-Result "5 Resume surah card"
$s4["6"] = Ask-Result "6 Clear progress + sync"
$sections["4"] = $s4

Write-Host "`n--- Perf timings (optional) ---"
$perf = @{}
$perf["Al-Baqara classic scroll"] = Ask-Result "Baqara scroll smooth?"
$v = Ask-Seconds "Halal first open (cold)"
if ($v) { $perf["Halal first open (cold)"] = "${v}s" }
$v = Ask-Seconds "Halal repeat open"
if ($v) { $perf["Halal repeat open"] = "${v}s" }
$v = Ask-Seconds "Offline surah open"
if ($v) { $perf["Offline: surah + last-read"] = "${v}s" }

$payload = [ordered]@{
  updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  device_serial = $serial
  sections = $sections
  perf = $perf
}

($payload | ConvertTo-Json -Depth 8) | Set-Content $resultsPath -Encoding utf8
Write-Host "`nOK  saved $resultsPath"

& powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\apply_device_qa_to_docs.ps1")
Write-Host "Done. Review docs/mobile/changelog/2026-05-24-device-qa.md"
