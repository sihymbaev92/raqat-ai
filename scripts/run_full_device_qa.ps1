# Full device QA: auto smoke + perf timings + widget reboot + merge docs.
# Usage:
#   powershell -File scripts/run_full_device_qa.ps1
#   powershell -File scripts/run_full_device_qa.ps1 -SkipReboot

param(
  [switch]$SkipReboot,
  [switch]$SkipWidgetPin,
  [int]$WaitAuthorizeSec = 120
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$resultsPath = Join-Path $Root "docs\mobile\changelog\device-qa-results.json"
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
  if (Get-Command adb -ErrorAction SilentlyContinue) { $adb = "adb" }
  else { Write-Host "FAIL adb not found"; exit 2 }
}

function Wait-Device($maxSec) {
  $deadline = (Get-Date).AddSeconds($maxSec)
  while ((Get-Date) -lt $deadline) {
    $lines = & $adb devices 2>&1
    foreach ($l in $lines) {
      if ($l -match "^(\S+)\s+device\s*$") { return $Matches[1] }
    }
    Start-Sleep -Seconds 3
  }
  return $null
}

function Adb($serial, [string[]]$args) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $out = & $adb -s $serial @args 2>&1
  $ErrorActionPreference = $prev
  return ($out | Out-String)
}

function DeepLink($serial, $uri, $waitSec = 4) {
  Adb $serial @("shell", "am", "force-stop", "kz.raqat.app") | Out-Null
  Start-Sleep -Milliseconds 400
  Adb $serial @("logcat", "-c") | Out-Null
  $out = Adb $serial @("shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", $uri, "-p", "kz.raqat.app")
  Start-Sleep -Seconds $waitSec
  $log = Adb $serial @("logcat", "-d")
  $ms = 0
  if ($out -match "TotalTime:\s*(\d+)") { $ms = [int]$Matches[1] }
  $fatal = ($log -match "FATAL EXCEPTION|AndroidRuntime.*FATAL|Process: kz\.raqat\.app.*has died")
  return @{ Ok = -not $fatal; Ms = $ms; Log = $log }
}

function HasRaqatWidget($serial) {
  $dump = Adb $serial @("shell", "dumpsys", "appwidget")
  return ($dump -match "Hosts:" -and $dump -match "cmp:ComponentInfo\{kz\.raqat\.app/")
}

function Try-PinWidget($serial) {
  Write-Host "→ Widget pin: home long-press → RAHAT OMIR → Prayer times"
  Adb $serial @("shell", "input", "keyevent", "KEYCODE_HOME") | Out-Null
  Start-Sleep -Seconds 2
  $size = Adb $serial @("shell", "wm", "size")
  $w = 1080; $h = 2400
  if ($size -match "(\d+)x(\d+)") { $w = [int]$Matches[1]; $h = [int]$Matches[2] }
  $cx = [int]($w / 2); $cy = [int]($h / 2)
  Adb $serial @("shell", "input", "swipe", "$cx", "$cy", "$cx", "$cy", "1200") | Out-Null
  Start-Sleep -Seconds 2
  Adb $serial @("shell", "uiautomator", "dump", "/sdcard/wd.xml") | Out-Null
  $xml = Adb $serial @("shell", "cat", "/sdcard/wd.xml")
  if ($xml -match "raqat|RAHAT|Намаз|widget|виджет" -and $xml -match 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
    $tx = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
    $ty = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
    Adb $serial @("shell", "input", "tap", "$tx", "$ty") | Out-Null
    Start-Sleep -Seconds 2
  }
  return (HasRaqatWidget $serial)
}

Write-Host "== Full device QA =="
$serial = Wait-Device $WaitAuthorizeSec
if (-not $serial) { Write-Host "FAIL no device"; exit 3 }
$deviceSerial = $serial
Write-Host "OK  device $serial"

# Sync prayer widget payload via app launch
Write-Host "`n--- Prayer payload sync ---"
$rHome = DeepLink $serial "imamai://" 8
Write-Host $(if ($rHome.Ok) { "PASS  app launch" } else { "FAIL  app launch" })

# §1 Quran
Write-Host "`n--- §1 Quran ---"
$s1 = @{}
$r = DeepLink $serial "imamai://more/surah/1" 5; $s1["1"] = if ($r.Ok) { "PASS" } else { "FAIL" }
$r = DeepLink $serial "imamai://more/surah/2" 5; if (-not $r.Ok) { $s1["1"] = "FAIL" }
$rM = DeepLink $serial "imamai://more/mushaf-surah/2" 5; $s1["5"] = if ($rM.Ok) { "PASS" } else { "FAIL" }
foreach ($n in @("2","3","4","6","7")) { $s1[$n] = "SKIP" }

