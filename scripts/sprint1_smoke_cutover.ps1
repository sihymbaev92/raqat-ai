# Sprint 1 #102 — cutover smoke: validate_pg_copy + /health /ready /content (Windows)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_smoke_cutover.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_smoke_cutover.ps1 -SkipApiStart

param(
    [switch]$SkipApiStart,
    [string]$ApiBase = "http://127.0.0.1:8787",
    [int]$ApiPort = 8787
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Sqlite = if ($env:RAQAT_DB_PATH) { $env:RAQAT_DB_PATH } else { Join-Path $Root "global_clean.db" }
$PgDsn = if ($env:PG_DSN) { $env:PG_DSN } else { "postgresql://postgres:postgres@127.0.0.1:5433/raqat_shadow" }
$RedisUrl = if ($env:RAQAT_REDIS_URL) { $env:RAQAT_REDIS_URL } else { "redis://127.0.0.1:16379/0" }

if (-not (Test-Path $Sqlite)) { throw "SQLite not found: $Sqlite" }

function Import-DotEnvKey {
    param([string]$Key)
    $envFile = Join-Path $Root ".env"
    if (-not (Test-Path $envFile)) { return }
    foreach ($line in Get-Content $envFile -ErrorAction SilentlyContinue) {
        if ($line -match "^\s*$([regex]::Escape($Key))=(.+)$") {
            Set-Item -Path "env:$Key" -Value $matches[1].Trim().Trim('"').Trim("'")
        }
    }
}

if (-not $env:RAQAT_CONTENT_READ_SECRET) { Import-DotEnvKey "RAQAT_CONTENT_READ_SECRET" }
if (-not $env:RAQAT_CONTENT_READ_SECRET) { Import-DotEnvKey "RAQAT_CONTENT_SECRET" }

$env:PG_DSN = $PgDsn
$env:DATABASE_URL = $PgDsn
$env:DATABASE_URL_WRITER = $PgDsn
$env:RAQAT_PG_USE_POOL = "1"
$env:RAQAT_PG_POOL_MIN = if ($env:RAQAT_PG_POOL_MIN) { $env:RAQAT_PG_POOL_MIN } else { "1" }
$env:RAQAT_PG_POOL_MAX = if ($env:RAQAT_PG_POOL_MAX) { $env:RAQAT_PG_POOL_MAX } else { "10" }
$env:RAQAT_REDIS_URL = $RedisUrl

New-Item -ItemType Directory -Force -Path ".logs" | Out-Null
$apiProc = $null

function Stop-ApiIfStarted {
    if ($apiProc -and -not $apiProc.HasExited) {
        Stop-Process -Id $apiProc.Id -Force -ErrorAction SilentlyContinue
    }
    Get-NetTCPConnection -LocalPort $ApiPort -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

try {
    if (-not $SkipApiStart) {
        Write-Host "Starting API on $ApiBase (PG pool min=$($env:RAQAT_PG_POOL_MIN) max=$($env:RAQAT_PG_POOL_MAX))" -ForegroundColor Cyan
        Stop-ApiIfStarted
        Start-Sleep -Seconds 1
        $apiProc = Start-Process -PassThru -WindowStyle Hidden -FilePath python `
            -ArgumentList "-m","uvicorn","main:app","--host","127.0.0.1","--port",$ApiPort `
            -WorkingDirectory (Join-Path $Root "platform_api") `
            -RedirectStandardOutput (Join-Path $Root ".logs\sprint1_api.log") `
            -RedirectStandardError (Join-Path $Root ".logs\sprint1_api.err.log")
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Seconds 1
            try {
                $r = Invoke-RestMethod -Uri "$ApiBase/ready" -TimeoutSec 5
                if ($r.ok -eq $true) { break }
            }
            catch { if ($i -eq 19) { throw "API /ready not up — see .logs\sprint1_api.err.log" } }
        }
        Write-Host "API ready backend=$($r.backend) redis=$($r.redis.status)" -ForegroundColor Green
    }

    Write-Host "Running smoke_cutover_validate.py" -ForegroundColor Cyan
    $smokeArgs = @(
        "scripts/smoke_cutover_validate.py",
        "--sqlite", $Sqlite,
        "--pg-dsn", $PgDsn,
        "--api-base", $ApiBase
    )
    if ($env:RAQAT_CONTENT_READ_SECRET) {
        $smokeArgs += @("--content-secret", $env:RAQAT_CONTENT_READ_SECRET)
    }
    python @smokeArgs
    if ($LASTEXITCODE -ne 0) { throw "smoke_cutover_validate failed (exit $LASTEXITCODE)" }

    Write-Host "OK — Sprint 1 #102 smoke passed" -ForegroundColor Green
}
finally {
    if (-not $SkipApiStart) { Stop-ApiIfStarted }
}
