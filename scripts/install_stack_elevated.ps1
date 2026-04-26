# Толық орту: WSL компоненттері + Docker Desktop (Redis/Postgres кейін compose арқылы).
# МІНДЕТТІ: PowerShell-ді оң жақ батырма → «Іске қосу администратор ретінде» (Run as administrator).
# Пайдалану: powershell -ExecutionPolicy Bypass -File scripts/install_stack_elevated.ps1
#           $env:DOCKER_EXE = "D:\DockerDesktopInstaller.exe" — орнату файлын өзгертуге болады
#Requires -RunAsAdministrator
$ErrorActionPreference = "Stop"

$DockerExe = if ($env:DOCKER_EXE) { $env:DOCKER_EXE } else { "D:\DockerDesktopInstaller.exe" }

Write-Host "1/3 WSL компоненттері (бастапқы қуаттау)..."
$null = Start-Process -FilePath "dism.exe" -ArgumentList @(
    "/online", "/enable-feature", "/featurename:Microsoft-Windows-Subsystem-Linux",
    "/all", "/norestart"
) -Wait -PassThru
$null = Start-Process -FilePath "dism.exe" -ArgumentList @(
    "/online", "/enable-feature", "/featurename:VirtualMachinePlatform",
    "/all", "/norestart"
) -Wait -PassThru

Write-Host "2/3 wsl --update (болса)..."
try { wsl --update 2>$null } catch { }

if (-not (Test-Path $DockerExe)) {
    Write-Error "Docker инсталляторы табылмайды: $DockerExe`nЖүктеу: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
}

Write-Host "3/3 Docker Desktop орнату (бірнеше минут)..."
$proc = Start-Process -FilePath $DockerExe -ArgumentList @(
    "install", "--quiet", "--accept-license", "--always-run-service", "--backend=wsl-2"
) -Wait -PassThru -NoNewWindow

Write-Host "Инсталлятор шығу коды: $($proc.ExitCode) (0 = сәтті деп қабылданады)"
Write-Host ""
Write-Host "Келесі: компьютерді қайта қосыңыз (WSL үшін ұсынылады), содан Docker Desktop қалқасынан іске қосыңыз."
Write-Host "Содан кейін: docker compose -f infra/docker/docker-compose.yml up -d redis"
Write-Host "Немесе: powershell -ExecutionPolicy Bypass -File scripts/up_docker_redis.ps1"
