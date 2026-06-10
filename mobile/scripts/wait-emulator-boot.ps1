$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "setup-android-emulator-env.ps1")
Write-Host "Құрылғы күтілуде…" -ForegroundColor Cyan
& adb wait-for-device | Out-Null
$deadline = (Get-Date).AddMinutes(4)
do {
  $boot = ""
  try { $boot = (& adb shell getprop sys.boot_completed 2>$null).Trim() } catch {}
  if ($boot -eq "1") {
    Write-Host "BOOT_OK" -ForegroundColor Green
    & adb devices
    exit 0
  }
  Start-Sleep -Seconds 4
  Write-Host "… boot"
} while ((Get-Date) -lt $deadline)
& adb devices
Write-Host "Boot уақыты аяқталды — эмулятор терезесін тексеріңіз (HAXM/WHPX)." -ForegroundColor Red
exit 1
