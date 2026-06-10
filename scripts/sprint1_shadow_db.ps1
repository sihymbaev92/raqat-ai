# Sprint 1 #101 — Shadow PostgreSQL (Windows)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_shadow_db.ps1 -ValidateOnly
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_shadow_db.ps1 -Apply
#
# DSN: postgresql://postgres:postgres@127.0.0.1:5433/raqat_shadow
# Integration pytest: RAQAT_PG_TEST_DSN=...5433/raqat_test (басқа DB — shadow-ды truncate etmeydi)

param(
    [switch]$ValidateOnly,
    [switch]$Apply
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Sqlite = if ($env:RAQAT_DB_PATH) { $env:RAQAT_DB_PATH } else { Join-Path $Root "global_clean.db" }
$PgDsn = if ($env:PG_DSN) { $env:PG_DSN } else { "postgresql://postgres:postgres@127.0.0.1:5433/raqat_shadow" }
$Container = "raqat-pg-shadow"
$Port = 5433

function Ensure-Docker {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
        for ($i = 0; $i -lt 36; $i++) {
            Start-Sleep -Seconds 5
            docker info 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) { return }
        }
        throw "Docker daemon not ready"
    }
}

function Ensure-ShadowPg {
    $existing = docker ps -a --filter "name=$Container" --format "{{.Names}}" 2>$null
    if ($existing -eq $Container) {
        $running = docker ps --filter "name=$Container" --format "{{.Names}}" 2>$null
        if ($running -ne $Container) { docker start $Container | Out-Null }
    }
    else {
        docker run -d --name $Container `
            -e POSTGRES_PASSWORD=postgres `
            -e POSTGRES_DB=raqat_shadow `
            -p "${Port}:5432" `
            postgres:16 | Out-Null
    }
    for ($i = 0; $i -lt 30; $i++) {
        docker exec $Container pg_isready -U postgres 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { return }
        Start-Sleep -Seconds 2
    }
    throw "PostgreSQL container not ready"
}

if (-not (Test-Path $Sqlite)) { throw "SQLite not found: $Sqlite" }

Ensure-Docker
Ensure-ShadowPg
Write-Host "Shadow PG: $PgDsn" -ForegroundColor Cyan

python -m pip install -q -r requirements-postgres.txt 2>$null

New-Item -ItemType Directory -Force -Path ".logs" | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = Join-Path $Root ".logs\shadow_db_$stamp.log"

$env:PG_DSN = $PgDsn
$env:RAQAT_DB_PATH = $Sqlite

function Invoke-PythonLogged {
    param(
        [string[]]$PyArgs,
        [string]$LogPath,
        [switch]$Append,
        [switch]$Quiet
    )
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    if ($Quiet) {
        $output = & python @PyArgs 2>&1
        if ($Append) { $output | Out-File -FilePath $LogPath -Append -Encoding utf8 }
        else { $output | Out-File -FilePath $LogPath -Encoding utf8 }
    }
    elseif ($Append) {
        & python @PyArgs 2>&1 | Tee-Object -FilePath $LogPath -Append | Out-Null
    }
    else {
        & python @PyArgs 2>&1 | Tee-Object -FilePath $LogPath | Out-Null
    }
    $code = [int]$LASTEXITCODE
    $ErrorActionPreference = $prevEap
    return $code
}

if ($ValidateOnly -and -not $Apply) {
    Write-Host "[validate-only] audit + row validation" -ForegroundColor Green
    $auditExit = Invoke-PythonLogged -PyArgs @("scripts/audit_sql_placeholders.py") -LogPath $log -Quiet
    if ($auditExit -ne 0) {
        Write-Host "[audit] placeholders found (exit $auditExit) — expected pre-PG cutover" -ForegroundColor Yellow
    }
    $validateExit = Invoke-PythonLogged -PyArgs @(
        "scripts/migrate_sqlite_to_postgres.py", "--sqlite", $Sqlite, "--pg-dsn", $PgDsn, "--validate-only"
    ) -LogPath $log -Append
    if ($validateExit -ne 0) { throw "validate-only failed (exit $validateExit) — see $log" }
}
else {
    Write-Host "[apply] bootstrap + migrate + validate" -ForegroundColor Green
    $auditExit = Invoke-PythonLogged -PyArgs @("scripts/audit_sql_placeholders.py") -LogPath $log -Quiet
    if ($auditExit -ne 0) {
        Write-Host "[audit] placeholders found (exit $auditExit) — expected pre-PG cutover" -ForegroundColor Yellow
    }
    $migrateExit = Invoke-PythonLogged -PyArgs @(
        "scripts/migrate_sqlite_to_postgres.py",
        "--sqlite", $Sqlite,
        "--pg-dsn", $PgDsn,
        "--bootstrap-ddl",
        "--with-quran-hadith",
        "--truncate",
        "--validate"
    ) -LogPath $log -Append
    if ($migrateExit -ne 0) { throw "migrate failed (exit $migrateExit) — see $log" }
    $validateExit = Invoke-PythonLogged -PyArgs @(
        "scripts/migrate_sqlite_to_postgres.py", "--sqlite", $Sqlite, "--pg-dsn", $PgDsn, "--validate-only"
    ) -LogPath $log -Append
    if ($validateExit -ne 0) { throw "validate-only failed (exit $validateExit) — see $log" }
}
Write-Host "OK — log: $log" -ForegroundColor Green
