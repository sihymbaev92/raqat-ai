# VPS SSH public key bootstrap (бір рет)
# Usage:
#   1) .env.deploy ішіне: RAQAT_VPS_SSH_PASSWORD=your_root_password
#   2) powershell -ExecutionPolicy Bypass -File scripts/vps_install_ssh_key.ps1
#   3) powershell -ExecutionPolicy Bypass -File scripts/deploy_mushaf_cdn_assets.ps1
param()

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

if (Test-Path ".env.deploy") {
  Get-Content ".env.deploy" | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2].Trim('"'), "Process")
    }
  }
}

if (-not $env:RAQAT_VPS_SSH_PASSWORD) {
  $pub = Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" -ErrorAction SilentlyContinue
  Write-Host "RAQAT_VPS_SSH_PASSWORD .env.deploy ішінде жоқ." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Hetzner Console (KVM) -> root login -> осы бір жолды орындаңыз:"
  Write-Host "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pub' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
  exit 1
}

python (Join-Path $RepoRoot "scripts\vps_install_ssh_key.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "SSH key OK. Deploy: powershell -File scripts/deploy_mushaf_cdn_assets.ps1" -ForegroundColor Green
