# Prayer widget boot regression (adb). Requires authorized device + release/debug build installed.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/widget_boot_regression_adb.ps1

param(
  [string]$Package = "kz.raqat.app",
  [int]$WaitAuthorizeSec = 90
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Find-Adb {
  if (Get-Command adb -ErrorAction SilentlyContinue) { return "adb" }
  $p = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
  if (Test-Path $p) { return $p }
  return $null
}

$adb = Find-Adb
if (-not $adb) { Write-Host "FAIL adb not found"; exit 2 }

function Wait-Authorized($maxSec) {
  $deadline = (Get-Date).AddSeconds($maxSec)
  while ((Get-Date) -lt $deadline) {
    $lines = & $adb devices 2>&1 | Where-Object { $_ -match "\t" }
    foreach ($l in $lines) {
      if ($l -match "^(\S+)\s+device") { return $Matches[1] }
      if ($l -match "unauthorized") {
        Write-Host "WARN device unauthorized — phone: Allow USB debugging"
      }
    }
    Start-Sleep -Seconds 3
  }
  return $null
}

$serial = Wait-Authorized $WaitAuthorizeSec
if (-not $serial) {
  Write-Host "FAIL no authorized device within ${WaitAuthorizeSec}s"
  exit 3
}
Write-Host "OK  device $serial"

& $adb logcat -c | Out-Null

Write-Host "== BOOT_COMPLETED broadcast → $Package =="
$prevEa = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $adb shell am broadcast -a android.intent.action.BOOT_COMPLETED -p $Package 2>&1 | Out-Null
$ErrorActionPreference = $prevEa
Start-Sleep -Seconds 2

$log = & $adb logcat -d 2>&1 | Out-String
$pkgPath = & $adb shell pm path $Package 2>&1 | Out-String
$widgetDump = & $adb shell dumpsys appwidget 2>&1 | Out-String
$hasPinnedWidget = ($widgetDump -match "kz\.raqat\.app" -and $widgetDump -match "host\.id=")

$checks = @(
  @{ Name = "boot_receiver_ran"; Pass = ($log -match "PrayerWidgetBootReceiver|BOOT_COMPLETED") },
  @{ Name = "widget_update"; Pass = if ($hasPinnedWidget) { ($log -match "PrayerWidget|AppWidget") } else { $true }; Optional = (-not $hasPinnedWidget) },
  @{ Name = "package_installed"; Pass = ($pkgPath -match "package:") }
)

$fail = 0
foreach ($c in $checks) {
  if ($c.Optional) {
    Write-Host "SKIP  $($c.Name) (no widget on home screen — pin manually)"
    continue
  }
  $st = if ($c.Pass) { "PASS" } else { "FAIL"; $fail = 1 }
  Write-Host "$st  $($c.Name)"
}

$outPath = Join-Path $Root "docs\mobile\changelog\device-qa-results.json"
$payload = @{
  updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  device_serial = $serial
  widget_boot = @{
    boot_broadcast = if ($fail -eq 0) { "PASS" } else { "FAIL" }
    checks = $checks
  }
}
if (Test-Path $outPath) {
  try {
    $prev = Get-Content $outPath -Raw | ConvertFrom-Json
    if ($prev.sections) { $payload.sections = $prev.sections }
    if ($prev.perf) { $payload.perf = $prev.perf }
  } catch { }
}
($payload | ConvertTo-Json -Depth 6) | Set-Content $outPath -Encoding utf8
Write-Host ""
Write-Host "Results merged: $outPath"
Write-Host "Manual: add prayer widget to home screen, reboot phone, verify times update"
Write-Host "Doc: docs/mobile/changelog/2026-05-25-widget-boot-qa.md"

exit $fail
