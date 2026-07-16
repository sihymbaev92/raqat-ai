# Release APK: әдепкі arm64-only (APK ~15 MB аз); ескі ARMv7 үшін -DualAbi.
# Play / slim release: npm run build:apk (apk-slim stash + strip JSON).
# Шығысы: android\app\build\outputs\apk\release\app-release.apk
param(
  [switch]$DualAbi
)

$ErrorActionPreference = "Stop"
$mobileDir = Split-Path $PSScriptRoot
$repoRoot = Split-Path $mobileDir
$asciiGradleHome = Join-Path $repoRoot ".gradle-user-home-ascii"
New-Item -ItemType Directory -Force -Path $asciiGradleHome | Out-Null
$env:GRADLE_USER_HOME = $asciiGradleHome
$env:NODE_ENV = "production"
Set-Location (Join-Path $mobileDir "android")

$abiProp = if ($DualAbi) { "armeabi-v7a,arm64-v8a" } else { "arm64-v8a" }
Write-Host "assembleRelease ABIs: $abiProp"

& .\gradlew.bat assembleRelease --no-daemon `
  "-PreactNativeArchitectures=$abiProp" `
  "-x" "lintVitalAnalyzeRelease" `
  @args
if ($LASTEXITCODE -ne 0) {
  Write-Error "Gradle assembleRelease сәтсіз аяқталды (код $LASTEXITCODE)."
}
$apk = Join-Path $mobileDir "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apk) {
  $len = (Get-Item $apk).Length
  Write-Host ("OK: {0} ({1:N2} MB)" -f $apk, ($len / 1MB))
} else {
  Write-Warning "APK табылмады — Gradle шығысын тексеріңіз."
}
