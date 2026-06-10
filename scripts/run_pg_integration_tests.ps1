# PostgreSQL integration tests (Docker postgres + migrate validate).
#   powershell -ExecutionPolicy Bypass -File scripts/run_pg_integration_tests.ps1
#   ... -NoDocker   # container already running
param(
  [switch]$NoDocker
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $RepoRoot

$Dsn = if ($env:RAQAT_PG_TEST_DSN) { $env:RAQAT_PG_TEST_DSN } else { "postgresql://postgres:postgres@127.0.0.1:5432/raqat_test" }
$Container = if ($env:RAQAT_PG_TEST_CONTAINER) { $env:RAQAT_PG_TEST_CONTAINER } else { "raqat-pg-test" }
$ComposeFile = Join-Path $RepoRoot "infra/docker/docker-compose.pg-test.yml"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "docker not found - start Docker Desktop"
}

try {
  docker info *> $null
  if ($LASTEXITCODE -ne 0) { throw "docker daemon not running" }
} catch {
  throw "Docker daemon not running - open Docker Desktop"
}

if (-not $NoDocker) {
  $names = @(docker ps -a --format "{{.Names}}" 2>$null)
  $exists = $names -contains $Container
  $runningNames = @(docker ps --format "{{.Names}}" 2>$null)
  $running = $runningNames -contains $Container

  if ($exists -and -not $running) {
    Write-Host "== start existing container: $Container =="
    docker start $Container | Out-Null
  } elseif (-not $exists) {
    Write-Host "== docker compose up: $ComposeFile =="
    docker compose -f $ComposeFile up -d
  }

  Write-Host "== wait for postgres =="
  $ready = $false
  foreach ($i in 1..40) {
    docker exec $Container pg_isready -U postgres -d raqat_test 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 1
  }
  if (-not $ready) {
    docker logs $Container 2>&1 | Select-Object -Last 20
    throw "postgres not ready ($Container)"
  }
}

Write-Host "== pip: requirements-postgres.txt =="
python -m pip install -q -U pip
python -m pip install -q -r requirements-postgres.txt

$env:RAQAT_PG_TEST_DSN = $Dsn
Write-Host "== pytest integration (DSN=$Dsn) =="
python -m pytest tests/test_pg_migrate_integration.py -m integration -v
