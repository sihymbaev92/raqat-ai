# Full app device QA — major screens, Hatim/tajweed, clip check via screenshots.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/full_app_device_qa.ps1

param(
  [string]$Apk = "",
  [switch]$SkipInstall,
  [int]$WaitAuthorizeSec = 60
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $Root "mobile\qa-full-device-sweep"
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
    foreach ($line in (& $adb devices 2>&1)) {
      if ($line -match "^(\S+)\s+device\s*$") { return $Matches[1] }
    }
    Start-Sleep -Seconds 3
  }
  return $null
}

$adb = Find-Adb
if (-not $adb) { throw "adb not found" }
$serial = Wait-AuthorizedDevice $adb $WaitAuthorizeSec
if (-not $serial) { throw "no device" }

if (-not $Apk) {
  $Apk = Join-Path $Root "mobile\android\app\build\outputs\apk\debug\app-debug.apk"
}
if (-not $SkipInstall -and (Test-Path $Apk)) {
  Write-Host "== install $Apk =="
  & $adb -s $serial install -r $Apk | Out-Null
}

$displayArg = @()
$disp = (& $adb -s $serial shell dumpsys SurfaceFlinger --display-id 2>&1) -join "`n"
if ($disp -match "Display (\d+)") { $displayArg = @("-d", $Matches[1]) }

function Shot($name) {
  & $adb -s $serial shell screencap @displayArg -p /sdcard/qa-full.png | Out-Null
  $dest = Join-Path $OutDir "$name.png"
  & $adb -s $serial pull /sdcard/qa-full.png $dest | Out-Null
  return $dest
}

function Tap-Text($text) {
  & $adb -s $serial shell uiautomator dump /sdcard/qa-full-ui.xml 2>&1 | Out-Null
  $xml = (& $adb -s $serial shell cat /sdcard/qa-full-ui.xml 2>&1) -join "`n"
  $esc = [regex]::Escape($text)
  if ($xml -match "text=`"$esc`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"") {
    $x = [math]::Round(([int]$Matches[1] + [int]$Matches[3]) / 2)
    $y = [math]::Round(([int]$Matches[2] + [int]$Matches[4]) / 2)
    & $adb -s $serial shell input tap $x $y | Out-Null
    return $true
  }
  return $false
}

function Open-Link($uri, $waitSec, $name) {
  & $adb -s $serial logcat -c 2>&1 | Out-Null
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $adb -s $serial shell am start -a android.intent.action.VIEW -d $uri -p kz.raqat.app 2>&1 | Out-Null
  $ErrorActionPreference = $prev
  Start-Sleep -Seconds $waitSec
  $log = (& $adb -s $serial logcat -d 2>&1) -join "`n"
  $crash = $log -match "FATAL EXCEPTION|AndroidRuntime.*FATAL"
  $png = Shot $name
  & $adb -s $serial shell uiautomator dump /sdcard/qa-full-ui.xml 2>&1 | Out-Null
  $xml = (& $adb -s $serial shell cat /sdcard/qa-full-ui.xml 2>&1) -join "`n"
  $arabic = $xml -match "[\u0600-\u06FF]"
  return [ordered]@{
    id = $name
    uri = $uri
    crash_free = -not $crash
    ui_arabic = [bool]$arabic
    screenshot = $png
  }
}

# Permissions for QA
foreach ($p in @(
  "android.permission.CAMERA",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.POST_NOTIFICATIONS"
)) {
  & $adb -s $serial shell pm grant kz.raqat.app $p 2>&1 | Out-Null
}

& $adb -s $serial shell input keyevent KEYCODE_WAKEUP | Out-Null
& $adb -s $serial shell am force-stop kz.raqat.app | Out-Null
Start-Sleep -Seconds 1

$results = [ordered]@{
  at = (Get-Date).ToUniversalTime().ToString("o")
  device = $serial
  model = (& $adb -s $serial shell getprop ro.product.model 2>&1).Trim()
  scenarios = @()
}

$links = @(
  @{ id = "01-home"; uri = "imamai://"; wait = 5 },
  @{ id = "02-prayer"; uri = "imamai://prayer"; wait = 5 },
  @{ id = "03-quran-list"; uri = "imamai://more/quran"; wait = 5 },
  @{ id = "04-surah1"; uri = "imamai://more/surah/1/1"; wait = 7 },
  @{ id = "05-surah2-255"; uri = "imamai://more/surah/2/255"; wait = 8 },
  @{ id = "06-mushaf-surah1"; uri = "imamai://more/mushaf-surah/1"; wait = 8 },
  @{ id = "07-hatim-hub"; uri = "imamai://more/hatim"; wait = 6 },
  @{ id = "08-hatim-settings"; uri = "imamai://more/hatim/settings"; wait = 5 },
  @{ id = "09-hatim-tajweed-on"; uri = "imamai://more/mushaf-book/1?continuousMushaf=1&focusSurah=1&focusAyah=2&tajweed=1"; wait = 16 },
  @{ id = "10-hatim-tajweed-off"; uri = "imamai://more/mushaf-book/1?continuousMushaf=1&focusSurah=1&focusAyah=2"; wait = 12 },
  @{ id = "11-hatim-page-50"; uri = "imamai://more/mushaf-book/50?continuousMushaf=1&tajweed=1"; wait = 14 },
  @{ id = "12-tajweed-guide"; uri = "imamai://more/tajweed"; wait = 8 },
  @{ id = "13-halal"; uri = "imamai://more/halal"; wait = 5 },
  @{ id = "14-hadith"; uri = "imamai://more/hadith"; wait = 6 },
  @{ id = "15-namaz"; uri = "imamai://more/namaz-guide"; wait = 5 },
  @{ id = "16-hajj"; uri = "imamai://more/hajj"; wait = 5 },
  @{ id = "17-qibla"; uri = "imamai://qibla"; wait = 6 },
  @{ id = "18-duas"; uri = "imamai://duas"; wait = 5 },
  @{ id = "19-tasbih"; uri = "imamai://tasbih"; wait = 4 },
  @{ id = "20-quran-settings"; uri = "imamai://more/quran-settings"; wait = 5 },
  @{ id = "21-profile"; uri = "imamai://profile"; wait = 4 }
)

foreach ($l in $links) {
  Write-Host "--- $($l.id) ---"
  $r = Open-Link $l.uri $l.wait $l.id
  $r.pass = $r.crash_free
  $results.scenarios += $r
  Write-Host $(if ($r.pass) { "PASS" } else { "FAIL" }) " $($l.uri)"
}

# Hatim reader chrome: open settings sheet from mushaf
Open-Link "imamai://more/mushaf-book/1?continuousMushaf=1&tajweed=1" 12 "22-hatim-reader-tajweed" | Out-Null
Tap-Text "Баптау" | Out-Null
Tap-Text "Settings" | Out-Null
Start-Sleep -Seconds 2
$sheet = Shot "23-hatim-settings-sheet"
$results.scenarios += [ordered]@{ id = "23-hatim-settings-sheet"; screenshot = $sheet; note = "settings sheet clip check" }

$json = Join-Path $OutDir "full-app-qa-results.json"
($results | ConvertTo-Json -Depth 6) | Set-Content $json -Encoding utf8
Write-Host "`nSaved $json"
$fail = @($results.scenarios | Where-Object { $_.crash_free -eq $false }).Count
Write-Host "crash_failures=$fail total=$($results.scenarios.Count)"
if ($fail -gt 0) { exit 1 }
