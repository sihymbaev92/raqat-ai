# Mushaf QCF4 fonts + heavy bundled JSON → rahatomir.com CDN (slim APK prerequisite).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/deploy_mushaf_cdn_assets.ps1
param(
  [switch]$DryRun
)

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

$Host_ = if ($env:RAQAT_VPS_HOST) { $env:RAQAT_VPS_HOST } else { "5.75.162.140" }
$User = if ($env:RAQAT_VPS_USER) { $env:RAQAT_VPS_USER } else { "root" }
$WebRoot = if ($env:RAQAT_VPS_WEB_ROOT) { $env:RAQAT_VPS_WEB_ROOT } else { "/var/www/raqat-web/dist" }
$Key = if ($env:RAQAT_VPS_SSH_KEY) { $env:RAQAT_VPS_SSH_KEY } else { "$env:USERPROFILE\.ssh\id_ed25519" }
$Target = "${User}@${Host_}"
$SshOpts = @("-o", "BatchMode=yes", "-o", "ConnectTimeout=20", "-o", "StrictHostKeyChecking=accept-new")
if (Test-Path $Key) { $SshOpts += @("-i", $Key) }

$Mobile = Join-Path $RepoRoot "mobile"
$Pairs = @(
  @{ Local = Join-Path $Mobile "assets\quran\qcf4\fonts"; Remote = "$WebRoot/assets/quran/qcf4/fonts" }
  @{ Local = Join-Path $Mobile "assets\quran\qcf4\pages"; Remote = "$WebRoot/assets/quran/qcf4/pages" }
  @{ Local = Join-Path $Mobile "assets\bundled\offline-auto-translations-core.json"; Remote = "$WebRoot/assets/bundled/offline-auto-translations-core.json" }
  @{ Local = Join-Path $Mobile "assets\bundled\quran-translations-offline.json"; Remote = "$WebRoot/assets/bundled/quran-translations-offline.json" }
)

foreach ($p in $Pairs) {
  if (-not (Test-Path $p.Local)) {
    Write-Host "SKIP missing: $($p.Local)"
    continue
  }
  if ($DryRun) {
    Write-Host "DRY $($p.Local) -> $($p.Remote)"
    continue
  }
  if (Test-Path $p.Local -PathType Container) {
    Write-Host "== rsync dir: $($p.Local) -> $($p.Remote)"
    ssh @SshOpts $Target "mkdir -p '$($p.Remote)'"
    $rsync = Get-Command rsync -ErrorAction SilentlyContinue
    if ($rsync) {
      $sshCmd = "ssh " + ($SshOpts -join " ")
      & rsync -az --partial -e $sshCmd "$($p.Local)/" "${Target}:$($p.Remote)/"
    } else {
      $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
      $arc = Join-Path $env:TEMP "raqat-cdn-$stamp.tgz"
      tar -czf $arc -C $p.Local .
      scp @SshOpts $arc "${Target}:/tmp/raqat-cdn-$stamp.tgz"
      ssh @SshOpts $Target "mkdir -p '$($p.Remote)' && tar -xzf /tmp/raqat-cdn-$stamp.tgz -C '$($p.Remote)' && rm -f /tmp/raqat-cdn-$stamp.tgz"
      Remove-Item -Force $arc -ErrorAction SilentlyContinue
    }
  } else {
    Write-Host "== scp file: $($p.Local)"
    ssh @SshOpts $Target "mkdir -p '$(Split-Path $p.Remote -Parent)'"
    scp @SshOpts $p.Local "${Target}:$($p.Remote)"
  }
}

if (-not $DryRun) {
  ssh @SshOpts $Target "chown -R www-data:www-data /var/www/raqat-web 2>/dev/null || true"
  Write-Host "== smoke HEAD =="
  $checks = @(
    "https://rahatomir.com/assets/quran/qcf4/fonts/QCF4_Hafs_001_W.ttf",
    "https://rahatomir.com/assets/bundled/offline-auto-translations-core.json"
  )
  foreach ($u in $checks) {
    try {
      $r = Invoke-WebRequest -Uri $u -Method Head -UseBasicParsing -TimeoutSec 20
      Write-Host "OK $($r.StatusCode) $u"
    } catch {
      Write-Warning "FAIL $u"
    }
  }
}

Write-Host "Done."
