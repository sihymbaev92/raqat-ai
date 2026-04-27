# Advisory only: shows which PID listens on 8787 and lists uvicorn / bot_main workers.
# Killing "duplicate" PIDs can crash the stack if they are parent/child (Windows + multiprocessing).
#
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\stop_stray_raqat_python.ps1
$ErrorActionPreference = "Continue"

Write-Host "== RAQAT process hints (manual cleanup) =="

try {
    $listen = @(Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique)
    if ($listen.Count -ge 1) {
        foreach ($lid in $listen) {
            $p = Get-CimInstance Win32_Process -Filter "ProcessId=$lid" -ErrorAction SilentlyContinue
            $c = if ($p) { $p.CommandLine } else { "(unknown)" }
            if ($c.Length -gt 130) { $c = $c.Substring(0, 130) + "..." }
            Write-Host "8787 listener PID ${lid}: $c"
        }
    } else {
        Write-Host "8787: no LISTEN process (API down?)"
    }
} catch {
    Write-Warning "Could not query port 8787: $_"
}

Write-Host ""
Write-Host "Run for full list: .\scripts\diagnostics_raqat_processes.ps1"
Write-Host "BOT_TOKEN: only one polling bot (stop VPS OR local). Task Manager: end duplicate python.exe carefully."
Write-Host "Done."
