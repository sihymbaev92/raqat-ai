# Slim APK CDN asset deploy — QCF4, bundled JSON, tajweed, hatim JSON.
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
  @{ Local = Join-Path $Mobile "assets\tajweed\letters"; Remote = "$WebRoot/assets/tajweed/letters" }
  @{ Local = Join-Path $Mobile "assets\tajweed\muftyat"; Remote = "$WebRoot/assets/tajweed/muftyat" }
  @{ Local = Join-Path $Mobile "assets\hajj\muftyat"; Remote = "$WebRoot/assets/hajj/muftyat" }
  @{ Local = Join-Path $Mobile "assets\bundled\offline-auto-translations-core.json"; Remote = "$WebRoot/assets/bundled/offline-auto-translations-core.json" }
  @{ Local = Join-Path $Mobile "assets\bundled\quran-translations-offline.json"; Remote = "$WebRoot/assets/bundled/quran-translations-offline.json" }
  @{ Local = Join-Path $Mobile "assets\bundled\quran-uthmani-full.json"; Remote = "$WebRoot/assets/bundled/quran-uthmani-full.json" }
  @{ Local = Join-Path $Mobile "assets\bundled\quran-kk-from-db.json"; Remote = "$WebRoot/assets/bundled/quran-kk-from-db.json" }
  @{ Local = Join-Path $Mobile "assets\bundled\quran-en-transliteration-full.json"; Remote = "$WebRoot/assets/bundled/quran-en-transliteration-full.json" }
  @{ Local = Join-Path $Mobile "assets\bundled\quran-tajweed-offline.json"; Remote = "$WebRoot/assets/bundled/quran-tajweed-offline.json" }
  @{ Local = Join-Path $Mobile "assets\bundled\hadith-from-db-seed.json"; Remote = "$WebRoot/assets/bundled/hadith-from-db-seed.json" }
  @{ Local = Join-Path $Mobile "assets\bundled\great-words-catalog.json"; Remote = "$WebRoot/assets/bundled/great-words-catalog.json" }
  @{ Local = Join-Path $Mobile "assets\bundled\halal-companies-snapshot.json"; Remote = "$WebRoot/assets/bundled/halal-companies-snapshot.json" }
  @{ Local = Join-Path $Mobile "assets\quran_tajweed.json"; Remote = "$WebRoot/assets/quran_tajweed.json" }
)

function Sync-Pair($p) {
  if (-not (Test-Path $p.Local)) {
    Write-Host "SKIP missing: $($p.Local)"
    return
  }
  if ($DryRun) {
    Write-Host "DRY $($p.Local) -> $($p.Remote)"
    return
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
  Write-Host "== SSH probe =="
  ssh @SshOpts $Target "echo deploy-ok" 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) {
    Write-Error "SSH failed ($Target). .env.deploy ішінде RAQAT_VPS_SSH_KEY тексеріңіз; host key өзгерсе: ssh-keygen -R $Host_"
    exit 1
  }
}

foreach ($p in $Pairs) { Sync-Pair $p }

if (-not $DryRun) {
  ssh @SshOpts $Target "chown -R www-data:www-data /var/www/raqat-web 2>/dev/null || true"
  Write-Host "== smoke HEAD =="
  $checks = @(
    "https://rahatomir.com/assets/quran/qcf4/pages/001.json",
    "https://rahatomir.com/assets/bundled/quran-uthmani-full.json",
    "https://rahatomir.com/assets/quran_tajweed.json",
    "https://rahatomir.com/assets/tajweed/letters/alif.mp3",
    "https://rahatomir.com/assets/tajweed/muftyat/page-001.jpg"
  )
  $ok = 0
  foreach ($u in $checks) {
    try {
      $r = Invoke-WebRequest -Uri $u -Method Head -UseBasicParsing -TimeoutSec 20
      Write-Host "OK $($r.StatusCode) $u"
      $ok++
    } catch {
      Write-Warning "FAIL $u :: $($_.Exception.Message)"
    }
  }
  if ($ok -lt $checks.Count) { exit 1 }
}

Write-Host "Done."
