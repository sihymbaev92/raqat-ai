# Feature freeze gate — бір команда: Jest preflight + perf baseline.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/run_freeze_gate.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "== freeze gate: preflight =="
& powershell -ExecutionPolicy Bypass -File "$Root\scripts\mobile_device_qa_preflight.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "== freeze gate: perf baseline =="
& powershell -ExecutionPolicy Bypass -File "$Root\scripts\perf_smoke_baseline.ps1"
exit $LASTEXITCODE
