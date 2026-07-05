# Electronic tasbih BLE — device QA (Tasbih counter screen + BLE panel).
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/tasbih_ble_device_qa.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/tasbih_ble_device_qa.ps1 -SkipBuild
#
# Phone: USB debugging -> Allow RSA fingerprint.

param(
  [switch]$SkipBuild,
  [int]$WaitAuthorizeSec = 240,
  [string]$Apk = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $Root "mobile\qa-tasbih-ble-device"
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
        Write-Host "-> Phone: Developer options -> USB debugging -> Allow"
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
  Invoke-Adb $adb $serial @("shell", "screencap", "-p", "/sdcard/tasbih-ble-qa.png")
  $dest = Join-Path $OutDir "$name.png"
  Invoke-Adb $adb $serial @("pull", "/sdcard/tasbih-ble-qa.png", $dest)
  return $dest
}

function UiDump($adb, $serial) {
  & $adb -s $serial shell uiautomator dump /sdcard/tasbih-ble-ui.xml 2>&1 | Out-Null
  return (& $adb -s $serial shell cat /sdcard/tasbih-ble-ui.xml 2>&1) -join "`n"
}

Write-Host "== Tasbih BLE device QA =="

$adb = Find-Adb
if (-not $adb) { throw "adb not found" }

$serial = Wait-AuthorizedDevice $adb $WaitAuthorizeSec
if (-not $serial) {
  Write-Host "FAIL: no authorized device after ${WaitAuthorizeSec}s"
  exit 2
}
Write-Host "Device: $serial"

$defaultApk = Join-Path $Root "mobile\apk-download\raqat-release-latest.apk"
if (-not $Apk) { $Apk = $defaultApk }

if (-not $SkipBuild) {
  Write-Host "Building release APK (BLE native module)..."
  Push-Location (Join-Path $Root "mobile")
  npm run build:apk 2>&1 | Write-Host
  Pop-Location
}

if (-not (Test-Path $Apk)) { throw "APK missing: $Apk" }

Write-Host "Installing $Apk ..."
Invoke-Adb $adb $serial @("install", "-r", $Apk)

$pkg = "kz.raqat.app"
$results = @()

function Test-Route($id, $uri, $waitSec, $label) {
  Write-Host ">> $id $label"
  & $adb -s $serial logcat -c 2>&1 | Out-Null
  & $adb -s $serial shell am start -a android.intent.action.VIEW -d $uri -p $pkg 2>&1 | Out-Null
  Start-Sleep -Seconds $waitSec
  $log = (& $adb -s $serial logcat -d 2>&1 | Out-String)
  $crash = $log -match "FATAL EXCEPTION|AndroidRuntime.*FATAL"
  $png = Shot $adb $serial $id
  $xml = UiDump $adb $serial
  $hasBlePanel = $xml -match "Электрондық тәспі|Bluetooth|bluetooth"
  $hasCounter = $xml -match "қалды|Тәспіні басып|/ 33|/ 99"
  @{
    id = $id
    label = $label
    uri = $uri
    crash = [bool]$crash
    screenshot = $png
    blePanel = [bool]$hasBlePanel
    counterUi = [bool]$hasCounter
  }
}

Invoke-Adb $adb $serial @("shell", "input", "keyevent", "KEYCODE_WAKEUP")
Start-Sleep -Seconds 1

$results += Test-Route "01-tasbih-list" "imamai://tasbih" 6 "Tasbih list"
$results += Test-Route "02-tasbih-counter" "imamai://tasbih/dhikr/1" 8 "Tasbih counter (dhikr 1)"
$results += Test-Route "03-tasbih-counter-2" "imamai://tasbih/dhikr/2" 6 "Tasbih counter (dhikr 2)"

Write-Host ">> tap counter circle"
Invoke-Adb $adb $serial @("shell", "input", "tap", "540", "1800")
Start-Sleep -Seconds 1
$results += @{
  id = "04-after-tap"
  label = "After tap counter"
  screenshot = (Shot $adb $serial "04-after-tap")
}

$jsonPath = Join-Path $OutDir "tasbih-ble-qa-results.json"
$results | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding UTF8

Write-Host ""
Write-Host "Results -> $OutDir"
foreach ($r in $results) {
  $flags = @()
  if ($r.crash) { $flags += "CRASH" }
  if ($r.PSObject.Properties.Name -contains "blePanel" -and -not $r.blePanel -and $r.id -like "*counter*") { $flags += "NO_BLE_PANEL" }
  if ($r.PSObject.Properties.Name -contains "counterUi" -and -not $r.counterUi -and $r.id -like "*counter*") { $flags += "NO_COUNTER_UI" }
  $status = if ($flags.Count) { $flags -join "," } else { "OK" }
  Write-Host "  $($r.id): $status"
}

$fail = $results | Where-Object { $_.crash -or ($_.id -like "*counter*" -and $_.blePanel -eq $false) }
if ($fail) { exit 1 }
Write-Host "OK: tasbih BLE device QA passed"
exit 0
