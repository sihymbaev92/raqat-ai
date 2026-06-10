# Release APK: 32-бит + 64-бит ARM (көп телефон), ASCII Gradle home, production bundle.
# Шығысы: android\app\build\outputs\apk\release\app-release.apk
# Ескерту: Play қолписі жоқ болса, release әлі де debug.keystore қолданады (ішкі таратуға).
$ErrorActionPreference = "Stop"
$mobileDir = Split-Path $PSScriptRoot
$repoRoot = Split-Path $mobileDir
$asciiGradleHome = Join-Path $repoRoot ".gradle-user-home-ascii"
New-Item -ItemType Directory -Force -Path $asciiGradleHome | Out-Null
$env:GRADLE_USER_HOME = $asciiGradleHome
$env:NODE_ENV = "production"
Set-Location (Join-Path $mobileDir "android")
# gradle.properties-тегі тек arm64 үстінен жазамыз — eski ARMv7 телефондарға сыйымды APK
# lintVitalAnalyzeRelease: кей Windows/кэш жолдарында AAR transform қатесі — орнату APK үшін өткізіп жібереміз
& .\gradlew.bat assembleRelease --no-daemon `
  "-PreactNativeArchitectures=armeabi-v7a,arm64-v8a" `
  "-x" "lintVitalAnalyzeRelease" `
  @args
if ($LASTEXITCODE -ne 0) {
  Write-Error "Gradle assembleRelease сәтсіз аяқталды (код $LASTEXITCODE)."
}
$apk = Join-Path $mobileDir "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apk) {
  $len = (Get-Item $apk).Length
  Write-Host "OK: $apk ($len bytes)"
} else {
  Write-Warning "APK табылмады — Gradle шығысын тексеріңіз."
}
