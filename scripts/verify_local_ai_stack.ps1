# Local: GET /health + POST /api/v1/ai/chat smoke. API must be listening (e.g. 8787).
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\verify_local_ai_stack.ps1
#   $env:RAQAT_SMOKE_API_BASE = "http://<LAN-IP>:8787"  # optional
$ErrorActionPreference = "Stop"
$base = if ($env:RAQAT_SMOKE_API_BASE) { $env:RAQAT_SMOKE_API_BASE.Trim().TrimEnd("/") } else { "http://127.0.0.1:8787" }
Write-Host "Base: $base" -ForegroundColor Cyan
try {
    $h = Invoke-RestMethod -Uri "$base/health" -Method Get -TimeoutSec 8
    Write-Host "HEALTH: $($h | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Error "HEALTH failed. Start API: scripts\run_platform_api.ps1 -Dev -FreePort`n$_"
    exit 1
}
$Root = Split-Path -Parent $PSScriptRoot
$Smoke = Join-Path $Root "platform_api\scripts\smoke_ai_chat.py"
$Py = Join-Path $Root "platform_api\.venv\Scripts\python.exe"
if (-not (Test-Path $Py)) {
    Write-Error "Missing python venv. Run: scripts\setup_venv_platform_api.ps1`n$Py"
    exit 1
}
$env:RAQAT_SMOKE_API_BASE = $base
& $Py $Smoke
exit $LASTEXITCODE
