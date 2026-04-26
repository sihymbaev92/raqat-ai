# Docker Desktop install: UAC prompt (Run as administrator).
# Default installer: D:\DockerDesktopInstaller.exe
# Download: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
#
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\launch_docker_install_elevated.ps1
$ErrorActionPreference = "Stop"
$exe = if ($env:DOCKER_DESKTOP_INSTALLER) { $env:DOCKER_DESKTOP_INSTALLER } else { "D:\DockerDesktopInstaller.exe" }
if (-not (Test-Path $exe)) {
    Write-Error "Installer not found: $exe. Save to D:\ or set DOCKER_DESKTOP_INSTALLER."
}
Write-Host "Click Yes on UAC. Install may take several minutes."
$proc = Start-Process -FilePath $exe -Verb RunAs -ArgumentList @("install", "--accept-license", "--quiet", "--always-run-service") -Wait -PassThru
Write-Host ("Installer exit code: {0}. Reboot if prompted; then start Docker Desktop from the tray." -f $proc.ExitCode)
