# Sprint 1 #103 / SIM-01 — staging rollback drill (PG failure -> SQLite, timed)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_rollback_drill.ps1

param(
    [string]$PgDsn = "",
    [string]$PgContainer = "raqat-pg-shadow",
    [string]$ApiBase = "http://127.0.0.1:8787",
    [int]$ApiPort = 8787,
    [int]$MaxMinutes = 15
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Sqlite = if ($env:RAQAT_DB_PATH) { $env:RAQAT_DB_PATH } else { Join-Path $Root "global_clean.db" }
if (-not $PgDsn) {
    $PgDsn = if ($env:PG_DSN) { $env:PG_DSN } else { "postgresql://postgres:postgres@127.0.0.1:5433/raqat_shadow" }
}
$RedisUrl = if ($env:RAQAT_REDIS_URL) { $env:RAQAT_REDIS_URL } else { "redis://127.0.0.1:16379/0" }

if (-not (Test-Path $Sqlite)) { throw "SQLite not found: $Sqlite" }

New-Item -ItemType Directory -Force -Path ".logs" | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = Join-Path $Root ".logs\rollback_drill_$stamp.log"
$script:apiProc = $null

function Stop-Api {
    if ($script:apiProc -and -not $script:apiProc.HasExited) {
        Stop-Process -Id $script:apiProc.Id -Force -ErrorAction SilentlyContinue
        $script:apiProc = $null
    }
    Get-NetTCPConnection -LocalPort $ApiPort -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

function Wait-Ready {
    param([string]$ExpectBackend = "")
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Seconds 1
        try {
            $r = Invoke-RestMethod -Uri "$ApiBase/ready" -TimeoutSec 8
            if ($r.ok -eq $true) {
                if ($ExpectBackend -and $r.backend -ne $ExpectBackend) { continue }
                return $r
            }
        }
        catch { }
    }
    $errTail = ""
    $errPath = Join-Path $Root ".logs\rollback_drill_api.err.log"
    if (Test-Path $errPath) {
        $errTail = (Get-Content $errPath -Tail 5 -ErrorAction SilentlyContinue) -join "`n"
    }
    throw "API /ready timeout$(if ($errTail) { ": $errTail" })"
}

function Start-Api {
    Stop-Api
    Start-Sleep -Seconds 2
    $script:apiProc = Start-Process -PassThru -WindowStyle Hidden -FilePath python `
        -ArgumentList "-m","uvicorn","main:app","--host","127.0.0.1","--port",$ApiPort `
        -WorkingDirectory (Join-Path $Root "platform_api") `
        -RedirectStandardOutput (Join-Path $Root ".logs\rollback_drill_api.log") `
        -RedirectStandardError (Join-Path $Root ".logs\rollback_drill_api.err.log")
}

try {
    $running = docker ps --filter "name=$PgContainer" --format "{{.Names}}" 2>$null
    if ($running -ne $PgContainer) {
        docker start $PgContainer | Out-Null
        Start-Sleep -Seconds 4
    }

    Write-Host "[drill] Phase A — API on PostgreSQL" -ForegroundColor Cyan
    Remove-Item env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item env:DATABASE_URL_WRITER -ErrorAction SilentlyContinue
    $env:DATABASE_URL = $PgDsn
    $env:DATABASE_URL_WRITER = $PgDsn
    $env:RAQAT_PG_USE_POOL = "1"
    $env:RAQAT_REDIS_URL = $RedisUrl
    $env:RAQAT_DB_PATH = $Sqlite
    Start-Api
    $rPg = Wait-Ready -ExpectBackend "postgresql"
    Write-Host "  /ready backend=$($rPg.backend)" -ForegroundColor Green
    "phase_a backend=$($rPg.backend)" | Out-File -FilePath $log -Encoding utf8

    Write-Host "[drill] Phase B — PG down ($PgContainer stop)" -ForegroundColor Cyan
    docker stop $PgContainer | Out-Null
    "phase_b pg_stopped=$PgContainer" | Add-Content -Path $log

    Write-Host "[drill] Phase C — rollback to SQLite (timed)" -ForegroundColor Cyan
    Stop-Api
    # Non-postgres sentinel — empty DATABASE_URL is falsy and falls through to .env WRITER via dotenv
    $env:DATABASE_URL = "sqlite://rollback-drill"
    $env:DATABASE_URL_WRITER = "sqlite://rollback-drill"
    Remove-Item env:RAQAT_PG_USE_POOL -ErrorAction SilentlyContinue
    $env:RAQAT_DB_PATH = $Sqlite
    $env:RAQAT_REDIS_URL = $RedisUrl

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Start-Api
    $rSql = Wait-Ready -ExpectBackend "sqlite"
    $sw.Stop()
    $elapsedSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)

    $health = Invoke-RestMethod -Uri "$ApiBase/health" -TimeoutSec 10
    if ($health.status -ne "ok") { throw "/health not ok" }

    $maxSec = $MaxMinutes * 60
    $pass = $elapsedSec -le $maxSec
    @"
phase_c backend=$($rSql.backend)
rollback_elapsed_sec=$elapsedSec
max_sec=$maxSec
pass=$pass
"@ | Add-Content -Path $log

    Write-Host "Rollback elapsed: ${elapsedSec}s (limit ${maxSec}s) — $(if ($pass) {'PASS'} else {'FAIL'})" -ForegroundColor $(if ($pass) { "Green" } else { "Red" })
    if (-not $pass) { throw "Rollback drill exceeded ${MaxMinutes} min target" }
    Write-Host "OK — SIM-01 rollback drill passed. Log: $log" -ForegroundColor Green
}
finally {
    Stop-Api
    docker start $PgContainer 2>$null | Out-Null
    Write-Host "Restored $PgContainer" -ForegroundColor Yellow
}
