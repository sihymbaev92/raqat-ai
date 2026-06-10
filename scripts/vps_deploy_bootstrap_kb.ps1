# VPS: rsync KB scripts + bootstrap_islamic_kb_production + API restart
# Usage: powershell -ExecutionPolicy Bypass -File scripts/vps_deploy_bootstrap_kb.ps1
param(
    [switch]$SkipFull,
    [switch]$DeployApiOnly
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
            Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2].Trim().Trim('"').Trim("'")
        }
    }
}

$hostAddr = if ($env:RAQAT_VPS_HOST) { $env:RAQAT_VPS_HOST } else { "5.75.162.140" }
$user = if ($env:RAQAT_VPS_USER) { $env:RAQAT_VPS_USER } else { "root" }
$remoteRoot = if ($env:RAQAT_VPS_ROOT) { $env:RAQAT_VPS_ROOT } else { "/opt/raqat-ai" }
$publicUrl = if ($env:RAQAT_VPS_PUBLIC_URL) { $env:RAQAT_VPS_PUBLIC_URL } else { "https://api.rahatomir.com" }
$key = if ($env:RAQAT_VPS_SSH_KEY) { $env:RAQAT_VPS_SSH_KEY } else { "$env:USERPROFILE\.ssh\id_ed25519" }
$target = "${user}@${hostAddr}"

if (-not (Test-Path $key)) {
    Write-Host "SSH key жоқ: $key — .env.deploy.example қараңыз" -ForegroundColor Red
    exit 1
}

$sshBase = @("-o", "BatchMode=yes", "-o", "ConnectTimeout=20", "-i", $key)
$scpBase = @("-o", "BatchMode=yes", "-o", "ConnectTimeout=20", "-i", $key)

Write-Host "== Deploy scripts -> ${target}:${remoteRoot} ==" -ForegroundColor Cyan

$scriptFiles = @(
    "bootstrap_islamic_kb_production.sh",
    "run_islamic_kb_sync.sh",
    "install_islamic_kb_cron_twice_daily.sh",
    "install_islamic_kb_cron_weekly_full.sh",
    "install_raqat_vps_ops_cron.sh",
    "vps_deploy_remote.sh",
    "vps_patch_env_production.sh",
    "sync_islamic_kb.py"
)
ssh @sshBase $target "mkdir -p '$remoteRoot/scripts' '$remoteRoot/data' '$remoteRoot/platform_api/islamic_kb'"
foreach ($f in $scriptFiles) {
    $local = Join-Path $Root "scripts\$f"
    if (Test-Path $local) {
        scp @scpBase $local "${target}:${remoteRoot}/scripts/$f"
    }
}
$kbPy = Join-Path $Root "platform_api\islamic_kb"
if (Test-Path $kbPy) {
    scp @scpBase -r "$kbPy\*" "${target}:${remoteRoot}/platform_api/islamic_kb/"
}

if (-not $DeployApiOnly) {
    Write-Host "== Remote bootstrap + restart ==" -ForegroundColor Cyan
    scp @scpBase (Join-Path $Root "scripts\vps_remote_bootstrap_kb.sh") "${target}:${remoteRoot}/scripts/vps_remote_bootstrap_kb.sh"
    ssh @sshBase $target "sed -i 's/\r$//' '${remoteRoot}/scripts/vps_remote_bootstrap_kb.sh' && chmod +x '${remoteRoot}/scripts/vps_remote_bootstrap_kb.sh' && RAQAT_ROOT='${remoteRoot}' bash '${remoteRoot}/scripts/vps_remote_bootstrap_kb.sh'"
}

Write-Host "== Public smoke: $publicUrl ==" -ForegroundColor Cyan
try {
    $kb = Invoke-RestMethod -Uri "$publicUrl/api/v1/ai/kb/status" -TimeoutSec 25
    $kb | ConvertTo-Json -Compress
    Write-Host "KB enabled=$($kb.enabled)" -ForegroundColor Green
} catch {
    Write-Host "WARN: public kb/status — $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "Дайын." -ForegroundColor Green
