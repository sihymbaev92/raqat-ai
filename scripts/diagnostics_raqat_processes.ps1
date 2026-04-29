# Lists Python processes: uvicorn and bot_main.py (conflict hints).
# "Duplicate" system copies often omit .venv in path; repo venv is ...\.venv\Scripts\python.exe
# Usage from repo root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\diagnostics_raqat_processes.ps1
$ErrorActionPreference = "Continue"

function Get-PythonCmdlines {
    Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue
}

Write-Host "== RAQAT Python processes =="

$allPy = @(Get-PythonCmdlines)
$uv = @($allPy | Where-Object { $_.CommandLine -like "*uvicorn*" })
$bot = @($allPy | Where-Object { $_.CommandLine -like "*bot_main.py*" })

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
        if ($byId.ContainsKey($ppid)) { continue } # child of another listed python
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

if ($bot.Count -eq 0) {
    Write-Host "bot_main.py: none"
} else {
    $botTop = Count-TopLevelProcesses -procs $bot
    Write-Host "bot_main.py: $botTop top-level, $($bot.Count) total (child python.exe is often normal on Windows)"
    foreach ($p in $bot) {
        $c = $p.CommandLine
        if ($c.Length -gt 120) { $c = $c.Substring(0, 120) + "..." }
        Write-Host "  PID $($p.ProcessId) (parent $($p.ParentProcessId)) : $c"
    }
    if ($botTop -gt 1) {
        Write-Warning "Multiple independent bot starters detected. One BOT_TOKEN => one poller. Stop the extra bot (VPS/second shell)."
    }
}

Write-Host "Done."
