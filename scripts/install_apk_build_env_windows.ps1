#Requires -Version 5.1
<#
  APK жинау үшін Windows-та: JDK 17 (Temurin) + Android Studio (SDK онымен келеді).
  Админ құқығы қажет емес (қолданбалар пайдаланушыға орнатылады),
  бірақ толық орнату үшін интернет пен https://github.com, winget сабақтасуы керек.

  Орындау: PowerShell-де репо түбірінен:
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install_apk_build_env_windows.ps1
#>
$ErrorActionPreference = "Stop"

function Test-Winget {
  $w = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $w) {
    throw "winget not found. Install App Installer: https://aka.ms/getwinget"
  }
}

function Install-WithWinget {
  param([string[]]$WingetArgs)
  $p = Start-Process -FilePath "winget" -ArgumentList $WingetArgs -Wait -PassThru -NoNewWindow
  if ($p.ExitCode -ne 0) {
    $cmd = $WingetArgs -join " "
    throw "winget failed (exit $($p.ExitCode)). Often: network/timeout 0x80072ee2 to GitHub. Retries: proxy/VPN, or install JDK/Studio by hand. Command: winget $cmd"
  }
}

function Find-Jdk17Home {
  $candidates = @()
  $ad = "${env:ProgramFiles}\Eclipse Adoptium"
  if (Test-Path $ad) {
    $candidates += Get-ChildItem -Path $ad -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^jdk-17' }
  }
  $ms = "${env:ProgramFiles}\Microsoft"
  if (Test-Path $ms) {
    $candidates += Get-ChildItem -Path $ms -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'jdk-17' }
  }
  $jhome = "${env:ProgramFiles}\Java"
  if (Test-Path $jhome) {
    $candidates += Get-ChildItem -Path $jhome -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '17' -or $_.Name -like 'jdk-17*' }
  }
  foreach ($d in ($candidates | Sort-Object FullName -Descending)) {
    if (Test-Path (Join-Path $d.FullName "bin\java.exe")) { return $d.FullName }
  }
  return $null
}

Test-Winget

Write-Host "=== winget: Eclipse Temurin 17 (JDK) ===" -ForegroundColor Cyan
try {
  Install-WithWinget @(
    "install", "-e", "--id", "EclipseAdoptium.Temurin.17.JDK",
    "--source", "winget",
    "--accept-source-agreements", "--accept-package-agreements", "--disable-interactivity"
  )
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host "JDK: https://adoptium.net/ (Windows x64) - set User JAVA_HOME to the JDK folder after install." -ForegroundColor Yellow
}

$jdk = Find-Jdk17Home
if ($jdk) {
  Write-Host "JAVA_HOME: $jdk" -ForegroundColor Green
  [Environment]::SetEnvironmentVariable("JAVA_HOME", $jdk, "User")
  $env:JAVA_HOME = $jdk
} else {
  Write-Host "Warning: JDK 17 folder not found. Set User JAVA_HOME to Eclipse Adoptium path after install." -ForegroundColor Yellow
}

Write-Host "=== winget: Android Studio ===" -ForegroundColor Cyan
try {
  Install-WithWinget @(
    "install", "-e", "--id", "Google.AndroidStudio",
    "--source", "winget",
    "--accept-source-agreements", "--accept-package-agreements", "--disable-interactivity"
  )
} catch {
  Write-Host "Android Studio орнату қатесі (желі немесе пакет): $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "Нүктелік: https://developer.android.com/studio" -ForegroundColor Yellow
}

$androidSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$studioJbr = "${env:ProgramFiles}\Android\Android Studio\jbr"
if (Test-Path (Join-Path $studioJbr "bin\java.exe")) {
  if (-not $env:JAVA_HOME) {
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $studioJbr, "User")
    $env:JAVA_HOME = $studioJbr
    Write-Host "JAVA_HOME Android Studio jbr-ге қойылды: $studioJbr" -ForegroundColor Green
  }
}

if (Test-Path (Join-Path $androidSdk "platforms")) {
  [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdk, "User")
  $env:ANDROID_HOME = $androidSdk
  Write-Host "ANDROID_HOME: $androidSdk" -ForegroundColor Green
} else {
  Write-Host "SDK not yet installed. Open Android Studio, SDK Manager, install a platform (often API 35 for Expo 54 / RN 0.81)." -ForegroundColor Yellow
  Write-Host "Expected path: $androidSdk" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next: new terminal, cd into mobile, then: npm run build:apk" -ForegroundColor Cyan
Write-Host "APK output: mobile\android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
