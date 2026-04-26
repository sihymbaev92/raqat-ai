# RAQAT платформа API (uvicorn). Порт: $env:PORT немесе 8787.
# Пайдалану: powershell -ExecutionPolicy Bypass -File scripts/run_platform_api.ps1
#           (немесе pwsh, егер PowerShell 7 орнатсаңыз)
#           -Dev — Redis өшігілі (жергілікті тест)
#
# Redis жоқ тест: -Dev немесе $env:RAQAT_REDIS_REQUIRED = "0"
# (әдепкіде API Redis күтеді — main.py lifespan)
param(
    [switch]$Dev
)
$ErrorActionPreference = "Stop"
if ($Dev) {
    $env:RAQAT_REDIS_REQUIRED = "0"
}
$Root = Split-Path -Parent $PSScriptRoot
$ApiDir = Join-Path $Root "platform_api"
$Uvicorn = Join-Path $ApiDir ".venv\Scripts\uvicorn.exe"
if (-not (Test-Path $Uvicorn)) {
    Write-Error "Алдымен: powershell -ExecutionPolicy Bypass -File scripts\\setup_venv_platform_api.ps1"
}
$bindHost = if ($env:HOST) { $env:HOST } else { "0.0.0.0" }
$port = if ($env:PORT) { [int]$env:PORT } else { 8787 }
Set-Location $ApiDir
& $Uvicorn "main:app" "--host" $bindHost "--port" "$port"
