# Removes C:\ProgramData\DockerDesktop (fixes Docker install error -5).
# Safe to run from a NORMAL terminal: you will get ONE UAC prompt.
# After this, run launch_docker_install_elevated.ps1 again.
param(
    [switch]$Elevated
)

$ErrorActionPreference = "Stop"

function Test-IsAdmin {
    $p = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

$scriptPath = $MyInvocation.MyCommand.Path
if (-not $scriptPath) {
    $scriptPath = Join-Path $PSScriptRoot "fix_docker_desktop_programdata.ps1"
}

if (-not (Test-IsAdmin)) {
    Write-Host "Requesting Administrator (UAC) to remove C:\ProgramData\DockerDesktop ..."
    Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $scriptPath,
        "-Elevated"
    ) -Wait
    exit $LASTEXITCODE
}

$p = "C:\ProgramData\DockerDesktop"
if (Test-Path $p) {
    Write-Host "Removing: $p"
    Remove-Item -Recurse -Force $p
    Write-Host "OK. Now run: powershell -ExecutionPolicy Bypass -File .\scripts\launch_docker_install_elevated.ps1"
} else {
    Write-Host "Folder not found (already removed): $p"
    Write-Host "Run installer anyway: .\scripts\launch_docker_install_elevated.ps1"
}
