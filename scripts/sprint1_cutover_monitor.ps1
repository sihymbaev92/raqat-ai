# Sprint 1 #103 — post-cutover KPI monitor (Deep Dive v2 §3)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_cutover_monitor.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_cutover_monitor.ps1 -DurationMinutes 10 -IntervalMinutes 1

param(
    [string]$ApiBase = "http://127.0.0.1:8787",
    [int]$DurationMinutes = 120,
    [int]$IntervalMinutes = 15,
    [double]$ReadyMinRate = 0.95,
    [double]$Max5xxRate = 0.05,
    [int]$MinRequestsFor5xx = 100,
    [int]$MaxConsecutiveSmokeFails = 3
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

New-Item -ItemType Directory -Force -Path ".logs" | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = Join-Path $Root ".logs\cutover_monitor_$stamp.log"

function Import-DotEnvKey {
    param([string]$Key)
    $envFile = Join-Path $Root ".env"
    if (-not (Test-Path $envFile)) { return }
    foreach ($line in Get-Content $envFile -ErrorAction SilentlyContinue) {
        if ($line -match "^\s*$([regex]::Escape($Key))=(.+)$") {
            Set-Item -Path "env:$Key" -Value $matches[1].Trim().Trim('"').Trim("'")
        }
    }
}
if (-not $env:RAQAT_CONTENT_READ_SECRET) { Import-DotEnvKey "RAQAT_CONTENT_READ_SECRET" }

$readyChecks = [System.Collections.Generic.List[bool]]::new()
$smokeFailStreak = 0
$start = Get-Date
$end = $start.AddMinutes($DurationMinutes)
$intervalSec = [math]::Max(30, $IntervalMinutes * 60)

Write-Host "KPI monitor $ApiBase — $($DurationMinutes) min, interval ${IntervalMinutes}m" -ForegroundColor Cyan
Write-Host "Triggers: ready<$([int]($ReadyMinRate*100))%, 5xx>$([int]($Max5xxRate*100))%, smoke fails>=$MaxConsecutiveSmokeFails" -ForegroundColor Cyan
"start=$start api=$ApiBase duration_min=$DurationMinutes" | Out-File -FilePath $log -Encoding utf8

while ((Get-Date) -lt $end) {
    $now = Get-Date
    $readyOk = $false
    try {
        $r = Invoke-RestMethod -Uri "$ApiBase/ready" -TimeoutSec 10
        $readyOk = ($r.ok -eq $true) -and ($r.backend -eq "postgresql")
        Write-Host "[$($now.ToString('HH:mm:ss'))] /ready ok=$($r.ok) backend=$($r.backend)" -ForegroundColor $(if ($readyOk) { "Green" } else { "Yellow" })
    }
    catch {
        Write-Host "[$($now.ToString('HH:mm:ss'))] /ready ERROR $($_.Exception.Message)" -ForegroundColor Red
    }
    $readyChecks.Add($readyOk) | Out-Null

    $metricsNote = ""
    try {
        $m = Invoke-RestMethod -Uri "$ApiBase/metrics/json" -TimeoutSec 10
        $window = [int]$m.window_size
        $fivexx = [int]$m.http_5xx_total
        if ($window -ge $MinRequestsFor5xx) {
            $rate = $fivexx / [double]$window
            $metricsNote = "5xx=$fivexx window=$window rate=$([math]::Round($rate*100,2))%"
            if ($rate -gt $Max5xxRate) {
                "BREACH 5xx_rate=$rate at $now" | Add-Content -Path $log
                Write-Host "KPI BREACH: 5xx rate $([math]::Round($rate*100,1))% > $([int]($Max5xxRate*100))%" -ForegroundColor Red
                throw "5xx rate breach"
            }
        }
        else {
            $metricsNote = "5xx=$fivexx window=$window (below min $MinRequestsFor5xx)"
        }
    }
    catch {
        if ($_.Exception.Message -eq "5xx rate breach") { throw }
        $metricsNote = "metrics skip: $($_.Exception.Message)"
    }

    $smokeOk = $false
    try {
        $smokeArgs = @("scripts/smoke_platform_api.py", "--api-base", $ApiBase)
        if ($env:RAQAT_CONTENT_READ_SECRET) {
            $smokeArgs += @("--content-secret", $env:RAQAT_CONTENT_READ_SECRET)
        }
        python @smokeArgs 2>&1 | Out-Null
        $smokeOk = ($LASTEXITCODE -eq 0)
    }
    catch { $smokeOk = $false }

    if ($smokeOk) {
        $smokeFailStreak = 0
        Write-Host "  smoke OK | $metricsNote" -ForegroundColor Green
    }
    else {
        $smokeFailStreak++
        Write-Host "  smoke FAIL streak=$smokeFailStreak | $metricsNote" -ForegroundColor Yellow
        if ($smokeFailStreak -ge $MaxConsecutiveSmokeFails) {
            "BREACH smoke_fail_streak=$smokeFailStreak at $now" | Add-Content -Path $log
            throw "Smoke fail streak >= $MaxConsecutiveSmokeFails"
        }
    }

    "$now ready=$readyOk smoke=$smokeOk streak=$smokeFailStreak $metricsNote" | Add-Content -Path $log

    $remaining = ($end - (Get-Date)).TotalSeconds
    if ($remaining -le 0) { break }
    Start-Sleep -Seconds ([math]::Min($intervalSec, [int]$remaining))
}

$readyRate = if ($readyChecks.Count -gt 0) { ($readyChecks | Where-Object { $_ }).Count / $readyChecks.Count } else { 0 }
Write-Host "Done. /ready success rate: $([math]::Round($readyRate*100,1))% ($($readyChecks.Count) probes)" -ForegroundColor Cyan
"ready_rate=$readyRate probes=$($readyChecks.Count)" | Add-Content -Path $log

if ($readyRate -lt $ReadyMinRate) {
    Write-Host "KPI BREACH: ready rate below $([int]($ReadyMinRate*100))%" -ForegroundColor Red
    throw "Ready rate breach"
}

Write-Host "OK — KPI window clean. Log: $log" -ForegroundColor Green
