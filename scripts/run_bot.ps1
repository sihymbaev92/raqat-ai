# Run Telegram bot (polling). Requires full bot sources in repo root.
# Usage (from repo root): powershell -ExecutionPolicy Bypass -File .\scripts\run_bot.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$main = Join-Path $Root "bot_main.py"
$handlers = Join-Path $Root "handlers"
$cfg1 = Join-Path $Root "config\settings.py"
$cfg2 = Join-Path $Root "config\__init__.py"

if (-not (Test-Path $main)) {
    Write-Error "Missing bot_main.py."
}
if (-not (Test-Path $handlers) -or -not ((Test-Path $cfg1) -or (Test-Path $cfg2))) {
    Write-Host "Warning: handlers\ or config\ missing; starting standalone bot_main (polling) per docs."
}

$Vpy = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $Vpy)) {
    $Vpy = Join-Path $Root "platform_api\.venv\Scripts\python.exe"
}
if (-not (Test-Path $Vpy)) {
    Write-Error "No Python venv found. Run: powershell -ExecutionPolicy Bypass -File .\scripts\setup_venv_bot.ps1"
}

$env:PYTHONPATH = $Root
Set-Location $Root
Write-Host "Using: $Vpy"
& $Vpy $main
