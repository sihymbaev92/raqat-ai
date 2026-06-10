# Expo + Android эмулятор (AVD жоқ болса — жүйе образын жүктейді, AVD жасайды)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/run-android-live.ps1
#        powershell -ExecutionPolicy Bypass -File scripts/run-android-live.ps1 -SkipAvdSetup
param([switch]$SkipAvdSetup)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
. (Join-Path $PSScriptRoot "setup-android-emulator-env.ps1")

$AvdName = "Raqat_Pixel_API34"
$SysImg = "system-images;android-34;google_apis;x86_64"

if (-not $SkipAvdSetup) {
  $avds = & emulator -list-avds 2>$null
  if ($avds -notcontains $AvdName) {
    Write-Host "== SDK лицензия + system image (бірінші рет ~1–3 ГБ) ==" -ForegroundColor Cyan
    $yes = ("y`n" * 40)
    $yes | & sdkmanager --licenses 2>&1 | Out-Null
    & sdkmanager $SysImg "emulator" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "sdkmanager сәтсіз — Android Studio → SDK Manager арқылы system image орнатыңыз." }
    Write-Host "== AVD жасау: $AvdName ==" -ForegroundColor Cyan
    echo no | avdmanager create avd -n $AvdName -k $SysImg -d pixel_6 --force 2>&1
  }
}

$running = (& adb devices) | Select-String "emulator-" | Select-Object -First 1
if (-not $running) {
  Write-Host "== Эмулятор іске қосу ==" -ForegroundColor Cyan
  $emuExe = Join-Path (Join-Path $env:LOCALAPPDATA "Android\Sdk\emulator") "emulator.exe"
  if (-not (Test-Path $emuExe)) { $emuExe = "emulator" }
  Start-Process -FilePath $emuExe -ArgumentList @(
    "-avd", $AvdName,
    "-gpu", "swiftshader_indirect",
    "-no-snapshot-load"
  ) -WindowStyle Normal
  Write-Host "Boot күтілуде (30–90 с)…" -ForegroundColor Yellow
  & adb wait-for-device
  $deadline = (Get-Date).AddMinutes(3)
  do {
    $boot = (& adb shell getprop sys.boot_completed 2>$null).Trim()
    if ($boot -eq "1") { break }
    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)
}

Write-Host "== Expo (Android) ==" -ForegroundColor Cyan
& adb devices
npx expo start --android --clear
