# Портативті Redis (Windows, tporadowski) — Dockerсыз.
# Алдымен zip жүктеп D:\redis-portable ішіне шешіңіз (ішінде redis-server.exe болуы керек):
#   https://github.com/tporadowski/redis/releases  → Redis-x64-*.zip
#
# Пайдалану: powershell -ExecutionPolicy Bypass -File .\scripts\start_redis_portable.ps1
# Содан кейін .env: RAQAT_REDIS_URL=redis://127.0.0.1:6379/0
$ErrorActionPreference = "Stop"
$root = if ($env:REDIS_PORTABLE_ROOT) { $env:REDIS_PORTABLE_ROOT } else { "D:\redis-portable" }
if (-not (Test-Path $root)) {
    Write-Error "Қалта жоқ: $root`nZip-тен шешіп, redis-server.exe осы қалтада не ішкі қалтада болуы керек."
}
$exe = Get-ChildItem -Path $root -Filter "redis-server.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $exe) {
    Write-Error "redis-server.exe табылмайды: $root"
}
Write-Host "Redis:" $exe.FullName
$port = if ($env:REDIS_PORT) { [int]$env:REDIS_PORT } else { 6379 }
& $exe.FullName --port $port
