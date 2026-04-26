# Күндік SQLite көшірме: scripts/backup_sqlite_hot.py (sqlite3 backup API).
# Репо түбірінен: powershell -ExecutionPolicy Bypass -File .\scripts\backup_sqlite_daily.ps1
# Жоспарлаушы (Task Scheduler): күнделікті, жұмыс қалтасы = репо түбірі.
param(
    [string]$DbPath = "",
    [string]$DestDir = "backups/sqlite",
    [int]$KeepDays = 14
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

if (-not $DbPath) {
    $DbPath = ($env:RAQAT_DB_PATH + "").Trim()
    if (-not $DbPath) { $DbPath = ($env:DB_PATH + "").Trim() }
    if (-not $DbPath) { $DbPath = Join-Path $Root "global_clean.db" }
}

$DestAbs = if ([System.IO.Path]::IsPathRooted($DestDir)) { $DestDir } else { Join-Path $Root $DestDir }

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) {
    Write-Error "python PATH-та табылмады"
}
& $py.Source (Join-Path $Root "scripts\backup_sqlite_hot.py") `
    --source $DbPath `
    --dest-dir $DestAbs `
    --keep-days $KeepDays
