# Sprint 1 #103 — pre-cutover gate (backup + validate-only + sample parity)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_cutover_precheck.ps1

param(
    [string]$PgDsn = "",
    [int]$SampleSize = 10
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Sqlite = if ($env:RAQAT_DB_PATH) { $env:RAQAT_DB_PATH } else { Join-Path $Root "global_clean.db" }
if (-not $PgDsn) {
    $PgDsn = if ($env:PG_DSN) { $env:PG_DSN } else { "postgresql://postgres:postgres@127.0.0.1:5433/raqat_shadow" }
}

if (-not (Test-Path $Sqlite)) { throw "SQLite not found: $Sqlite" }

New-Item -ItemType Directory -Force -Path (Join-Path $Root "backups") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root ".logs") | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $Root "backups\global_clean_precheck_$stamp.db"
$log = Join-Path $Root ".logs\cutover_precheck_$stamp.log"

Write-Host "[1/4] SQLite backup -> $backup" -ForegroundColor Cyan
Copy-Item -Force $Sqlite $backup
"backup=$backup" | Out-File -FilePath $log -Encoding utf8

Write-Host "[2/4] validate-only" -ForegroundColor Cyan
$env:PG_DSN = $PgDsn
python scripts/migrate_sqlite_to_postgres.py --sqlite $Sqlite --pg-dsn $PgDsn --validate-only 2>&1 | Tee-Object -FilePath $log -Append
if ($LASTEXITCODE -ne 0) { throw "validate-only failed — see $log" }

Write-Host "[3/4] sample parity (n=$SampleSize)" -ForegroundColor Cyan
python scripts/sprint1_cutover_sample_validate.py --sqlite $Sqlite --pg-dsn $PgDsn --sample $SampleSize 2>&1 | Tee-Object -FilePath $log -Append
if ($LASTEXITCODE -ne 0) { throw "sample validate failed — see $log" }

Write-Host "[4/4] precheck manifest" -ForegroundColor Cyan
@"
precheck_stamp=$stamp
sqlite=$Sqlite
backup=$backup
pg_dsn=$PgDsn
sample_size=$SampleSize
"@ | Add-Content -Path $log

Write-Host "OK — pre-cutover gate passed. Log: $log" -ForegroundColor Green
Write-Host "Next: read-only window -> sprint1_run_pg_cutover.ps1 -Apply -> switch DATABASE_URL -> sprint1_cutover_monitor.ps1" -ForegroundColor Yellow
