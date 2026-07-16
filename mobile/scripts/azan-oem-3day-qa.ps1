# 3 OEM × 3 күн азан locked-screen QA трекері.
# Әр күнде әр OEM құрылғысына azan-locked-screen-qa.ps1 жүргізіп, нәтижені JSON-ға жинайды.
param(
  [ValidateRange(1, 3)]
  [int]$Day = 1,
  [string]$Oem = "",
  [string]$Apk = "",
  [int]$DelaySeconds = 90,
  [switch]$ImmediateBroadcast,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$mobileDir = Split-Path $PSScriptRoot
$repoRoot = Split-Path $mobileDir
$trackerPath = Join-Path $repoRoot "docs\mobile\changelog\azan-oem-qa-tracker.json"
$azanScript = Join-Path $PSScriptRoot "azan-locked-screen-qa.ps1"

function Find-Adb {
  $candidates = @(
    (Get-Command adb -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
    "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
    "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe"
  ) | Where-Object { $_ -and (Test-Path $_) }
  if (-not $candidates) { throw "adb табылмады" }
  return $candidates[0]
}

$adb = Find-Adb
$serial = (& $adb get-serialno).Trim()
$brand = (& $adb shell getprop ro.product.brand).Trim().ToLowerInvariant()
$manufacturer = (& $adb shell getprop ro.product.manufacturer).Trim().ToLowerInvariant()
$model = (& $adb shell getprop ro.product.model).Trim()
$api = [int]((& $adb shell getprop ro.build.version.sdk).Trim() -replace "[^0-9]", "")

function Normalize-Oem([string]$RawBrand, [string]$RawManufacturer) {
  $hay = "$RawBrand $RawManufacturer"
  if ($hay -match "samsung") { return "samsung" }
  if ($hay -match "xiaomi|redmi|poco") { return "xiaomi" }
  if ($hay -match "huawei|honor") { return "huawei" }
  if ($hay -match "oppo|realme|oneplus") { return "oppo" }
  if ($hay -match "vivo|iqoo") { return "vivo" }
  return $RawBrand
}

$detectedOem = Normalize-Oem $brand $manufacturer
if ($Oem) {
  $oemKey = $Oem.Trim().ToLowerInvariant()
} else {
  $oemKey = $detectedOem
}

Write-Host "== Azan OEM 3-day QA =="
Write-Host "Day: $Day | OEM: $oemKey | Device: $brand $model (API $api, $serial)"
Write-Host ""

$azanArgs = @(
  "-ExecutionPolicy", "Bypass",
  "-File", $azanScript,
  "-DelaySeconds", $DelaySeconds,
  "-GrantExactAlarm",
  "-WhitelistBattery",
  "-WriteResultsJson"
)
if ($Apk) { $azanArgs += "-Apk", $Apk }
if ($SkipInstall) { $azanArgs += "-SkipInstall" }
if ($ImmediateBroadcast) { $azanArgs += "-ImmediateBroadcast" }

& powershell @azanArgs
$pass = $LASTEXITCODE -eq 0

$tracker = @{
  schema = "azan-oem-3day-v1"
  updated_at = (Get-Date).ToUniversalTime().ToString("o")
  target_oems = @("samsung", "xiaomi", "huawei")
  days = 3
  runs = @()
}
if (Test-Path $trackerPath) {
  try {
    $existing = Get-Content $trackerPath -Raw | ConvertFrom-Json
    if ($existing.runs) { $tracker.runs = @($existing.runs) }
    if ($existing.target_oems) { $tracker.target_oems = @($existing.target_oems) }
  } catch {
    Write-Warning "Tracker JSON parse failed; starting fresh."
  }
}

$entry = @{
  day = $Day
  oem = $oemKey
  pass = $pass
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  device = @{
    serial = $serial
    brand = $brand
    manufacturer = $manufacturer
    model = $model
    api = $api
  }
  delaySeconds = $DelaySeconds
  immediateBroadcast = [bool]$ImmediateBroadcast
}
$tracker.runs = @($tracker.runs) + @($entry)
$tracker.updated_at = (Get-Date).ToUniversalTime().ToString("o")

$tracker | ConvertTo-Json -Depth 6 | Set-Content -Path $trackerPath -Encoding utf8
Write-Host ""
Write-Host "Tracker updated: $trackerPath"

# Summary matrix
$matrix = @{}
foreach ($target in $tracker.target_oems) {
  $matrix[$target] = @{}
  for ($d = 1; $d -le 3; $d++) {
    $run = @($tracker.runs | Where-Object { $_.oem -eq $target -and $_.day -eq $d } | Sort-Object timestamp -Descending | Select-Object -First 1)
    if ($run.Count -gt 0) {
      $matrix[$target]["$d"] = if ($run[0].pass) { "PASS" } else { "FAIL" }
    } else {
      $matrix[$target]["$d"] = "SKIP"
    }
  }
}

Write-Host ""
Write-Host "== OEM × Day matrix =="
foreach ($target in $tracker.target_oems) {
  $cells = 1..3 | ForEach-Object { "$target D$_`: $($matrix[$target]["$_"])" }
  Write-Host ($cells -join " | ")
}

if (-not $pass) { exit 1 }
