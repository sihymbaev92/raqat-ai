# Sprint 1 #103 — VPS production cutover verify / post-cutover gate
# Prod PG cutover already done болса — smoke + KPI monitor; sqlite болса — runbook steps.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_vps_prod_cutover.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_vps_prod_cutover.ps1 -ExecuteCutover  # SSH migrate (maintenance!)

param(
    [string]$ApiBase = "",
    [switch]$ExecuteCutover,
    [switch]$SkipMonitor,
    [switch]$SkipSsh
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$deployEnv = Join-Path $Root ".env.deploy"
if (Test-Path $deployEnv) {
    Get-Content $deployEnv | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $name = $Matches[1]
            $val = $Matches[2].Trim().Trim('"').Trim("'")
            if ($val) { Set-Item -Path "Env:$name" -Value $val }
        }
    }
}

if (-not $ApiBase) {
    $ApiBase = if ($env:RAQAT_VPS_PUBLIC_URL) { $env:RAQAT_VPS_PUBLIC_URL } else { "https://api.rahatomir.com" }
}
$ApiBase = $ApiBase.TrimEnd("/")

New-Item -ItemType Directory -Force -Path (Join-Path $Root ".logs") | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = Join-Path $Root ".logs\vps_prod_cutover_$stamp.log"
"start=$stamp api=$ApiBase" | Out-File -FilePath $log -Encoding utf8

Write-Host "=== Sprint 1 #103 VPS prod cutover gate ===" -ForegroundColor Cyan
Write-Host "API: $ApiBase" -ForegroundColor Cyan

# [1] /ready backend
$ready = Invoke-RestMethod -Uri "$ApiBase/ready" -TimeoutSec 20
$backend = [string]$ready.backend
"ready backend=$backend redis=$($ready.redis.status)" | Add-Content -Path $log
Write-Host "[1/5] /ready backend=$backend redis=$($ready.redis.status)" -ForegroundColor $(if ($ready.ok) { "Green" } else { "Red" })
if (-not $ready.ok) { throw "/ready not ok" }

if ($backend -eq "sqlite") {
    Write-Host "WARNING: prod still on SQLite — cutover required (§3 runbook)" -ForegroundColor Yellow
    "status=needs_cutover" | Add-Content -Path $log
    if (-not $ExecuteCutover) {
        Write-Host @"

Next (maintenance window, two-person rule):
  1. SSH VPS: stop raqat-bot, raqat-celery
  2. bash scripts/backup_sqlite.sh
  3. bash scripts/run_pg_cutover.sh --apply
  4. Update .env.production DATABASE_URL + RAQAT_PG_USE_POOL=1
  5. systemctl restart raqat-platform-api raqat-celery raqat-bot
  6. Re-run: scripts/sprint1_vps_prod_cutover.ps1

Or re-run with -ExecuteCutover (SSH required).
"@ -ForegroundColor Yellow
        exit 2
    }
}
elseif ($backend -eq "postgresql") {
    Write-Host "[1/5] PostgreSQL already active — post-cutover verification" -ForegroundColor Green
    "status=postgresql_active" | Add-Content -Path $log
}
else {
    Write-Host "Unknown backend: $backend" -ForegroundColor Yellow
}

# [2] Optional SSH env sanity (no secrets printed)
if (-not $SkipSsh) {
    $hostAddr = $env:RAQAT_VPS_HOST
    $user = if ($env:RAQAT_VPS_USER) { $env:RAQAT_VPS_USER } else { "root" }
    $remoteRoot = if ($env:RAQAT_VPS_ROOT) { $env:RAQAT_VPS_ROOT } else { "/opt/raqat-ai" }
    $key = if ($env:RAQAT_VPS_SSH_KEY) { $env:RAQAT_VPS_SSH_KEY } else { "$env:USERPROFILE\.ssh\id_ed25519" }
    if ($hostAddr -and (Test-Path $key)) {
        Write-Host "[2/5] SSH env check $user@$hostAddr" -ForegroundColor Cyan
        $sshCmd = @"
set -e
cd '$remoteRoot'
echo '--- DATABASE_URL set? ---'
grep -E '^DATABASE_URL=' .env.production 2>/dev/null | sed 's/=.*/=***REDACTED***/' || echo 'DATABASE_URL not in .env.production'
echo '--- pool ---'
grep -E '^RAQAT_PG_USE_POOL=' .env.production 2>/dev/null || true
echo '--- services ---'
systemctl is-active raqat-platform-api 2>/dev/null || echo 'api:unknown'
systemctl is-active raqat-celery 2>/dev/null || echo 'celery:unknown'
systemctl is-active raqat-bot 2>/dev/null || echo 'bot:unknown'
"@
        try {
            $sshOut = ssh -o BatchMode=yes -o ConnectTimeout=15 -i $key "${user}@${hostAddr}" $sshCmd 2>&1
            $sshOut | ForEach-Object { $_ | Add-Content -Path $log; Write-Host $_ }
        }
        catch {
            Write-Host "SSH skip: $($_.Exception.Message)" -ForegroundColor Yellow
            "ssh_skip=$($_.Exception.Message)" | Add-Content -Path $log
        }
    }
    else {
        Write-Host "[2/5] SSH skip (no host or key)" -ForegroundColor Yellow
    }
}

