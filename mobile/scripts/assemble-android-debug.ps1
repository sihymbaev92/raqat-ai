# Debug APK: NODE_ENV + (қажет болса) ASCII-only Gradle кэші — кирилл user profile жолында prefab/Java қатесі болмас үшін.
$ErrorActionPreference = "Stop"
$mobileDir = Split-Path $PSScriptRoot
$repoRoot = Split-Path $mobileDir
$asciiGradleHome = Join-Path $repoRoot ".gradle-user-home-ascii"
New-Item -ItemType Directory -Force -Path $asciiGradleHome | Out-Null
$env:GRADLE_USER_HOME = $asciiGradleHome
$env:NODE_ENV = "development"
Set-Location (Join-Path $mobileDir "android")
& .\gradlew.bat assembleDebug --no-daemon @args
Write-Host "APK шамамен: $mobileDir\android\app\build\outputs\apk\debug\app-debug.apk"
