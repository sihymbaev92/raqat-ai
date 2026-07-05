#Requires -Version 5.1
<#
.SYNOPSIS
  Переустановка алдында Raqat + dev ортаны сыртқы дискке/флешке сақтау.

.USAGE
  powershell -ExecutionPolicy Bypass -File D:\opt\raqat-ai\scripts\backup-pc-before-reinstall.ps1
  powershell -ExecutionPolicy Bypass -File .\scripts\backup-pc-before-reinstall.ps1 -Destination E:\backup-raqat

.NOTES
  - node_modules / build кэштері көшірілмейді (қайта орнату оңай).
  - .env, keystore, .ssh — МІНДЕТТІ сақталады.
  - Жоба git push жасалмаған болса, толық код snapshot-ы сақталады.
#>
param(
  [string]$Destination = "D:\backup-raqat",
  [string]$ProjectRoot = "D:\opt\raqat-ai",
  [switch]$IncludeNodeModules,
  [switch]$SkipGitBundle
)

$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$root = Join-Path $Destination $stamp
$log = Join-Path $root "BACKUP_MANIFEST.txt"

function Write-Log([string]$msg) {
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
  Write-Host $line
  Add-Content -Path $log -Value $line -Encoding UTF8
}

function Ensure-Dir([string]$path) {
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
  }
}

function Copy-TreeFiltered {
  param(
    [string]$Source,
    [string]$Target,
    [string[]]$ExcludeDirNames = @()
  )
  if (-not (Test-Path $Source)) {
    Write-Log "SKIP (жоқ): $Source"
    return
  }
  Ensure-Dir $Target
  $excludeSet = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  foreach ($n in $ExcludeDirNames) { [void]$excludeSet.Add($n) }

  robocopy $Source $Target /E /R:2 /W:2 /NFL /NDL /NJH /NJS /NP `
    /XD node_modules .gradle build dist .expo .turbo __pycache__ .pytest_cache `
    /XF *.apk *.aab *.ipa `
    | Out-Null
  $rc = $LASTEXITCODE
  if ($rc -ge 8) { throw "robocopy сәтсіз ($rc): $Source -> $Target" }
  Write-Log "OK: $Source -> $Target"
}

function Copy-FileIfExists {
  param([string]$Source, [string]$TargetDir, [string]$Label = "")
  if (-not (Test-Path $Source)) {
    Write-Log "SKIP (жоқ): $Label$Source"
    return $false
  }
  Ensure-Dir $TargetDir
  Copy-Item -Path $Source -Destination $TargetDir -Force
  Write-Log "OK: $Label$Source"
  return $true
}

Ensure-Dir $root
Set-Content -Path $log -Value "Raqat PC backup — $stamp`n" -Encoding UTF8

Write-Log "=== Backup басталды ==="
Write-Log "Мақсат: $root"
Write-Log "Жоба: $ProjectRoot"

# --- 1. Raqat жобасы (код + git + env) ---
$projDest = Join-Path $root "raqat-ai"
$exclude = @("node_modules", ".gradle", "build", "dist", ".expo")
if (-not $IncludeNodeModules) {
  Copy-TreeFiltered -Source $ProjectRoot -Target $projDest -ExcludeDirNames $exclude
} else {
  Copy-TreeFiltered -Source $ProjectRoot -Target $projDest
}

# Env / keystore — robocopy-дан бөлек, нақты тексеру
$secretsDest = Join-Path $root "secrets"
Ensure-Dir $secretsDest

$envFiles = @(
  @{ Path = Join-Path $ProjectRoot ".env"; Name = "root-.env" },
  @{ Path = Join-Path $ProjectRoot ".env.deploy"; Name = "root-.env.deploy" },
  @{ Path = Join-Path $ProjectRoot "mobile\.env"; Name = "mobile-.env" },
  @{ Path = Join-Path $ProjectRoot "mobile\.env.production"; Name = "mobile-.env.production" },
  @{ Path = Join-Path $ProjectRoot "mobile\android\keystore.properties"; Name = "android-keystore.properties" }
)
foreach ($f in $envFiles) {
  if (Test-Path $f.Path) {
    Copy-Item $f.Path (Join-Path $secretsDest $f.Name) -Force
    Write-Log "OK (secret): $($f.Path)"
  } else {
    Write-Log "SKIP (secret жоқ): $($f.Path)"
  }
}

$keystoreDir = Join-Path $ProjectRoot "mobile\android\keystore"
if (Test-Path $keystoreDir) {
  Copy-TreeFiltered -Source $keystoreDir -Target (Join-Path $secretsDest "android-keystore")
}

# --- 2. Git snapshot (push жасалмаған өзгерістер) ---
if (-not $SkipGitBundle) {
  $gitDir = Join-Path $ProjectRoot ".git"
  if (Test-Path $gitDir) {
    Push-Location $ProjectRoot
    try {
      $gitStatus = Join-Path $root "git-status.txt"
      git status -sb | Out-File $gitStatus -Encoding UTF8
      git diff --stat | Out-File (Join-Path $root "git-diff-stat.txt") -Encoding UTF8
      Write-Log "OK: git status/diff сақталды"

      $bundlePath = Join-Path $root "raqat-ai.bundle"
      git bundle create $bundlePath --all 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) {
        Write-Log "OK: git bundle -> $bundlePath"
      } else {
        Write-Log "WARN: git bundle сәтсіз — толық project copy бар"
      }
    } finally {
      Pop-Location
    }
  }
}

