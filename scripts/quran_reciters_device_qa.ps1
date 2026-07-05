# Quran reciters — device QA (settings list + Surah 1 playback smoke).
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/quran_reciters_device_qa.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/quran_reciters_device_qa.ps1 -SkipBuild
#
# Phone: USB debugging ON → Allow RSA when prompted.

param(
  [switch]$SkipBuild,
  [switch]$SkipCdn,
  [int]$WaitAuthorizeSec = 180,
  [string]$Apk = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $Root "mobile\qa-reciters-device"
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
        Write-Host "-> Telefon: USB debugging -> Allow (RSA)"
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
  Invoke-Adb $adb $serial @("shell", "screencap", "-p", "/sdcard/reciter-qa.png")
  $dest = Join-Path $OutDir "$name.png"
  Invoke-Adb $adb $serial @("pull", "/sdcard/reciter-qa.png", $dest)
  return $dest
}

function UiDump($adb, $serial) {
  & $adb -s $serial shell uiautomator dump /sdcard/reciter-ui.xml 2>&1 | Out-Null
  return (& $adb -s $serial shell cat /sdcard/reciter-ui.xml 2>&1) -join "`n"
}

function Test-DeepLinkNoCrash($adb, $serial, $uri, $waitSec = 6) {
  & $adb -s $serial logcat -c 2>&1 | Out-Null
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $adb -s $serial shell am start -a android.intent.action.VIEW -d $uri -p kz.raqat.app 2>&1 | Out-Null
  $ErrorActionPreference = $prev
  Start-Sleep -Seconds $waitSec
  $log = & $adb -s $serial logcat -d 2>&1 | Out-String
  return -not ($log -match "FATAL EXCEPTION|AndroidRuntime.*FATAL")
}

Write-Host "== Quran reciters QA =="

if (-not $SkipCdn) {
  Write-Host "== CDN URL verify (all reciters) =="
  Push-Location (Join-Path $Root "mobile")
  node scripts/verify-quran-reciters-cdn.mjs
  if ($LASTEXITCODE -ne 0) { throw "CDN verify failed" }
  Pop-Location
}

$adb = Find-Adb
if (-not $adb) { throw "adb not found" }

$serial = Wait-AuthorizedDevice $adb $WaitAuthorizeSec
if (-not $serial) {
  throw @"
No authorized device in ${WaitAuthorizeSec}s.
1) USB cable + Developer options -> USB debugging ON
2) Phone prompt -> Allow
3) Re-run: powershell -ExecutionPolicy Bypass -File scripts/quran_reciters_device_qa.ps1
"@
}
Write-Host "OK device $serial"

if (-not $Apk) {
  $Apk = Join-Path $Root "mobile\android\app\build\outputs\apk\release\app-release.apk"
}
if (-not $SkipBuild -and -not (Test-Path $Apk)) {
  Write-Host "== Build release APK =="
  Push-Location (Join-Path $Root "mobile")
  npm run build:apk
  if ($LASTEXITCODE -ne 0) { throw "build:apk failed" }
  Pop-Location
}
if (-not (Test-Path $Apk)) { throw "APK missing: $Apk" }

Write-Host "== Install APK =="
Invoke-Adb $adb $serial @("install", "-r", $Apk)

$reciterNeedles = @(
  "Халифа", "Кулиев", "Уок", "Walk", "Суд", "Sudais", "Хусари", "Husary", "Афаси", "Alafasy", "Басит", "Basit"
)

Write-Host "== Quran settings (reciter list) =="
$okSettings = Test-DeepLinkNoCrash $adb $serial "imamai://more/quran-settings" 8
$xmlSettings = UiDump $adb $serial
$pngSettings = Shot $adb $serial "01-quran-settings"
$found = @()
foreach ($n in $reciterNeedles) {
  if ($xmlSettings -match [regex]::Escape($n)) { $found += $n }
}
Write-Host "UI needles found: $($found -join ', ')"
if (-not $okSettings) { throw "quran-settings crashed" }
if ($found.Count -lt 4) {
  Write-Host "WARN fewer reciter labels in UI dump than expected (scroll settings?)"
}

Write-Host "== Surah 1 reader =="
$okSurah = Test-DeepLinkNoCrash $adb $serial "imamai://more/surah/1/1" 8
$pngSurah = Shot $adb $serial "02-surah-1"
if (-not $okSurah) { throw "surah/1/1 crashed" }

Write-Host "== Tap ayah play area (approx center-bottom) =="
Invoke-Adb $adb $serial @("shell", "input", "keyevent", "KEYCODE_WAKEUP")
Start-Sleep -Seconds 1
Invoke-Adb $adb $serial @("shell", "input", "tap", "540", "1200")
Start-Sleep -Seconds 4
$logPlay = & $adb -s $serial logcat -d 2>&1 | Out-String
$audioErr = $logPlay -match "ExoPlayer.*error|MediaPlayer.*error|Unable to resolve host|HTTP 403|HTTP 404"
$pngPlay = Shot $adb $serial "03-after-play-tap"
if ($audioErr) {
  Write-Host "WARN possible audio error in logcat (check screenshot / manual reciter switch)"
} else {
  Write-Host "OK no obvious ExoPlayer/MediaPlayer errors after play tap"
}

$report = @{
  device = $serial
  at = (Get-Date).ToString("o")
  cdnSkipped = [bool]$SkipCdn
  settingsCrashFree = $okSettings
  surahCrashFree = $okSurah
  uiNeedlesFound = $found
  screenshots = @($pngSettings, $pngSurah, $pngPlay)
  manualReciterCheck = @(
    "Open Surah 1 -> gear -> Reciter: test each of 7 reciters (kk/ru/en/ar groups)",
    "Play ayah 1: Halifa Altai, Kuliev, Ibrahim Walk, Sudais, Husary, Alafasy, Abdul Basit"
  )
}
$reportPath = Join-Path $OutDir "reciter-qa-report.json"
$report | ConvertTo-Json -Depth 5 | Set-Content -Path $reportPath -Encoding UTF8

Write-Host ""
Write-Host "OK automated device smoke done."
Write-Host "Report: $reportPath"
Write-Host "Screens: $OutDir"
Write-Host ""
Write-Host "MANUAL (required): switch each reciter in reader settings and confirm audio plays."
