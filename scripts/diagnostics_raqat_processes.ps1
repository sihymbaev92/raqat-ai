# Lists Python uvicorn processes (conflict hints for :8787).
# Usage from repo root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\diagnostics_raqat_processes.ps1
$ErrorActionPreference = "Continue"

function Get-PythonCmdlines {
    Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue
}

Write-Host "== RAQAT Python processes =="

$allPy = @(Get-PythonCmdlines)
$uv = @($allPy | Where-Object { $_.CommandLine -like "*uvicorn*" })

function Count-TopLevelProcesses {
    param(
        [array]$procs
    )
    if ($procs.Count -eq 0) { return 0 }
    $byId = @{}
    foreach ($p in $procs) { $byId[[uint32]$p.ProcessId] = $p }
    $n = 0
    foreach ($p in $procs) {
        $ppid = [uint32]$p.ParentProcessId
        if ($byId.ContainsKey($ppid)) { continue }
        $n++
    }
    return $n
}

if ($uv.Count -eq 0) {
    Write-Host "uvicorn: none"
} else {
    $uvTop = Count-TopLevelProcesses -procs $uv
    Write-Host "uvicorn: $uvTop top-level, $($uv.Count) total (Windows may show a venv + system-python child)"
    foreach ($p in $uv) {
        $c = $p.CommandLine
        if ($c.Length -gt 120) { $c = $c.Substring(0, 120) + "..." }
        Write-Host "  PID $($p.ProcessId) (parent $($p.ParentProcessId)) : $c"
    }
    if ($uvTop -gt 1) {
        Write-Warning "Multiple independent uvicorn starters detected. Only one should bind :8787. Stop extras, then re-run restart_raqat_stack.ps1"
    }
}

Write-Host "Done."
