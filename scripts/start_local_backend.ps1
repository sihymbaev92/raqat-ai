# Локальды Backend стек: Docker PG+Redis + API + Celery (Windows).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/start_local_backend.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "== [1/4] Docker PG + Redis =="
& powershell -ExecutionPolicy Bypass -File "$Root\scripts\bootstrap_dev_pg_redis.ps1"

Write-Host ""
Write-Host "== [2/4] PG cutover (SQLite -> local PG, skip if already migrated) =="
$env:PG_DSN = "postgresql://raqat:raqat_dev@127.0.0.1:5432/raqat"
$env:RAQAT_DB_PATH = "$Root\global_clean.db"
if (Test-Path $env:RAQAT_DB_PATH) {
  try {
    python scripts/migrate_sqlite_to_postgres.py `
      --sqlite $env:RAQAT_DB_PATH `
      --pg-dsn $env:PG_DSN `
      --validate-only 2>&1 | Select-Object -Last 5
    Write-Host "SKIP migrate: PG already has data (validate-only OK)"
  } catch {
    Write-Host "WARN migrate skip: $($_.Exception.Message)"
  }
} else {
  Write-Host "SKIP: global_clean.db жоқ"
}

Write-Host ""
Write-Host "== [3/4] Platform API (8787) =="
Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1
New-Item -ItemType Directory -Force -Path "$Root\.logs" | Out-Null
Start-Process -WindowStyle Hidden -FilePath python `
  -ArgumentList "-m","uvicorn","main:app","--host","0.0.0.0","--port","8787" `
  -WorkingDirectory "$Root\platform_api" `
  -RedirectStandardOutput "$Root\.logs\platform_api.log" `
  -RedirectStandardError "$Root\.logs\platform_api.err.log"
Start-Sleep -Seconds 3
try {
  $h = Invoke-RestMethod -Uri "http://127.0.0.1:8787/ready" -TimeoutSec 15
  Write-Host "OK  /ready backend=$($h.backend) redis=$($h.redis.status)"
} catch {
  Write-Host "WARN API /ready: $($_.Exception.Message) — .logs\platform_api.err.log"
}

Write-Host ""
Write-Host "== [4/4] Celery worker =="
Get-Process python -ErrorAction SilentlyContinue | Where-Object {
  $_.Path -and (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine -match "celery"
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Process -WindowStyle Hidden -FilePath python `
  -ArgumentList "-m","celery","-A","celery_app","worker","--loglevel=info","--pool=solo" `
  -WorkingDirectory "$Root\platform_api" `
  -RedirectStandardOutput "$Root\.logs\celery_worker.log" `
  -RedirectStandardError "$Root\.logs\celery_worker.err.log"
Start-Sleep -Seconds 4
Write-Host "OK  Celery log: .logs\celery_worker.log"
Write-Host ""
Write-Host "Дайын. Тексеру: curl http://127.0.0.1:8787/health"
