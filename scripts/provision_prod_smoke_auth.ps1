# Prod bootstrap smoke login (bcrypt) + hatim API smoke.
# Writes RAQAT_SMOKE_* to .env.deploy (gitignored). Does NOT print password to console.
#
#   powershell -ExecutionPolicy Bypass -File scripts/provision_prod_smoke_auth.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/provision_prod_smoke_auth.ps1 -SkipVps   # local hash only

param(
  [string]$VpsHost = "",
  [string]$VpsUser = "root",
  [string]$SmokeUser = "raqat-smoke",
  [switch]$SkipVps
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$deployEnv = Join-Path $Root ".env.deploy"
$example = Join-Path $Root ".env.deploy.example"
if (-not (Test-Path $deployEnv) -and (Test-Path $example)) {
  Copy-Item $example $deployEnv
}

if (-not $VpsHost) {
  foreach ($line in Get-Content $deployEnv -ErrorAction SilentlyContinue) {
    if ($line -match '^\s*RAQAT_VPS_HOST=(.+)$') { $VpsHost = $Matches[1].Trim(); break }
  }
}
if (-not $VpsHost) { $VpsHost = "5.75.162.140" }

$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$genLines = @(& python scripts/gen_auth_password_bcrypt.py --generate 2>&1 | ForEach-Object { "$_" })
$genExit = $LASTEXITCODE
$ErrorActionPreference = $prevEap
if ($genExit -ne 0) { throw "gen_auth_password_bcrypt failed (exit $genExit)" }
$password = ""
$bcrypt = ""
foreach ($line in $genLines) {
  if ($line -match '^password=(.+)$') { $password = $Matches[1] }
  if ($line -match '^bcrypt=(.+)$') { $bcrypt = $Matches[1] }
}
if (-not $password -or -not $bcrypt) { throw "failed to parse generated credentials" }

function Set-DeployKey($key, $val) {
  $path = $deployEnv
  $lines = @()
  if (Test-Path $path) { $lines = Get-Content $path }
  $found = $false
  $out = foreach ($l in $lines) {
    if ($l -match "^\s*$([regex]::Escape($key))=") { $found = $true; "${key}=$val" }
    else { $l }
  }
  if (-not $found) { $out += "${key}=$val" }
  $out | Set-Content $path -Encoding utf8
}

Set-DeployKey "RAQAT_SMOKE_AUTH_USERNAME" $SmokeUser
Set-DeployKey "RAQAT_SMOKE_AUTH_PASSWORD" $password
Set-DeployKey "RAQAT_VPS_HOST" $VpsHost

Write-Host "OK  credentials saved to .env.deploy (RAQAT_SMOKE_AUTH_* — password not shown)"

if ($SkipVps) {
  Write-Host "SkipVps: bcrypt hash ready for manual VPS install"
  Write-Host "  bash scripts/vps_install_smoke_auth.sh  (on VPS with env vars)"
  exit 0
}

$remoteScript = "$Root/scripts/vps_install_smoke_auth.sh"
scp -o BatchMode=yes $remoteScript "${VpsUser}@${VpsHost}:/opt/raqat-ai/scripts/vps_install_smoke_auth.sh" | Out-Null

$tmpEnv = Join-Path $env:TEMP "raqat_smoke_auth_$([Guid]::NewGuid().ToString('N')).env"
@(
  "RAQAT_AUTH_USERNAME=$SmokeUser",
  ('RAQAT_AUTH_PASSWORD_BCRYPT=' + "'$bcrypt'"),
  ('RAQAT_SMOKE_AUTH_PASSWORD=' + "'$password'")
) | Set-Content -Path $tmpEnv -Encoding ascii
scp -o BatchMode=yes $tmpEnv "${VpsUser}@${VpsHost}:/tmp/raqat_smoke_auth.env" | Out-Null
Remove-Item $tmpEnv -Force -ErrorAction SilentlyContinue

ssh -o BatchMode=yes "${VpsUser}@${VpsHost}" "sed -i 's/\r$//' /opt/raqat-ai/scripts/vps_install_smoke_auth.sh /tmp/raqat_smoke_auth.env 2>/dev/null; set -a; source /tmp/raqat_smoke_auth.env; set +a; bash /opt/raqat-ai/scripts/vps_install_smoke_auth.sh; rm -f /tmp/raqat_smoke_auth.env"

Write-Host "== Prod hatim smoke =="
Start-Sleep -Seconds 12
$env:RAQAT_SMOKE_AUTH_USERNAME = $SmokeUser
$env:RAQAT_SMOKE_AUTH_PASSWORD = $password
python scripts/smoke_hatim_api.py --api-base "https://api.rahatomir.com"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

python scripts/smoke_platform_api.py --api-base "https://api.rahatomir.com" --auth-login --hatim 2>&1 | Select-Object -Last 8
Write-Host "OK  prod smoke auth provisioned (user=$SmokeUser)"
