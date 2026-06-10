# Expo web dist -> rahatomir.com (Windows OpenSSH)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/vps_deploy_web.ps1
#        powershell -ExecutionPolicy Bypass -File scripts/vps_deploy_web.ps1 -SkipBuild
param([switch]$SkipBuild)

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
$WebRoot = if ($env:RAQAT_VPS_WEB_ROOT) { $env:RAQAT_VPS_WEB_ROOT } else { "/var/www/raqat-web/dist" }
$WebUrl = if ($env:RAQAT_WEB_PUBLIC_URL) { $env:RAQAT_WEB_PUBLIC_URL } else { "https://rahatomir.com" }
$Key = if ($env:RAQAT_VPS_SSH_KEY) { $env:RAQAT_VPS_SSH_KEY } else { "$env:USERPROFILE\.ssh\id_ed25519" }
$SshTarget = "${User}@${Host_}"
$Dist = Join-Path $RepoRoot "mobile\dist"

if (-not $SkipBuild) {
  Write-Host "== web export =="
  Set-Location (Join-Path $RepoRoot "mobile")
  $env:RAQAT_EXPO_RELEASE_BUILD = "1"
  if (Test-Path ".env.production") {
    Get-Content ".env.production" | ForEach-Object {
      if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim('"'), "Process")
      }
    }
  }
  npx expo export --platform web --output-dir dist
  if ($LASTEXITCODE -ne 0) { throw "expo export failed" }
  node scripts/patch-web-boot-html.js
  node scripts/copy-web-bundled-json.js
  node scripts/copy-web-quran-assets.js
  Set-Location $RepoRoot
}

if (-not (Test-Path (Join-Path $Dist "index.html"))) {
  throw "mobile/dist/index.html missing - run export first"
}

$JsDir = Join-Path $Dist "_expo\static\js\web"
if (Test-Path $JsDir) {
  $ManifestPath = Join-Path $Dist ".raqat-web-js-manifest.txt"
  Get-ChildItem -Path $JsDir -Filter "*.js" -File |
    ForEach-Object { $_.Name } |
    Sort-Object |
    Set-Content -Path $ManifestPath -Encoding ASCII
}

Write-Host "== sync dist -> ${SshTarget}:${WebRoot} =="
# Тұрақты байланыс: keepalive + үзілгенде қайта жалғау (broken pipe / connection reset қорғанысы).
$SshOpts = @(
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", "ServerAliveInterval=15",
  "-o", "ServerAliveCountMax=12",
  "-o", "TCPKeepAlive=yes",
  "-o", "ConnectTimeout=20"
)

function Invoke-WithRetry {
  param([scriptblock]$Action, [string]$Label, [int]$Max = 5)
  for ($i = 1; $i -le $Max; $i++) {
    & $Action
    if ($LASTEXITCODE -eq 0) { return }
    Write-Host "  $Label сәтсіз (код $LASTEXITCODE), әрекет $i/$Max — қайталаймын..."
    Start-Sleep -Seconds ([Math]::Min(5 * $i, 20))
  }
  throw "$Label failed after $Max attempts"
}

Invoke-WithRetry -Label "ssh mkdir" -Action {
  ssh -i $Key @SshOpts $SshTarget "mkdir -p '$WebRoot'; chown -R www-data:www-data /var/www/raqat-web 2>/dev/null; true"
}

$Stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$Archive = Join-Path $env:TEMP "raqat-web-dist-$Stamp.tar.gz"
$RemoteArchive = "/tmp/raqat-web-dist-$Stamp.tar.gz"
if (Test-Path $Archive) { Remove-Item -Force $Archive }
tar -czf $Archive -C $Dist .
if ($LASTEXITCODE -ne 0) { throw "tar create failed ($LASTEXITCODE)" }

# rsync (бар болса) — резюмделетін; әйтпесе scp + retry. Екеуі де үзілсе қайта жалғайды.
$rsync = Get-Command rsync -ErrorAction SilentlyContinue
if ($rsync) {
  $sshCmd = "ssh -i `"$Key`" " + ($SshOpts -join " ")
  Invoke-WithRetry -Label "rsync archive" -Action {
    rsync -z --partial --append-verify --timeout=60 -e $sshCmd $Archive "${SshTarget}:${RemoteArchive}"
  }
} else {
  Invoke-WithRetry -Label "scp archive" -Action {
    scp -i $Key @SshOpts $Archive "${SshTarget}:${RemoteArchive}"
  }
}

Invoke-WithRetry -Label "remote extract" -Action {
  ssh -i $Key @SshOpts $SshTarget "set -e; mkdir -p '$WebRoot'; tar -xzf '$RemoteArchive' -C '$WebRoot'; rm -f '$RemoteArchive'; chown -R www-data:www-data /var/www/raqat-web 2>/dev/null || true"
}
Remove-Item -Force $Archive -ErrorAction SilentlyContinue

$postScriptPath = Join-Path $RepoRoot "scripts\web-dist-postdeploy.sh"
if (Test-Path $postScriptPath) {
  Write-Host "== post-deploy: prune + gzip =="
  Invoke-WithRetry -Label "scp postdeploy" -Action {
    scp -i $Key @SshOpts $postScriptPath "${SshTarget}:/tmp/web-dist-postdeploy.sh"
  }
  ssh -i $Key @SshOpts $SshTarget "sed -i 's/\r$//' /tmp/web-dist-postdeploy.sh && bash /tmp/web-dist-postdeploy.sh '$WebRoot'"
}

Write-Host "== nginx reload =="
ssh -i $Key @SshOpts $SshTarget "nginx -t; systemctl reload nginx"

$healthScriptPath = Join-Path $RepoRoot "scripts\web-release-health.ps1"
if (Test-Path $healthScriptPath) {
  powershell -NoProfile -ExecutionPolicy Bypass -File $healthScriptPath -WebUrl $WebUrl
}

Write-Host ""
Write-Host "Done: $WebUrl"
Write-Host "API: https://api.rahatomir.com/health"
