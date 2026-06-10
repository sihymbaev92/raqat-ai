# RAQAT платформа API (uvicorn). Порт: $env:PORT немесе 8787.
# Пайдалану: powershell -ExecutionPolicy Bypass -File scripts/run_platform_api.ps1
#           (немесе pwsh, егер PowerShell 7 орнатсаңыз)
#           -Dev — Redis өшігілі (жергілікті тест)
#           -FreePort — 8787 (немесе $env:PORT) босатылғанша алдыңғы тыңдаушыны аяқтау
#
# Redis жоқ тест: -Dev немесе $env:RAQAT_REDIS_REQUIRED = "0"
# (әдепкіде API Redis күтеді — main.py lifespan)
# -FreePort — осы PORT (әдепкі 8787) тыңдаушы үдерістерді аяқтау (WinError 10048 сақтандыруы)
param(
    [switch]$Dev,
    [switch]$FreePort
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
if ($FreePort) {
    $portPids = @(Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
    foreach ($procId in $portPids) {
        if (-not $procId) { continue }
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            Write-Host "FreePort: үдеріс $procId аяқталды (:$port тыңдаушы)." -ForegroundColor DarkYellow
        } catch { Write-Warning "FreePort: PID $procId тоқтату сәтсіз: $_" }
    }
    if ($portPids.Count -gt 0) { Start-Sleep -Seconds 1 }
}
Set-Location $ApiDir
& $Uvicorn "main:app" "--host" $bindHost "--port" "$port"
