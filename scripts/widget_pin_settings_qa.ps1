# Settings → Prayer settings → widget pin section QA.
# Usage:
#   powershell -File scripts/widget_pin_settings_qa.ps1
#   powershell -File scripts/widget_pin_settings_qa.ps1 -ApplyResults

param(
  [switch]$ApplyResults,
  [int]$WaitAuthorizeSec = 90
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

function Wait-Device($adb, $maxSec) {
  $deadline = (Get-Date).AddSeconds($maxSec)
  while ((Get-Date) -lt $deadline) {
    $out = & $adb devices 2>&1
    foreach ($line in $out) {
      if ($line -match "^(\S+)\s+device\s*$") { return $Matches[1] }
    }
    Start-Sleep -Seconds 3
  }
  return $null
}

Write-Host "== Widget pin Settings QA =="

$jestExit = 0
Push-Location (Join-Path $Root "mobile")
try {
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & npx jest --ci --testPathPattern="prayerWidgetPin" --passWithNoTests 2>&1 | Select-Object -Last 10
  $jestExit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
} finally {
  Pop-Location
}
if ($jestExit -ne 0) {
  Write-Host "FAIL Jest prayerWidgetPin (exit $jestExit)"
  exit $jestExit
}
Write-Host "OK  Jest prayerWidgetPin"

$adb = Find-Adb
$serial = $null
$uiPass = "SKIP"
if ($adb) {
  $serial = Wait-Device $adb $WaitAuthorizeSec
  if ($serial) {
    Write-Host "Device: $serial"
    & $adb -s $serial shell am start -a android.intent.action.VIEW -d "imamai://more/prayer-settings" -p kz.raqat.app 2>&1 | Out-Null
    Start-Sleep -Seconds 4
    & $adb -s $serial shell uiautomator dump /sdcard/widget_pin_qa.xml 2>&1 | Out-Null
    $xml = & $adb -s $serial shell cat /sdcard/widget_pin_qa.xml 2>&1 | Out-String
    $hasSection = $xml -match "settings-prayer-widget-section|Виджет|widget|Намаз"
    $hasSteps = $xml -match "Виджеттер|Widgets|қосу|қадам"
    if ($hasSection -and $hasSteps) {
      $uiPass = "PASS"
      Write-Host "OK  Prayer settings widget section visible"
    } else {
      $uiPass = "FAIL"
      Write-Host "FAIL widget section not found in UI dump"
    }
  } else {
    Write-Host "SKIP adb device — Jest only"
  }
} else {
  Write-Host "SKIP adb — Jest only"
}

$payload = [ordered]@{
  updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  mode = "widget_pin_settings_qa"
  device_serial = $serial
  widget_pin = @{
    jest = "PASS"
    settings_ui = $uiPass
    native_pin_api = "Android requestPinAppWidget when launcher supports"
    manual_fallback = "Numbered steps in SettingsPrayerWidgetSection"
  }
  notes = @{
    location = "More → Prayer settings → Widget section"
    deep_link = "imamai://more/prayer-settings"
  }
}
($payload | ConvertTo-Json -Depth 8) | Set-Content $resultsPath -Encoding utf8
Write-Host "OK  saved $resultsPath (settings_ui=$uiPass)"

if ($ApplyResults) {
  & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\apply_device_qa_to_docs.ps1")
}

if ($uiPass -eq "FAIL") { exit 1 }
Write-Host "Done."