# [3] Prod smoke (auth + hatim + quran-last-read)
Write-Host "[3/5] Prod API smoke (auth + hatim + quran-last-read)" -ForegroundColor Cyan
if (-not $env:RAQAT_SMOKE_AUTH_PASSWORD) {
    Write-Host "FAIL smoke auth — RAQAT_SMOKE_AUTH_PASSWORD not in .env.deploy" -ForegroundColor Red
    Write-Host "  Run: powershell -File scripts/provision_prod_smoke_auth.ps1" -ForegroundColor Yellow
    "smoke_auth=skip" | Add-Content -Path $log
    throw "prod smoke auth credentials missing"
}
else {
    python scripts/smoke_platform_api.py --api-base $ApiBase --auth-login --hatim --quran-last-read 2>&1 | Tee-Object -FilePath $log -Append
    if ($LASTEXITCODE -ne 0) { throw "prod smoke failed exit $LASTEXITCODE" }
    "smoke_auth=pass" | Add-Content -Path $log
}

# [4] Execute cutover on VPS (dangerous — only with -ExecuteCutover)
if ($ExecuteCutover -and $backend -eq "sqlite") {
    Write-Host "[4/5] EXECUTE cutover on VPS (maintenance window!)" -ForegroundColor Red
    $hostAddr = $env:RAQAT_VPS_HOST
    $user = if ($env:RAQAT_VPS_USER) { $env:RAQAT_VPS_USER } else { "root" }
    $remoteRoot = if ($env:RAQAT_VPS_ROOT) { $env:RAQAT_VPS_ROOT } else { "/opt/raqat-ai" }
    $key = if ($env:RAQAT_VPS_SSH_KEY) { $env:RAQAT_VPS_SSH_KEY } else { "$env:USERPROFILE\.ssh\id_ed25519" }
    if (-not ($hostAddr -and (Test-Path $key))) { throw "SSH required for -ExecuteCutover" }
    $cutoverCmd = @"
set -e
cd '$remoteRoot'
systemctl stop raqat-bot raqat-celery || true
bash scripts/backup_sqlite.sh
bash scripts/run_pg_cutover.sh --apply
systemctl restart raqat-platform-api raqat-celery
sleep 3
curl -sf http://127.0.0.1:8787/ready | head -c 200
systemctl start raqat-bot || true
"@
    ssh -o BatchMode=yes -i $key "${user}@${hostAddr}" $cutoverCmd 2>&1 | Tee-Object -FilePath $log -Append
}
else {
    Write-Host "[4/5] Cutover execute skipped (postgresql active or no -ExecuteCutover)" -ForegroundColor DarkGray
}

# [5] Post-cutover KPI monitor (short QA window against prod)
if (-not $SkipMonitor) {
    Write-Host "[5/5] KPI monitor (2 min QA window on prod)" -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File "$Root\scripts\sprint1_cutover_monitor.ps1" `
        -ApiBase $ApiBase -DurationMinutes 2 -IntervalMinutes 1 2>&1 | Tee-Object -FilePath $log -Append
}

Write-Host ""
Write-Host "OK — VPS prod cutover gate complete. Log: $log" -ForegroundColor Green
Write-Host "SIM-03 device QA: scripts/sprint1_sim03_last_read_device_qa.ps1" -ForegroundColor Cyan
