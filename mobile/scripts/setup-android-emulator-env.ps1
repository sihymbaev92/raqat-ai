# Android SDK PATH (бір рет терминалда: . .\scripts\setup-android-emulator-env.ps1)
$ErrorActionPreference = "Stop"
$localSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$altSdk = "C:\Android\Sdk"
if (-not (Test-Path $localSdk)) { throw "Android SDK жоқ: $localSdk — Android Studio орнатыңыз." }
# AVD/system-images көбіне C:\Android\Sdk; emulator/platform-tools — LocalAppData
$sysImg = Join-Path $altSdk "system-images\android-34\google_apis\x86_64"
$env:ANDROID_HOME = if (Test-Path $sysImg) { $altSdk } else { $localSdk }
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$cmdline = Join-Path $altSdk "cmdline-tools\latest\bin"
if (-not (Test-Path $cmdline)) {
  $cmdline = Join-Path $localSdk "cmdline-tools\latest\bin"
}
$env:PATH = "$cmdline;$localSdk\platform-tools;$localSdk\emulator;$altSdk\platform-tools;$env:PATH"
Write-Host "ANDROID_HOME=$env:ANDROID_HOME" -ForegroundColor Green
Write-Host "adb: $(Get-Command adb -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)" -ForegroundColor Green
