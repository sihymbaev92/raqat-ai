# Барлық қосылған Android телефондарды верификациялау (soft launch / azan QA).
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/verify_phones.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/verify_phones.ps1 -InstallApk -WaitAuthorizeSec 180
#
# Телефон: USB debugging ON → «Allow USB debugging» басыңыз.

param(
  [switch]$InstallApk,
  [int]$WaitAuthorizeSec = 120,
  [string]$Apk = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Package = "kz.raqat.app"
$OutDir = Join-Path $Root "docs\mobile\changelog"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Find-Adb {
  if (Get-Command adb -ErrorAction SilentlyContinue) { return "adb" }
  foreach ($c in @(
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:ANDROID_HOME\platform-tools\adb.exe",
    "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe"
  )) {
    if ($c -and (Test-Path $c)) { return $c }
  }
  return $null
}

function Adb([string]$adb, [string]$serial, [string[]]$args) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  if ($serial) {
    $out = & $adb -s $serial @args 2>&1
  } else {
    $out = & $adb @args 2>&1
  }
  $ErrorActionPreference = $prev
  return ($out | Out-String).Trim()
}

function Get-Prop([string]$adb, [string]$serial, [string]$key) {
  return (Adb $adb $serial @("shell", "getprop", $key))
}

function Test-BatteryUnrestricted([string]$adb, [string]$serial) {
  $whitelist = Adb $adb $serial @("shell", "dumpsys", "deviceidle", "whitelist")
  if ($whitelist -match [regex]::Escape($Package)) { return $true }
  $power = Adb $adb $serial @("shell", "dumpsys", "power")
  if ($power -match "ALLOWED" -and $power -match [regex]::Escape($Package)) { return $true }
  return $false
}

function Test-AppInstalled([string]$adb, [string]$serial) {
  $path = Adb $adb $serial @("shell", "pm", "path", $Package)
  return ($path -match "^package:")
}

function Get-AppVersion([string]$adb, [string]$serial) {
  $dump = Adb $adb $serial @("shell", "dumpsys", "package", $Package)
  $name = if ($dump -match "versionName=([^\s]+)") { $Matches[1] } else { $null }
  $code = if ($dump -match "versionCode=(\d+)") { [int]$Matches[1] } else { $null }
  return @{ versionName = $name; versionCode = $code }
}

function Wait-ForDevices([string]$adb, [int]$maxSec) {
  $deadline = (Get-Date).AddSeconds($maxSec)
  $seenUnauthorized = $false
  while ((Get-Date) -lt $deadline) {
    $lines = Adb $adb $null @("devices")
  $devices = @()
  $unauthorized = @()
  foreach ($line in ($lines -split "`n")) {
    if ($line -match "^(\S+)\s+device\s*$") { $devices += $Matches[1] }
    elseif ($line -match "^(\S+)\s+unauthorized\s*$") {
      $unauthorized += $Matches[1]
      $seenUnauthorized = $true
    }
  }
    if ($devices.Count -gt 0) { return @{ authorized = $devices; unauthorized = $unauthorized } }
    if ($seenUnauthorized) {
      Write-Host "→ Телефонда «Allow USB debugging» басыңыз…"
    }
    Start-Sleep -Seconds 4
  }
  return @{ authorized = @(); unauthorized = $unauthorized }
}

function Resolve-ApkPath {
  if ($Apk -and (Test-Path $Apk)) { return (Resolve-Path $Apk).Path }
  foreach ($p in @(
    (Join-Path $Root "mobile\apk-download\raqat-release-latest.apk"),
    (Join-Path $Root "mobile\android\app\build\outputs\apk\release\app-release.apk")
  )) {
    if (Test-Path $p) { return (Resolve-Path $p).Path }
  }
  return $null
}

$adb = Find-Adb
if (-not $adb) {
  Write-Host "FAIL adb табылмады — Android SDK platform-tools орнатыңыз."
  exit 2
}

Write-Host "== RAQAT phone verification =="
Write-Host "adb: $adb"
Write-Host ""