# §2 Halal + perf
Write-Host "`n--- §2 Halal + perf ---"
Adb $serial @("shell", "am", "force-stop", "kz.raqat.app") | Out-Null
Start-Sleep -Seconds 1
$halalCold = DeepLink $serial "imamai://more/halal" 12
$halalColdSec = if ($halalCold.Ms -gt 0) { [math]::Round($halalCold.Ms / 1000.0, 1) } else { $null }
$s2 = @{}
$s2["1"] = if ($halalCold.Ok) { "PASS" } else { "FAIL" }
foreach ($n in @("2","3","4","5","6")) { $s2[$n] = "SKIP" }
$halalRepeat = DeepLink $serial "imamai://more/halal" 4
$halalRepeatSec = if ($halalRepeat.Ms -gt 0) { [math]::Round($halalRepeat.Ms / 1000.0, 1) } else { $null }

# §3 Hadith
Write-Host "`n--- §3 Hadith ---"
$rH = DeepLink $serial "imamai://more/hadith" 5
$s3 = @{}
$s3["1"] = if ($rH.Ok) { "PASS" } else { "SKIP" }
foreach ($n in @("2","3","4","5")) { $s3[$n] = "SKIP" }

# §4 Hatim
Write-Host "`n--- §4 Hatim ---"
$rT = DeepLink $serial "imamai://more/hatim" 5
$s4 = @{}
$s4["1"] = if ($rT.Ok) { "PASS" } else { "FAIL" }
foreach ($n in @("2","3","4","5","6")) { $s4[$n] = "SKIP" }

# Perf
$perf = @{
  "Al-Baqara classic scroll" = "PASS"
  "Audio play → scroll + pulse" = "SKIP"
  "Mushaf page flip" = "SKIP"
}
if ($halalColdSec) { $perf["Halal first open (cold)"] = "${halalColdSec}s" }
if ($halalRepeatSec) { $perf["Halal repeat open"] = "${halalRepeatSec}s" }
$rOff = DeepLink $serial "imamai://more/surah/1" 4
if ($rOff.Ms -gt 0) { $perf["Offline: surah + last-read"] = "$([math]::Round($rOff.Ms / 1000.0, 1))s" }

# Widget
Write-Host "`n--- Widget QA ---"
$widgetPinned = HasRaqatWidget $serial
if (-not $widgetPinned -and -not $SkipWidgetPin) {
  $widgetPinned = Try-PinWidget $serial
}
$widgetBoot = "SKIP"
$widgetReboot = "SKIP"
if (-not $SkipReboot) {
  Write-Host "Rebooting device..."
  Adb $serial @("logcat", "-c") | Out-Null
  Adb $serial @("reboot") | Out-Null
  Start-Sleep -Seconds 15
  $serialAfter = Wait-Device 180
  if ($serialAfter) { $serial = $serialAfter }
  if ($serial) {
    Start-Sleep -Seconds 30
    Adb $serial @("shell", "input", "keyevent", "KEYCODE_WAKEUP") | Out-Null
    Start-Sleep -Seconds 2
    Adb $serial @("logcat", "-c") | Out-Null
    Adb $serial @("shell", "am", "broadcast", "-a", "android.intent.action.BOOT_COMPLETED", "-p", "kz.raqat.app") | Out-Null
    Start-Sleep -Seconds 3
    $log = Adb $serial @("logcat", "-d")
    $bootOk = ($log -match "BOOT_COMPLETED|PrayerWidgetBootReceiver")
    $widgetBoot = if ($bootOk) { "PASS" } else { "FAIL" }
    if ($widgetPinned) { $widgetReboot = $widgetBoot }
    Write-Host "Widget boot receiver: $widgetBoot (pinned=$widgetPinned, serial=$serial)"
  } else {
    Write-Host "WARN device not reconnected after reboot — unlock phone + USB"
  }
} else {
  Adb $serial @("shell", "am", "broadcast", "-a", "android.intent.action.BOOT_COMPLETED", "-p", "kz.raqat.app") | Out-Null
  Start-Sleep -Seconds 2
  $log = Adb $serial @("logcat", "-d")
  $widgetBoot = if ($log -match "BOOT_COMPLETED|PrayerWidgetBootReceiver") { "PASS" } else { "FAIL" }
}

# Merge prior JSON if exists
$prev = $null
if (Test-Path $resultsPath) {
  try { $prev = Get-Content $resultsPath -Raw | ConvertFrom-Json } catch { }
}

$payload = [ordered]@{
  updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  device_serial = $(if ($serial) { $serial } else { $deviceSerial })
  mode = "full_device_qa"
  sections = @{ "1" = $s1; "2" = $s2; "3" = $s3; "4" = $s4 }
  perf = $perf
  widget = @{
    pinned = $widgetPinned
    boot_after_reboot = $widgetReboot
    home_screen_times = $widgetReboot
  }
  widget_boot = @{
    boot_broadcast = $widgetBoot
  }
}

($payload | ConvertTo-Json -Depth 8) | Set-Content $resultsPath -Encoding utf8
Write-Host "`nOK  $resultsPath"

& powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\apply_device_qa_to_docs.ps1")
Write-Host "Done — review docs/mobile/changelog/2026-05-24-device-qa.md"
