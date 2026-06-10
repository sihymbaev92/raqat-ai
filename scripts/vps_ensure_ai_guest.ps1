# VPS: қонақ AI (RAQAT_AI_ALLOW_ANONYMOUS=1) + platform_api қайта іске қосу
# Usage: powershell -ExecutionPolicy Bypass -File scripts/vps_ensure_ai_guest.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
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
$key = if ($env:RAQAT_VPS_SSH_KEY) { $env:RAQAT_VPS_SSH_KEY } else { "$env:USERPROFILE\.ssh\id_ed25519" }
$target = "${user}@${hostAddr}"
$apiUrl = if ($env:RAQAT_VPS_PUBLIC_URL) { $env:RAQAT_VPS_PUBLIC_URL } else { "https://api.rahatomir.com" }

if (-not (Test-Path $key)) {
  Write-Host "SSH key жоқ: $key" -ForegroundColor Red
  exit 1
}

$sshBase = @("-o", "BatchMode=yes", "-o", "ConnectTimeout=25", "-i", $key)
$scpBase = @("-o", "BatchMode=yes", "-o", "ConnectTimeout=25", "-i", $key)
$patchLocal = Join-Path $Root "scripts\vps_patch_env_production.sh"

Write-Host "== Upload patch script ==" -ForegroundColor Cyan
scp @scpBase $patchLocal "${target}:${remoteRoot}/scripts/vps_patch_env_production.sh"

$remoteCmd = "set -e; cd $remoteRoot; bash scripts/vps_patch_env_production.sh; grep -E '^RAQAT_AI_ALLOW_ANONYMOUS=' .env || true; systemctl restart raqat-platform-api 2>/dev/null || systemctl restart platform-api 2>/dev/null || true; sleep 2; curl -sf -m 15 ${apiUrl}/health | head -c 200 || echo health_fail"

Write-Host "== Patch .env + restart API ==" -ForegroundColor Cyan
ssh @sshBase $target $remoteCmd

Write-Host "== Guest AI smoke (401/403 болмауы керек) ==" -ForegroundColor Cyan
$body = '{"prompt":"Сәлеметсіз бе","detail_level":"quick"}'
try {
  $resp = Invoke-WebRequest -Uri "$apiUrl/api/v1/ai/chat" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 90 -UseBasicParsing
  Write-Host "HTTP $($resp.StatusCode)" -ForegroundColor Green
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  Write-Host "HTTP $status — $($_.Exception.Message)" -ForegroundColor Yellow
  if ($status -eq 401 -or $status -eq 403) {
    Write-Host "Қонақ AI әлі өшік — .env RAQAT_AI_ALLOW_ANONYMOUS=1 тексеріңіз" -ForegroundColor Red
    exit 1
  }
}

Write-Host "Done." -ForegroundColor Green
