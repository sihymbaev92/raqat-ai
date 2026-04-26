# Create repo-root .venv and pip install requirements-bot.txt (Telegram bot).
# Prerequisite: copy bot_main.py, handlers/, config/ from full repo into project root.
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\setup_venv_bot.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Resolve-PythonExe {
    if ($env:PYTHON_EXE -and (Test-Path $env:PYTHON_EXE)) { return (Resolve-Path $env:PYTHON_EXE).Path }
    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        $real = & py -3 -c "import sys; print(sys.executable)" 2>$null
        if ($real -and (Test-Path $real.Trim())) { return $real.Trim() }
    }
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd -and ($cmd.Source -notmatch '\\WindowsApps\\')) { return $cmd.Source }
    return $null
}

$Py = Resolve-PythonExe
if (-not $Py) {
    Write-Error "Python not found. Set PYTHON_EXE to python.org Python path."
}

$Req = Join-Path $Root "requirements-bot.txt"
if (-not (Test-Path $Req)) {
    Write-Error "Missing requirements-bot.txt"
}

if (-not (Test-Path (Join-Path $Root ".venv"))) {
    Write-Host "Creating .venv ..."
    & $Py -m venv .venv
}

$Vpy = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $Vpy)) {
    Write-Error "venv python not found: $Vpy"
}

& $Vpy -m pip install --upgrade pip
& $Vpy -m pip install -r $Req
Write-Host "Done. Run bot: powershell -ExecutionPolicy Bypass -File .\scripts\run_bot.ps1"
