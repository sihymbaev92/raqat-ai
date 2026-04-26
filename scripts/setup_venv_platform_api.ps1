# platform_api үшін Windows .venv құру + pip install (Activate.ps1 қажет емес).
# Пайдалану (жоба түбінен): powershell -ExecutionPolicy Bypass -File .\scripts\setup_venv_platform_api.ps1
# Немесе: $env:PYTHON_EXE = "C:\...\python.exe" — нақты python.org Python
$ErrorActionPreference = "Stop"

function Resolve-PythonExe {
    if ($env:PYTHON_EXE -and (Test-Path $env:PYTHON_EXE)) {
        return (Resolve-Path $env:PYTHON_EXE).Path
    }
    $base = Join-Path $env:LOCALAPPDATA "Programs\Python"
    if (Test-Path $base) {
        $exes = @(Get-ChildItem -Path $base -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -match '\\Python3[0-9]+\\python\.exe$' })
        if ($exes.Count -gt 0) {
            return ($exes | Sort-Object { [int]($_.Directory.Name -replace '^Python', '') } -Descending |
                Select-Object -First 1).FullName
        }
    }
    $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        $real = & py -3 -c "import sys; print(sys.executable)" 2>$null
        if ($real -and (Test-Path $real.Trim())) { return $real.Trim() }
    }
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd -and ($cmd.Source -notmatch '\\WindowsApps\\')) {
        return $cmd.Source
    }
    return $null
}

$Root = Split-Path -Parent $PSScriptRoot
$Api = Join-Path $Root "platform_api"
Set-Location $Api
$Py = Resolve-PythonExe
if (-not $Py) {
    Write-Error @"
Real Python not found. python.org installer PATH: Local\Programs\Python.
Do NOT use Microsoft Store stub (WindowsApps\python.exe).
Set PYTHON_EXE to full path, e.g.:
  `$env:PYTHON_EXE='C:\Users\YOU\AppData\Local\Programs\Python\Python312\python.exe'
"@
}
Write-Host "Using Python: $Py"
& $Py --version

# Ескі бұзылған .venv
if (Test-Path ".venv") {
    Write-Host "Ескі .venv жойылуда..."
    Remove-Item -Recurse -Force ".venv"
}

Write-Host "venv құралуда..."
& $Py -m venv .venv

$Vpy = Join-Path $Api ".venv\Scripts\python.exe"
if (-not (Test-Path $Vpy)) {
    Write-Error ("python.exe not found in venv: {0}" -f $Vpy)
}

Write-Host "pip install..."
& $Vpy -m pip install --upgrade pip
& $Vpy -m pip install -r requirements.txt
if (Test-Path "requirements-postgres.txt") {
    & $Vpy -m pip install -r requirements-postgres.txt
}
$MigrateReq = Join-Path $Root "scripts\requirements-pg-migrate.txt"
if (Test-Path $MigrateReq) {
    & $Vpy -m pip install -r $MigrateReq
}

Write-Host "Done. Uvicorn example:"
Write-Host ('  "{0}" -m uvicorn main:app --host 127.0.0.1 --port 8787' -f $Vpy)
Write-Host '  Or: powershell -ExecutionPolicy Bypass -File scripts\run_platform_api.ps1 -Dev'
