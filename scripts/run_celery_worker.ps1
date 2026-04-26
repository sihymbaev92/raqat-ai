# Celery worker (needs Redis). Run AFTER: scripts\up_docker_redis.ps1 or working Redis at RAQAT_REDIS_URL.
# From repo root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\run_celery_worker.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Api = Join-Path $Root "platform_api"
$Celery = Join-Path $Api ".venv\Scripts\celery.exe"
if (-not (Test-Path $Celery)) {
    Write-Error "Run scripts\setup_venv_platform_api.ps1 first (celery in platform_api venv)."
}
Set-Location $Api
& $Celery "-A" "celery_app" "worker" "--loglevel=info"
