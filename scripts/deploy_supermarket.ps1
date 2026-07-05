# Timur supermarket-site -> VPS /supermarket/
# Usage: powershell -ExecutionPolicy Bypass -File scripts/deploy_supermarket.ps1
#        powershell -ExecutionPolicy Bypass -File scripts/deploy_supermarket.ps1 -ValidateOnly
param(
  [switch]$ValidateOnly,
  [switch]$SkipValidate
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

if (Test-Path ".env.deploy") {
  Get-Content ".env.deploy" | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim('"'), "Process")
    }
  }
}

$Host_ = if ($env:RAQAT_VPS_HOST) { $env:RAQAT_VPS_HOST } else { "5.75.162.140" }
$User = if ($env:RAQAT_VPS_USER) { $env:RAQAT_VPS_USER } else { "root" }
$WebRoot = if ($env:RAQAT_VPS_SUPERMARKET_ROOT) { $env:RAQAT_VPS_SUPERMARKET_ROOT } else { "/var/www/raqat-web/dist/supermarket" }
$PublicUrl = if ($env:RAQAT_SUPERMARKET_PUBLIC_URL) { $env:RAQAT_SUPERMARKET_PUBLIC_URL } else { "https://rahatomir.com/supermarket/" }
$Key = if ($env:RAQAT_VPS_SSH_KEY) { $env:RAQAT_VPS_SSH_KEY } else { "$env:USERPROFILE\.ssh\id_ed25519" }
$SshTarget = "${User}@${Host_}"
$SiteDir = Join-Path $RepoRoot "supermarket-site"

Write-Host "== supermarket validate =="
if (-not $SkipValidate) {
  python scripts/validate_timur_supermarket_products.py
  if ($LASTEXITCODE -ne 0) { throw "catalog validation failed" }
  node --check (Join-Path $SiteDir "app.js")
  if ($LASTEXITCODE -ne 0) { throw "app.js syntax check failed" }
}

if ($ValidateOnly) {
  Write-Host "ValidateOnly: skip deploy"
  exit 0
}

Write-Host "== supermarket deploy -> $SshTarget:$WebRoot =="
$Stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$Archive = Join-Path $env:TEMP "supermarket-$Stamp.tar.gz"
$RemoteArchive = "/tmp/supermarket-$Stamp.tar.gz"
tar -czf $Archive -C $SiteDir .
$SshOpts = @("-o", "StrictHostKeyChecking=accept-new", "-o", "ServerAliveInterval=15")
scp -i $Key @SshOpts $Archive "${SshTarget}:${RemoteArchive}"
ssh -i $Key @SshOpts $SshTarget "set -e; mkdir -p '$WebRoot'; tar -xzf '$RemoteArchive' -C '$WebRoot'; rm -f '$RemoteArchive'"
Remove-Item -Force $Archive

Write-Host "== health =="
curl.exe -sfI $PublicUrl | Select-String "HTTP"
$cfg = Get-Content (Join-Path $SiteDir "config.js") -Raw
if ($cfg -match 'assetVersion:\s*"([^"]+)"') {
  $ver = $Matches[1]
  curl.exe -sfI "${PublicUrl}app.js?v=$ver" | Select-String "HTTP"
}
Write-Host "Done: $PublicUrl"
