# Five-language Quran translation — device QA (install + screenshots + deep links).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/five_language_quran_device_qa.ps1

param(
  [string]$Apk = "",
  [int]$WaitAuthorizeSec = 240
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $Root "mobile\qa-five-lang-device"
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
        Write-Host "-> Telefon: USB debugging -> Allow (RSA fingerprint)"
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
  Invoke-Adb $adb $serial @("shell", "screencap", "-p", "/sdcard/qa-five.png")
  $dest = Join-Path $OutDir "$name.png"
  Invoke-Adb $adb $serial @("pull", "/sdcard/qa-five.png", $dest)
  Write-Host "  screenshot: $dest"
  return $dest
}

function Open-Link($adb, $serial, $uri, $waitSec = 5) {
  & $adb -s $serial logcat -c 2>&1 | Out-Null
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $adb -s $serial shell am start -a android.intent.action.VIEW -d $uri -p kz.raqat.app 2>&1 | Out-Null
  $ErrorActionPreference = $prev
  Start-Sleep -Seconds $waitSec
  $log = & $adb -s $serial logcat -d 2>&1 | Out-String
  $fatal = ($log -match "FATAL EXCEPTION|AndroidRuntime.*FATAL")
  return -not $fatal
}

$adb = Find-Adb
if (-not $adb) { throw "adb not found" }

if (-not $Apk) {
  $Apk = Join-Path $Root "mobile\android\app\build\outputs\apk\debug\app-debug.apk"
}
if (-not (Test-Path $Apk)) { throw "APK missing: $Apk" }

Write-Host "== Waiting for authorized device (max ${WaitAuthorizeSec}s) =="
$serial = Wait-AuthorizedDevice $adb $WaitAuthorizeSec
if (-not $serial) { throw "No authorized device — USB debugging + Allow RSA" }

Write-Host "== Device: $serial =="
Write-Host "== Install APK =="
Invoke-Adb $adb $serial @("install", "-r", $Apk)

$results = @()

function Record($name, $pass, $note = "") {
  $script:results += [ordered]@{ test = $name; pass = $pass; note = $note }
  $mark = if ($pass) { "PASS" } else { "FAIL" }
  Write-Host "[$mark] $name $note"
}

Record "install_apk" $true $Apk

Write-Host "== Deep link smoke =="
$links = @(
  @{ Name = "home"; Uri = "imamai://"; Wait = 4 },
  @{ Name = "surah1"; Uri = "imamai://more/surah/1/1"; Wait = 6 },
  @{ Name = "hatim"; Uri = "imamai://more/hatim"; Wait = 6 },
  @{ Name = "quran_settings"; Uri = "imamai://more/quran-settings"; Wait = 5 }
)
foreach ($l in $links) {
  $ok = Open-Link $adb $serial $l.Uri $l.Wait
  Record "deeplink_$($l.Name)" $ok $l.Uri
  Shot $adb $serial $l.Name
}

Write-Host "== Wake + unlock attempt =="
Invoke-Adb $adb $serial @("shell", "input", "keyevent", "KEYCODE_WAKEUP") | Out-Null
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "Manual: Settings -> Language -> test ru/en/ky/uz on Surah 1 meaning block."
Write-Host "Screenshots saved to: $OutDir"

$report = @{
  at = (Get-Date).ToString("o")
  serial = $serial
  apk = $Apk
  results = $results
} | ConvertTo-Json -Depth 5
$reportPath = Join-Path $OutDir "results.json"
Set-Content -Path $reportPath -Value $report -Encoding UTF8
Write-Host "Report: $reportPath"
