# Локальды Backend топ: PostgreSQL + Redis (docker compose).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/bootstrap_dev_pg_redis.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Compose = Join-Path $Root "infra\docker\docker-compose.yml"
$PgDsn = if ($env:PG_DSN) { $env:PG_DSN } else { "postgresql://raqat:raqat_dev@127.0.0.1:5432/raqat" }
$RedisUrl = if ($env:RAQAT_REDIS_URL) { $env:RAQAT_REDIS_URL } else { "redis://127.0.0.1:6379/0" }

Write-Host "== RAQAT Backend bootstrap: PostgreSQL + Redis =="

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "ERR: docker жоқ"
  exit 1
}

$RedisHostPort = if ($env:RAQAT_REDIS_HOST_PORT) { $env:RAQAT_REDIS_HOST_PORT } else { "6379" }

docker compose -f $Compose up -d postgres

Write-Host "Күту: postgres health..."
for ($i = 0; $i -lt 30; $i++) {
  docker compose -f $Compose exec -T postgres pg_isready -U raqat -d raqat 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 1
}

$redisUp = $false
try {
  docker compose -f $Compose up -d redis 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $redisUp = $true }
} catch {}

if (-not $redisUp) {
  Write-Host "WARN: порт 6379 бос емес (Windows Hyper-V) — Redis 16379 портына орнатылады"
  docker rm -f raqat-redis 2>$null | Out-Null
  $RedisHostPort = "16379"
  docker run -d --name raqat-redis --restart unless-stopped -p "${RedisHostPort}:6379" redis:7-alpine redis-server --appendonly yes | Out-Null
}

$RedisUrl = if ($env:RAQAT_REDIS_URL) { $env:RAQAT_REDIS_URL } else { "redis://127.0.0.1:${RedisHostPort}/0" }

$pgOk = $false
$redisOk = $false
for ($i = 0; $i -lt 15; $i++) {
  docker compose -f $Compose exec -T postgres pg_isready -U raqat -d raqat 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $pgOk = $true }
  $ping = docker exec raqat-redis redis-cli ping 2>$null
  if ($ping -match "PONG") { $redisOk = $true }
  if ($pgOk -and $redisOk) { break }
  Start-Sleep -Seconds 1
}

if (-not ($pgOk -and $redisOk)) {
  Write-Host "WARN: health толық расталмады — docker ps тексеріңіз"
}

Write-Host ""
Write-Host "OK  PostgreSQL: $PgDsn"
Write-Host "OK  Redis:      $RedisUrl"
Write-Host ""
Write-Host "Түбір .env-ке қосыңыз:"
Write-Host "  DATABASE_URL=$PgDsn"
Write-Host "  DATABASE_URL_WRITER=$PgDsn"
Write-Host "  RAQAT_REDIS_URL=$RedisUrl"
Write-Host "  RAQAT_REDIS_REQUIRED=1"
Write-Host ""
Write-Host "Келесі: bash scripts/run_pg_cutover.sh --validate-only  (Git Bash / WSL)"
