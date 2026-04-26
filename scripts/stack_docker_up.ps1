# Redis + platform_api (docker-compose.stack.yml). Репо түбірінен іске қосыңыз.
# Пайдалану:
#   powershell -ExecutionPolicy Bypass -File .\scripts\stack_docker_up.ps1
#   Фонда: -Detached
param(
    [switch]$Detached,
    [switch]$Build
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Compose = Join-Path $Root "infra\docker\docker-compose.stack.yml"
if (-not (Test-Path $Compose)) {
    Write-Error "Missing $Compose"
}
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Error "docker not in PATH"
}
Set-Location $Root
$arg = @("compose", "-f", $Compose, "up")
if ($Build) { $arg += "--build" }
if ($Detached) { $arg += "-d" }
Write-Host "docker $($arg -join ' ')"
& docker @arg
$redisPort = if ($env:RAQAT_STACK_REDIS_PORT) { $env:RAQAT_STACK_REDIS_PORT } else { "6380" }
Write-Host ""
Write-Host "Келесі қадамдар:" -ForegroundColor Cyan
Write-Host "  API денсаулық: http://127.0.0.1:8787/ready"
Write-Host "  Бот .env:      RAQAT_PLATFORM_URL=http://127.0.0.1:8787"
Write-Host "  Хост Redis:    redis://127.0.0.1:$redisPort/0  (порт: RAQAT_STACK_REDIS_PORT, әдепкі 6380)"
Write-Host "  Бот:           .\scripts\run_bot.ps1  немесе  .\scripts\run_stack_dev.ps1 -BotOnly"
