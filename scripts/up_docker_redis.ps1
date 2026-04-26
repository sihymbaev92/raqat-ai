# Start Redis (and optionally Postgres) via infra/docker/docker-compose.yml
# Requires Docker Desktop running.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/up_docker_redis.ps1
#        powershell -ExecutionPolicy Bypass -File scripts/up_docker_redis.ps1 -Postgres
param(
    [switch]$Postgres
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Compose = Join-Path $Root "infra\docker\docker-compose.yml"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "docker not found. Install Docker Desktop and ensure it is running."
}
Push-Location $Root
try {
    # Do not use @array splatting here: PowerShell may break "redis" for docker.exe (seen: "no such service: r").
    if ($Postgres) {
        docker compose -f $Compose up -d redis postgres
    } else {
        docker compose -f $Compose up -d redis
    }
    if (-not $?) {
        Write-Error "docker compose failed. Start Docker Desktop from the Start menu and wait until the engine is running, then retry."
        exit 1
    }
} finally {
    Pop-Location
}
Write-Host "OK. Default Redis URL: redis://127.0.0.1:6379/0 (set RAQAT_REDIS_URL in .env)."
Write-Host "API with Redis: powershell -ExecutionPolicy Bypass -File scripts/run_platform_api.ps1"
Write-Host "Stop redis: docker compose -f infra/docker/docker-compose.yml stop redis"
