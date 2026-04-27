# Lists Python processes: uvicorn and bot_main.py (conflict hints).
# "Duplicate" system copies often omit .venv in path; repo venv is ...\.venv\Scripts\python.exe
# Usage from repo root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\diagnostics_raqat_processes.ps1
$ErrorActionPreference = "Continue"

function Get-PythonCmdlines {
    Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue
}

Write-Host "== RAQAT Python processes =="

$uv = @(Get-PythonCmdlines | Where-Object { $_.CommandLine -like "*uvicorn*" })
$bot = @(Get-PythonCmdlines | Where-Object { $_.CommandLine -like "*bot_main.py*" })

if ($uv.Count -eq 0) {
    Write-Host "uvicorn: none"
} else {
    Write-Host "uvicorn: $($uv.Count) process(es)"
    foreach ($p in $uv) {
        $c = $p.CommandLine
        if ($c.Length -gt 120) { $c = $c.Substring(0, 120) + "..." }
        Write-Host "  PID $($p.ProcessId): $c"
    }
    if ($uv.Count -gt 1) {
        Write-Warning "Only one uvicorn should listen on 8787. Stop extras in Task Manager, then re-run restart_raqat_stack.ps1"
    }
}

if ($bot.Count -eq 0) {
    Write-Host "bot_main.py: none"
} else {
    Write-Host "bot_main.py: $($bot.Count) process(es)"
    foreach ($p in $bot) {
        $c = $p.CommandLine
        if ($c.Length -gt 120) { $c = $c.Substring(0, 120) + "..." }
        Write-Host "  PID $($p.ProcessId): $c"
    }
    if ($bot.Count -gt 1) {
        Write-Warning "One BOT_TOKEN => one polling bot. Stop VPS or local duplicate. On Windows you may see 2 PIDs (parent/child); if both are bot_main, stop one and test."
    }
}

Write-Host "Done."
