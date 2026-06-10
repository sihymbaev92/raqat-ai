# Windows equivalent of: bash scripts/run_pg_cutover.sh [--validate-only|--apply]
# Usage:
#   $env:PG_DSN = "postgresql://postgres:postgres@127.0.0.1:5433/raqat_shadow"
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_run_pg_cutover.ps1 -ValidateOnly

param(
    [switch]$ValidateOnly,
    [switch]$Apply
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Sqlite = if ($env:RAQAT_DB_PATH) { $env:RAQAT_DB_PATH } else { Join-Path $Root "global_clean.db" }
$PgDsn = if ($env:PG_DSN) { $env:PG_DSN } elseif ($env:DATABASE_URL_WRITER) { $env:DATABASE_URL_WRITER } else { $env:DATABASE_URL }

if (-not $PgDsn) { throw "Set PG_DSN or DATABASE_URL(_WRITER)" }
if (-not (Test-Path $Sqlite)) { throw "SQLite not found: $Sqlite" }

New-Item -ItemType Directory -Force -Path ".logs" | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = Join-Path $Root ".logs\pg_cutover_$stamp.log"

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
    Write-Host "[validate-only] SQL placeholder audit" -ForegroundColor Green
    $auditExit = Invoke-PythonLogged -PyArgs @("scripts/audit_sql_placeholders.py") -LogPath $log -Quiet
    if ($auditExit -ne 0) {
        Write-Host "[audit] exit $auditExit — placeholders remain (see #102)" -ForegroundColor Yellow
    }
    Write-Host "[validate-only] Row-count validation (no copy)" -ForegroundColor Green
    $validateExit = Invoke-PythonLogged -PyArgs @(
        "scripts/migrate_sqlite_to_postgres.py", "--sqlite", $Sqlite, "--pg-dsn", $PgDsn, "--validate-only"
    ) -LogPath $log -Append
    if ($validateExit -ne 0) { throw "validate-only failed (exit $validateExit) — see $log" }
    Write-Host "[done] validate-only finished. Log: $log" -ForegroundColor Green
    exit 0
}

Write-Host "[apply] audit + backup + migrate + validate" -ForegroundColor Green
$auditExit = Invoke-PythonLogged -PyArgs @("scripts/audit_sql_placeholders.py") -LogPath $log -Quiet
if ($auditExit -ne 0) {
    Write-Host "[audit] exit $auditExit — placeholders remain (see #102)" -ForegroundColor Yellow
}

Write-Host "[2/4] SQLite backup" -ForegroundColor Cyan
& bash scripts/backup_sqlite.sh 2>&1 | Tee-Object -FilePath $log -Append
if ($LASTEXITCODE -ne 0) { throw "backup failed — see $log" }

$migrateExit = Invoke-PythonLogged -PyArgs @(
    "scripts/migrate_sqlite_to_postgres.py",
    "--sqlite", $Sqlite,
    "--pg-dsn", $PgDsn,
    "--bootstrap-ddl",
    "--with-quran-hadith",
    "--validate"
) -LogPath $log -Append
if ($migrateExit -ne 0) { throw "migrate failed (exit $migrateExit) — see $log" }

$validateExit = Invoke-PythonLogged -PyArgs @(
    "scripts/migrate_sqlite_to_postgres.py", "--sqlite", $Sqlite, "--pg-dsn", $PgDsn, "--validate-only"
) -LogPath $log -Append
if ($validateExit -ne 0) { throw "validate-only rerun failed — see $log" }

Write-Host "[done] Cutover workflow finished. Log: $log" -ForegroundColor Green