$wait = Wait-ForDevices $adb $WaitAuthorizeSec
if ($wait.unauthorized.Count -gt 0) {
  Write-Host "WARN unauthorized: $($wait.unauthorized -join ', ')"
}
if ($wait.authorized.Count -eq 0) {
  Write-Host "FAIL рұқсат берілген құрылғы жоқ (${WaitAuthorizeSec}s күттік)."
  Write-Host "Қосу: USB debugging → Allow → қайта іске қосыңыз."
  exit 3
}

$apkPath = if ($InstallApk) { Resolve-ApkPath } else { $null }
if ($InstallApk -and -not $apkPath) {
  Write-Host "FAIL APK табылмады — алдымен: cd mobile; npm run build:apk"
  exit 4
}

$report = @{
  verified_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  apk = if ($apkPath) { $apkPath } else { $null }
  devices = @()
}

$allPass = $true
foreach ($serial in $wait.authorized) {
  Write-Host "--- $serial ---"
  $model = Get-Prop $adb $serial "ro.product.model"
  $brand = Get-Prop $adb $serial "ro.product.brand"
  $manufacturer = Get-Prop $adb $serial "ro.product.manufacturer"
  $api = Get-Prop $adb $serial "ro.build.version.sdk"
  $android = Get-Prop $adb $serial "ro.build.version.release"

  $installed = Test-AppInstalled $adb $serial
  $ver = if ($installed) { Get-AppVersion $adb $serial } else { @{ versionName = $null; versionCode = $null } }
  $batteryOk = Test-BatteryUnrestricted $adb $serial

  $installOk = $true
  if ($InstallApk -and $apkPath) {
    Write-Host "  install $apkPath"
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $adb -s $serial install -r $apkPath 2>&1 | ForEach-Object { Write-Host "  $_" }
    $installOk = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = $prev
    $installed = Test-AppInstalled $adb $serial
    if ($installed) { $ver = Get-AppVersion $adb $serial }
  }

  $launchOk = $false
  if ($installed) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    Adb $adb $serial @("shell", "am", "start", "-n", "$Package/.MainActivity") | Out-Null
    Start-Sleep -Seconds 2
    $log = Adb $adb $serial @("logcat", "-d", "-t", "60")
    $launchOk = -not ($log -match "FATAL EXCEPTION|Process: $Package.*has died")
    $ErrorActionPreference = $prev
  }

  $checks = @{
    adb_authorized = $true
    app_installed = $installed
    app_launch_no_fatal = $launchOk
    battery_unrestricted = $batteryOk
    version_ok = ($ver.versionName -eq "1.1.0")
  }
  $devicePass = ($checks.adb_authorized -and $checks.app_installed -and $checks.app_launch_no_fatal)
  if (-not $devicePass) { $allPass = $false }
  if (-not $installOk) { $allPass = $false }

  Write-Host "  $manufacturer $brand $model | API $api (Android $android)"
  Write-Host "  app: $(if ($installed) { "$($ver.versionName) ($($ver.versionCode))" } else { 'NOT INSTALLED' })"
  Write-Host "  launch: $(if ($launchOk) { 'OK' } else { 'FAIL' })"
  Write-Host "  battery unrestricted: $(if ($batteryOk) { 'YES' } else { 'NO — баптаудан қосыңыз' })"
  Write-Host "  verdict: $(if ($devicePass) { 'PASS' } else { 'FAIL' })"
  Write-Host ""

  $report.devices += @{
    serial = $serial
    manufacturer = $manufacturer
    brand = $brand
    model = $model
    api_level = [int]($api -replace "\D", "")
    android_release = $android
    version_name = $ver.versionName
    version_code = $ver.versionCode
    checks = $checks
    verdict = if ($devicePass) { "PASS" } else { "FAIL" }
  }
}

$stamp = Get-Date -Format "yyyy-MM-dd"
$jsonPath = Join-Path $OutDir "phone-verification-$stamp.json"
$report | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Host "Report: $jsonPath"

if ($allPass) {
  Write-Host "OK  $($wait.authorized.Count) phone(s) verified."
  Write-Host "Azan 3-day QA: docs/operations/AZAN_3DAY_DEVICE_QA.md"
  exit 0
}

Write-Host "WARN some devices failed — жөндеңіз және қайталаңыз."
exit 1
