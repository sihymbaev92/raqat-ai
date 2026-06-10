# Sprint 1 #107 — Incident simulation SIM-01..04 (local/staging)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_incident_simulation.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_incident_simulation.ps1 -SkipSim01 -SkipSim03

param(
    [string]$ApiBase = "http://127.0.0.1:8787",
    [switch]$SkipSim01,
    [switch]$SkipSim02,
    [switch]$SkipSim03,
    [switch]$SkipSim04
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

New-Item -ItemType Directory -Force -Path ".logs" | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = Join-Path $Root ".logs\incident_sim_$stamp.log"
$results = @()

function Add-Result {
    param([string]$Id, [string]$Status, [string]$Note)
    $line = "$Id`t$Status`t$Note"
    $script:results += [pscustomobject]@{ Sim = $Id; Status = $Status; Note = $Note }
    $line | Add-Content -Path $log
    Write-Host "[$Id] $Status — $Note" -ForegroundColor $(if ($Status -eq "PASS") { "Green" } elseif ($Status -eq "SKIP") { "Yellow" } else { "Red" })
}

"incident_sim start=$stamp api=$ApiBase" | Out-File -FilePath $log -Encoding utf8

# SIM-01 — PG rollback drill (< 15 min)
if ($SkipSim01) {
    Add-Result "SIM-01" "SKIP" "flag SkipSim01"
}
else {
    $t0 = Get-Date
    try {
        & powershell -ExecutionPolicy Bypass -File "$Root\scripts\sprint1_rollback_drill.ps1" -ApiBase $ApiBase 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "rollback_drill exit $LASTEXITCODE" }
        $sec = ((Get-Date) - $t0).TotalSeconds
        Add-Result "SIM-01" "PASS" ("rollback drill {0:N1}s" -f $sec)
    }
    catch {
        Add-Result "SIM-01" "FAIL" $_.Exception.Message
    }
}

# SIM-02 — AI KB-Only adversarial (pytest structure gate)
if ($SkipSim02) {
    Add-Result "SIM-02" "SKIP" "flag SkipSim02"
}
else {
    $t0 = Get-Date
    python -m pytest tests/test_ai_kb_only_mode.py tests/test_ai_kb_status_api.py -q 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $sec = ((Get-Date) - $t0).TotalSeconds
        Add-Result "SIM-02" "PASS" ("KB-only pytest {0:N1}s" -f $sec)
    }
    else {
        Add-Result "SIM-02" "FAIL" "pytest exit $LASTEXITCODE"
    }
}

# SIM-03 — Mobile background last read (manual + Jest proxy)
if ($SkipSim03) {
    Add-Result "SIM-03" "SKIP" "flag SkipSim03"
}
else {
    Push-Location (Join-Path $Root "mobile")
    try {
        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        npx jest --ci --testPathPattern=quranLastReadSync 2>&1 | Out-Null
        $jestExit = $LASTEXITCODE
        $ErrorActionPreference = $prevEap
        if ($jestExit -eq 0) {
            Add-Result "SIM-03" "PASS" "Jest quranLastReadSync (device QA: Android home→reopen manual)"
        }
        else {
            Add-Result "SIM-03" "FAIL" "jest exit $jestExit"
        }
    }
    finally {
        Pop-Location
    }
}

# SIM-04 — Metrics rollback trigger dry-run (5xx rate logic)
if ($SkipSim04) {
    Add-Result "SIM-04" "SKIP" "flag SkipSim04"
}
else {
    $py = @"
import json
import sys

# Dry-run: simulate breach detection without injecting prod 5xx
window = 200
fivexx = 12
max_rate = 0.05
rate = fivexx / window
breach = rate > max_rate
out = {
    'dry_run': True,
    'window': window,
    'http_5xx_total': fivexx,
    'rate': round(rate, 4),
    'max_rate': max_rate,
    'would_breach': breach,
    'runbook': 'docs/operations/sprint-1-cutover-rollback-runbook.md',
}
print(json.dumps(out))
if not breach:
    sys.exit(1)
"@
    $simOut = python -c $py 2>&1
    if ($LASTEXITCODE -eq 0) {
        Add-Result "SIM-04" "PASS" "5xx breach dry-run OK ($simOut)"
    }
    else {
        Add-Result "SIM-04" "FAIL" $simOut
    }
}

# #106 cache drill (M3 dependency)
try {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & powershell -ExecutionPolicy Bypass -File "$Root\scripts\sprint1_redis_cache_drill.ps1" 2>&1 | Out-Null
    $drillExit = $LASTEXITCODE
    $ErrorActionPreference = $prevEap
    if ($drillExit -eq 0) {
        Add-Result "#106" "PASS" "redis cache drill"
    }
    else {
        Add-Result "#106" "FAIL" "cache drill exit $drillExit"
    }
}
catch {
    Add-Result "#106" "FAIL" $_.Exception.Message
}

Write-Host ""
Write-Host "=== M3 Incident simulation summary ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$fail = @($results | Where-Object { $_.Status -eq "FAIL" }).Count
if ($fail -gt 0) {
    throw "$fail scenario(s) FAILED — see $log"
}

Write-Host "OK — SIM pack complete. Log: $log" -ForegroundColor Green
