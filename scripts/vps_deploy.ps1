# Local -> VPS deploy (Windows PowerShell).
#   copy .env.deploy.example .env.deploy
#   powershell -ExecutionPolicy Bypass -File .\scripts\vps_deploy.ps1
param(
  [switch]$DryRun,
  [switch]$SyncKb,
  [switch]$GitPull
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $RepoRoot

$envFile = Join-Path $RepoRoot ".env.deploy"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $name = $Matches[1]
      $val = $Matches[2].Trim().Trim('"').Trim("'")
      Set-Item -Path "Env:$name" -Value $val
    }
  }
}

if ($env:RAQAT_VPS_USE_GIT_BASH -eq "1") {
  $gitBash = "${env:ProgramFiles}\Git\bin\bash.exe"
  if (-not (Test-Path $gitBash)) {
    $gitBash = "${env:ProgramFiles(x86)}\Git\bin\bash.exe"
  }
  if (Test-Path $gitBash) {
    $env:HOME = $env:USERPROFILE
    $bashArgs = @("scripts/vps_deploy.sh")
    if ($DryRun) { $bashArgs += "--dry-run" }
    if ($SyncKb) { $bashArgs += "--sync-kb" }
    if ($GitPull) { $bashArgs += "--git-pull" }
    & $gitBash @bashArgs
    exit $LASTEXITCODE
  }
}

Write-Host "Windows deploy: tar + scp + ssh" -ForegroundColor Cyan

$HostAddr = if ($env:RAQAT_VPS_HOST) { $env:RAQAT_VPS_HOST } else { "5.75.162.140" }
$User = if ($env:RAQAT_VPS_USER) { $env:RAQAT_VPS_USER } else { "root" }
$RemoteRoot = if ($env:RAQAT_VPS_ROOT) { $env:RAQAT_VPS_ROOT } else { "/opt/raqat-ai" }
$PublicUrl = if ($env:RAQAT_VPS_PUBLIC_URL) { $env:RAQAT_VPS_PUBLIC_URL } else { "https://api.rahatomir.com" }
$Target = "${User}@${HostAddr}"
$Key = if ($env:RAQAT_VPS_SSH_KEY) { $env:RAQAT_VPS_SSH_KEY } else { "$env:USERPROFILE\.ssh\id_ed25519" }
$SshBase = @("-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-o", "StrictHostKeyChecking=accept-new")
if (Test-Path $Key) { $SshBase += @("-i", $Key) }

if ($DryRun) {
  Write-Host "DRY RUN: $Target -> $RemoteRoot"
  exit 0
}

$staging = Join-Path $env:TEMP ("raqat-deploy-" + (Get-Date -Format "yyyyMMddHHmmss"))
$archive = Join-Path $env:TEMP "raqat-deploy.tgz"
New-Item -ItemType Directory -Path $staging -Force | Out-Null
try {
  Copy-Item -Recurse -Force (Join-Path $RepoRoot "db") (Join-Path $staging "db")
  Copy-Item -Recurse -Force (Join-Path $RepoRoot "platform_api") (Join-Path $staging "platform_api")
  Copy-Item -Recurse -Force (Join-Path $RepoRoot "services") (Join-Path $staging "services")
  Copy-Item -Recurse -Force (Join-Path $RepoRoot "scripts") (Join-Path $staging "scripts")
  foreach ($extra in @("alembic.ini", "requirements-postgres.txt")) {
    $src = Join-Path $RepoRoot $extra
    if (Test-Path $src) { Copy-Item -Force $src $staging }
  }
  $gemini = Join-Path $RepoRoot "check-gemini.sh"
  if (Test-Path $gemini) { Copy-Item $gemini $staging }
  Get-ChildItem -Path $staging -Recurse -Directory -Filter "__pycache__" |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  Get-ChildItem -Path $staging -Recurse -Filter ".env" |
    Remove-Item -Force -ErrorAction SilentlyContinue
  Get-ChildItem -Path (Join-Path $staging "scripts") -Filter "*.sh" -ErrorAction SilentlyContinue |
    ForEach-Object {
      $raw = [System.IO.File]::ReadAllText($_.FullName)
      [System.IO.File]::WriteAllText($_.FullName, ($raw -replace "`r`n", "`n" -replace "`r", "`n"))
    }

  if (Test-Path $archive) { Remove-Item $archive -Force }
  tar -czf $archive -C $staging .

  ssh @SshBase $Target ("mkdir -p " + $RemoteRoot)
  scp @SshBase $archive ($Target + ":/tmp/raqat-deploy.tgz")
  $runKbSync = if ($SyncKb.IsPresent) { "1" } else { "0" }
  $remoteCmd = "set -e; cd " + $RemoteRoot + "; tar -xzf /tmp/raqat-deploy.tgz; rm -f /tmp/raqat-deploy.tgz; find scripts -maxdepth 1 -name '*.sh' -exec sed -i 's/\\r$//' {} +; chmod +x scripts/vps_deploy_remote.sh; RAQAT_ROOT=" + $RemoteRoot + " RUN_KB_SYNC=" + $runKbSync + " bash scripts/vps_deploy_remote.sh"
  ssh @SshBase $Target $remoteCmd

  $healthUri = $PublicUrl.TrimEnd("/") + "/health"
  try {
    $health = Invoke-WebRequest -Uri $healthUri -UseBasicParsing -TimeoutSec 15
    Write-Host ("public health HTTP " + $health.StatusCode)
  } catch {
    Write-Warning ("public smoke failed: " + $healthUri)
  }
  Write-Host ("Deploy OK: " + $PublicUrl)
} catch {
  throw
} finally {
  Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
  if (Test-Path $archive) { Remove-Item $archive -Force -ErrorAction SilentlyContinue }
}
