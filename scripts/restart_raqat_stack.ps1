# One-command Windows restart + health check for RAQAT platform API (8787).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\restart_raqat_stack.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\restart_raqat_stack.ps1 -StartRedis
param(
    [switch]$StartRedis
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ApiDir = Join-Path $Root "platform_api"
$LogDir = Join-Path $Root ".logs"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

function Test-PythonHasPsycopg {
    param([string]$PythonExe)
    if (-not (Test-Path $PythonExe)) { return $false }
    cmd /c """$PythonExe"" -c ""import psycopg"" >nul 2>nul"
    return ($LASTEXITCODE -eq 0)
}

function Import-DotEnv {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    Get-Content -LiteralPath $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line.Length -eq 0 -or $line.StartsWith("#")) { return }
        $eq = $line.IndexOf("=")
        if ($eq -lt 1) { return }
        $key = $line.Substring(0, $eq).Trim()
        $val = $line.Substring($eq + 1).Trim()
        if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
        elseif ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Substring(1, $val.Length - 2) }
        [Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}

Import-DotEnv (Join-Path $Root ".env")

if ($StartRedis) {
    $Compose = Join-Path $Root "infra\docker\docker-compose.yml"
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker -and (Test-Path $Compose)) {
        Write-Host "Starting Redis via docker compose..."
        docker compose -f $Compose up -d redis | Out-Host
    } else {
        Write-Warning "Docker/compose not found; Redis start skipped."
    }
}

Write-Host "Restarting platform_api on :8787 ..."
$portPids = @(Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
foreach ($procId in $portPids) {
    try { Stop-Process -Id $procId -Force -ErrorAction Stop } catch {}
}
Start-Sleep -Seconds 2

$sysPython = (Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1)
$needsPg = (($env:DATABASE_URL + "").Trim().ToLower().StartsWith("postgres"))
$ApiPyCandidates = if ($needsPg) {
    @(
        (Join-Path $ApiDir ".venv\Scripts\python.exe"),
        (Join-Path $Root ".venv\Scripts\python.exe"),
        $sysPython
    )
} else {
    @(
        (Join-Path $Root ".venv\Scripts\python.exe"),
        (Join-Path $ApiDir ".venv\Scripts\python.exe"),
        $sysPython
    )
}
$ApiPy = $null
foreach ($cand in $ApiPyCandidates) {
    if (-not (Test-Path $cand)) { continue }
    if ($needsPg) {
        $inVenv = $cand -like "*\.venv\Scripts\python.exe"
        if ($inVenv) {
            if (Test-PythonHasPsycopg -PythonExe $cand) { $ApiPy = $cand; break }
            continue
        }
        if (Test-PythonHasPsycopg -PythonExe $cand) { $ApiPy = $cand; break }
    } else {
        $ApiPy = $cand
        break
    }
}
if (-not $ApiPy) {
    if ($needsPg) {
        throw "No Python with psycopg found for PostgreSQL mode."
    }
    throw "Python not found (.venv or platform_api\.venv)."
}

$apiOut = Join-Path $LogDir "platform_api.out.log"
$apiErr = Join-Path $LogDir "platform_api.err.log"
Start-Process -FilePath $ApiPy `
    -ArgumentList "-m","uvicorn","main:app","--host","0.0.0.0","--port","8787" `
    -WorkingDirectory $ApiDir `
    -RedirectStandardOutput $apiOut `
    -RedirectStandardError $apiErr `
    -WindowStyle Hidden

Write-Host "Waiting for API warmup ..."
$base = if ($env:RAQAT_PLATFORM_API_BASE) { $env:RAQAT_PLATFORM_API_BASE } else { "http://127.0.0.1:8787" }
$base = $base.TrimEnd("/")
$apiReady = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $h = Invoke-RestMethod -Uri "$base/health" -TimeoutSec 3
        if ($h.status -eq "ok") { $apiReady = $true; break }
    } catch {}
    Start-Sleep -Seconds 2
}
if (-not $apiReady) {
    Write-Warning "API did not become healthy within 30 seconds."
}

$VerifyScript = Join-Path $Root "scripts\verify_raqat_stack.ps1"
if (Test-Path $VerifyScript) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $VerifyScript
} else {
    Write-Host (Invoke-RestMethod -Uri "$base/health" -TimeoutSec 8 | ConvertTo-Json -Compress)
    Write-Host (Invoke-RestMethod -Uri "$base/ready" -TimeoutSec 12 | ConvertTo-Json -Compress)
}

function Write-RaqatProcessHints {
    function Count-TopLevelPython {
        param([array]$procs)
        if ($procs.Count -le 1) { return $procs.Count }
        $byId = @{}
        foreach ($p in $procs) { $byId[[uint32]$p.ProcessId] = $p }
        $n = 0
        foreach ($p in $procs) {
            if ($byId.ContainsKey([uint32]$p.ParentProcessId)) { continue }
            $n++
        }
        return $n
    }

    $uv = @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue `
        | Where-Object { $_.CommandLine -like "*uvicorn*" })
    if ((Count-TopLevelPython -procs $uv) -gt 1) {
        Write-Warning "Multiple top-level uvicorn ($($uv.Count) total PIDs). Only one should bind :8787. Run: .\scripts\diagnostics_raqat_processes.ps1"
    }
}

Write-RaqatProcessHints
Write-Host "Done. Logs: $LogDir"