# --- 3. Cursor + dev орта ---
$profile = $env:USERPROFILE
$devDest = Join-Path $root "dev-profile"
Ensure-Dir $devDest

Copy-FileIfExists -Source "$profile\.gitconfig" -TargetDir $devDest -Label "gitconfig: "
Copy-FileIfExists -Source "$profile\.npmrc" -TargetDir $devDest -Label "npmrc: "
Copy-FileIfExists -Source "$profile\.yarnrc" -TargetDir $devDest -Label "yarnrc: "
Copy-FileIfExists -Source "$profile\.yarnrc.yml" -TargetDir $devDest -Label "yarnrc: "

$cursorUser = Join-Path $env:APPDATA "Cursor\User"
if (Test-Path $cursorUser) {
  Copy-TreeFiltered -Source $cursorUser -Target (Join-Path $devDest "Cursor-User")
}

$cursorHome = Join-Path $profile ".cursor"
if (Test-Path $cursorHome) {
  Copy-TreeFiltered -Source $cursorHome -Target (Join-Path $devDest "cursor-home")
}

# SSH — өте құпия; тек бар болса
$sshDir = Join-Path $profile ".ssh"
if (Test-Path $sshDir) {
  Copy-TreeFiltered -Source $sshDir -Target (Join-Path $devDest "ssh")
  Write-Log "ЕСКЕРТУ: .ssh сақталды — флешкеде қауіпсіз сақтаңыз!"
}

# Android SDK local paths (қайта жасалады, бірақ ыңғайлы)
Copy-FileIfExists -Source (Join-Path $ProjectRoot "mobile\android\local.properties") -TargetDir $devDest -Label "local.properties: "

# --- 4. Жеке құжаттар (опция — бар болса) ---
$personal = @(
  @{ Src = Join-Path $profile "Desktop"; Dst = "Desktop" },
  @{ Src = Join-Path $profile "Documents"; Dst = "Documents" },
  @{ Src = Join-Path $profile "Downloads"; Dst = "Downloads" }
)
foreach ($p in $personal) {
  if (Test-Path $p.Src) {
    $sizeGb = (Get-ChildItem $p.Src -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB
    if ($sizeGb -gt 5) {
      Write-Log "SKIP (>${([math]::Round($sizeGb,1))} GB, қолмен көшіріңіз): $($p.Src)"
    } else {
      Copy-TreeFiltered -Source $p.Src -Target (Join-Path $root $p.Dst)
    }
  }
}

# --- Қорытынды ---
$totalMb = [math]::Round(((Get-ChildItem $root -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB), 1)
Write-Log "=== Дайын ==="
Write-Log "Жалпы көлем: ~${totalMb} MB"
Write-Log "Қалта: $root"
Write-Log ""
Write-Log "Келесі қадамдар:"
Write-Log "  1) Бұл қалтаны флешке/cloud-қа көшіріңіз"
Write-Log "  2) GitHub-қа push жасаған болсаңыз — bundle қосымша"
Write-Log "  3) Переустановкадан кейін: git clone + secrets/ қалтасынан .env қайтару"
Write-Log "  4) mobile/android/keystore + keystore.properties қайтару"

Write-Host ""
Write-Host "Backup аяқталды: $root" -ForegroundColor Green
Write-Host "Manifest: $log" -ForegroundColor Cyan
