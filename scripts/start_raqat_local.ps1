# Start infra + platform API from repo root (one terminal).
# 1) Tries Docker Redis (infra/docker/docker-compose.yml).
# 2) If Redis is up -> API without -Dev (Redis required). Else -> API with -Dev.
# Telegram bot: bot_main.py is not in this portable bundle; run separately from full repo.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\start_raqat_local.ps1
#   Skip Docker: -SkipDockerRedis
param(
    [switch]$SkipDockerRedis
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Compose = Join-Path $Root "infra\docker\docker-compose.yml"

Set-Location $Root

$redisUp = $false
if (-not $SkipDockerRedis) {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
        docker compose -f $Compose up -d redis 2>$null
        if ($LASTEXITCODE -eq 0) {
            $redisUp = $true
            Write-Host "OK: Docker Redis container is up."
        } else {
            Write-Host "WARN: docker compose redis failed (Docker not running?). API will use -Dev."
        }
    } else {
        Write-Host "WARN: docker not in PATH. API will use -Dev."
    }
}

$RunApi = Join-Path $Root "scripts\run_platform_api.ps1"
if ($redisUp) {
    Write-Host "Starting platform API (Redis required)..."
    & powershell -NoProfile -ExecutionPolicy Bypass -File $RunApi
} else {
    Write-Host "Starting platform API (-Dev)..."
    & powershell -NoProfile -ExecutionPolicy Bypass -File $RunApi -Dev
}
