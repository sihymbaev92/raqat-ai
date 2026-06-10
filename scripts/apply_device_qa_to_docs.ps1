# Merge device-qa-results.json → markdown tables.
param(
  [string]$JsonPath = "",
  [string]$QaPath = "",
  [string]$PerfPath = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not $JsonPath) { $JsonPath = Join-Path $Root "docs\mobile\changelog\device-qa-results.json" }
if (-not $QaPath) { $QaPath = Join-Path $Root "docs\mobile\changelog\2026-05-24-device-qa.md" }
if (-not $PerfPath) { $PerfPath = Join-Path $Root "docs\mobile\changelog\2026-06-perf-baseline.md" }

if (-not (Test-Path $JsonPath)) { Write-Host "FAIL missing $JsonPath"; exit 1 }
$data = Get-Content $JsonPath -Raw | ConvertFrom-Json

function Update-QaRow($text, $sectionPrefix, $rowNum, $value) {
  $esc = [regex]::Escape($sectionPrefix)
  $pattern = "(?ms)(## $esc[^\r\n]*.*?^\|\s*$rowNum\s*\|[^\|]+\|)\s*[^\|]*(\|)"
  return [regex]::Replace($text, $pattern, {
    param($m)
    "$($m.Groups[1].Value) $value $($m.Groups[2].Value)"
  }, 1)
}

$qa = Get-Content $QaPath -Raw
$map = @{
  "1" = "§1 Quran"
  "2" = "§2 Halal"
  "3" = "§3 Hadith hub"
  "4" = "§4 Hatim sync"
}

$serial = [string]$data.device_serial
$mode = if ($data.mode) { " · $($data.mode)" } else { "" }

if ($data.sections) {
  foreach ($secProp in $data.sections.PSObject.Properties) {
    $sn = $secProp.Name
    $title = $map[$sn]
    if (-not $title) { continue }
    foreach ($rowProp in $secProp.Value.PSObject.Properties) {
      $qa = Update-QaRow $qa $title ([string]$rowProp.Name) ([string]$rowProp.Value)
    }
    $props = @($secProp.Value.PSObject.Properties)
    $pass = @($props | Where-Object { $_.Value -eq "PASS" }).Count
    $fail = @($props | Where-Object { $_.Value -eq "FAIL" }).Count
    $skip = @($props | Where-Object { $_.Value -eq "SKIP" }).Count
    $total = $props.Count
    $sum = "PASS ($pass/$total)"
    if ($fail -gt 0) { $sum += ", $fail fail" }
    if ($skip -gt 0) { $sum += ", $skip skip" }
    $qa = [regex]::Replace($qa, "(\*\*§$sn қорытынды:\*\* )[^\r\n]+", "`${1}$sum · device $serial$mode")
  }
}

$perf = Get-Content $PerfPath -Raw
$perfMap = @{
  "Al-Baqara classic scroll" = "Al-Baqara classic scroll"
  "Halal first open (cold)" = "Halal first open (cold)"
  "Halal repeat open" = "Halal repeat open"
  "Offline: surah + last-read" = "Offline: сүре + last-read"
  "Audio play → scroll + pulse" = "Audio play → scroll + pulse"
  "Mushaf page flip" = "Mushaf page flip"
  "Hatim sync 2 device" = "Hatim sync 2 device"
}

if ($data.perf) {
  foreach ($p in $data.perf.PSObject.Properties) {
    $label = $perfMap[$p.Name]
    if (-not $label) { continue }
    $val = [string]$p.Value
    $passCol = if ($val -match "^\d") { "PASS" } elseif ($val -in @("PASS", "FAIL", "SKIP")) { $val } else { "PASS" }
    $baseline = if ($val -match "^\d") { $val } elseif ($val -in @("PASS", "FAIL", "SKIP")) { "" } else { $val }
    $esc = [regex]::Escape($label)
    $pattern = "(\| $esc \|[^|]+\|)\s*([^|]*)(\|\s*)(PASS|FAIL|MANUAL|SKIP)?(\s*\|)"
    $perf = [regex]::Replace($perf, $pattern, {
      param($m)
      $b = if ($baseline) { $baseline } else { $m.Groups[2].Value.Trim() }
      "$($m.Groups[1].Value) $b $($m.Groups[3].Value)$passCol$($m.Groups[5].Value)"
    }, 1)
  }
}

if ($data.widget_boot -and $data.widget_boot.boot_broadcast) {
  $wb = [string]$data.widget_boot.boot_broadcast
  if ($perf -notmatch "Widget boot \(adb\)") {
    $insert = "| Widget boot (adb) | reboot OK | adb broadcast | $wb | receiver OK; home widget — manual |`r`n"
    $perf = $perf -replace "(\| Al-Baqara classic scroll \|)", "$insert`${1}"
  } else {
    $perf = [regex]::Replace($perf, "(\| Widget boot \(adb\) \|[^|]+\|[^|]+\|)\s*[^|]*(\|)", {
      param($m) "$($m.Groups[1].Value) $wb $($m.Groups[2].Value)"
    }, 1)
  }
}

[System.IO.File]::WriteAllText($QaPath, $qa)
[System.IO.File]::WriteAllText($PerfPath, $perf)
Write-Host "OK  $QaPath"
Write-Host "OK  $PerfPath"
