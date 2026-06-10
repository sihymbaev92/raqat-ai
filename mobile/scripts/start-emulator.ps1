# Эмуляторды дұрыс ANDROID_HOME арқылы іске қосу
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "setup-android-emulator-env.ps1")
$AvdName = "Raqat_Pixel_API34"
$avds = & emulator -list-avds 2>$null
if ($avds -notcontains $AvdName) {
  Write-Host "AVD жоқ: $AvdName — алдымен: run-android-live.ps1" -ForegroundColor Red
  exit 1
}
$running = (& adb devices) | Select-String "emulator-\d+\s+device"
if ($running) {
  Write-Host "Эмулятор қазірдің өзінде online." -ForegroundColor Green
  exit 0
}
Write-Host "Іске қосу: $AvdName (ANDROID_HOME=$env:ANDROID_HOME)" -ForegroundColor Cyan
$emuExe = Join-Path (Join-Path $env:LOCALAPPDATA "Android\Sdk\emulator") "emulator.exe"
if (-not (Test-Path $emuExe)) { $emuExe = "emulator" }
Start-Process -FilePath $emuExe -ArgumentList @(
  "-avd", $AvdName,
  "-gpu", "swiftshader_indirect",
  "-no-snapshot-load",
  "-accel", "auto"
)
Write-Host "Терезе ашылды — boot 1–2 минут. Содан: npm start → a" -ForegroundColor Yellow
