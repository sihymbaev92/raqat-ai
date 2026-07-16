# CDN smoke test for slim APK runtime assets (primary + fallbacks).
param(
  [string]$Base = "https://rahatomir.com/assets",
  [switch]$PrimaryOnly
)

$ErrorActionPreference = "Stop"

$primaryChecks = @(
  @{ Label = "qcf4-page"; Url = "$Base/quran/qcf4/pages/001.json" }
  @{ Label = "uthmani"; Url = "$Base/bundled/quran-uthmani-full.json" }
  @{ Label = "tajweed-json"; Url = "$Base/quran_tajweed.json" }
  @{ Label = "letter-audio"; Url = "$Base/tajweed/letters/alif.mp3" }
  @{ Label = "muftyat-img"; Url = "$Base/tajweed/muftyat/page-001.jpg" }
  @{ Label = "offline-i18n"; Url = "$Base/bundled/offline-auto-translations-core.json" }
)

$fallbackChecks = @(
  @{ Label = "qcf4-page"; Url = "https://raw.githubusercontent.com/MohamadHajjRabee/quran-qcf4/main/pages/001.json" }
  @{ Label = "uthmani"; Url = "https://api.alquran.cloud/v1/quran/quran-uthmani" }
  @{ Label = "tajweed-json"; Url = "https://api.alquran.cloud/v1/quran/quran-tajweed" }
)

function Test-UrlHead([string]$Url) {
  $r = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -TimeoutSec 25
  $kb = if ($r.Headers.'Content-Length') { [math]::Round([int]$r.Headers.'Content-Length' / 1KB, 0) } else { "?" }
  return @{ Ok = $true; Status = $r.StatusCode; Kb = $kb }
}

function Run-Group([string]$Title, $Items) {
  Write-Host "== $Title =="
  $fail = 0
  $results = @{}
  foreach ($item in $Items) {
    try {
      $hit = Test-UrlHead $item.Url
      Write-Host "OK $($hit.Status) $($hit.Kb)KB $($item.Label) :: $($item.Url)"
      $results[$item.Label] = $true
    } catch {
      Write-Host "FAIL $($item.Label) :: $($item.Url) :: $($_.Exception.Message)"
      $results[$item.Label] = $false
      $fail++
    }
  }
  return @{ Fail = $fail; Results = $results }
}

$primary = Run-Group "Primary CDN: $Base" $primaryChecks
if ($PrimaryOnly) {
  if ($primary.Fail -gt 0) { exit 1 }
  Write-Host "All $($primaryChecks.Count) primary CDN checks passed."
  exit 0
}

if ($primary.Fail -eq 0) {
  Write-Host "All $($primaryChecks.Count) primary CDN checks passed."
  exit 0
}

Write-Host ""
Write-Host "Primary CDN down ($($primary.Fail)/$($primaryChecks.Count) fail). Checking slim-APK fallbacks..." -ForegroundColor Yellow
$fallback = Run-Group "Slim APK fallbacks" $fallbackChecks

$coreLabels = @("qcf4-page", "uthmani", "tajweed-json")
$coreOk = $true
foreach ($label in $coreLabels) {
  if (-not $fallback.Results[$label]) { $coreOk = $false }
}

if ($coreOk) {
  Write-Host ""
  Write-Host "OK: core hatim/tajweed fallbacks reachable (AlQuran API + GitHub QCF4)." -ForegroundColor Green
  Write-Host "WARN: rahatomir.com CDN still down — letter audio / muftyat images need VPS deploy." -ForegroundColor Yellow
  Write-Host "Fix VPS: powershell -File scripts/vps_install_ssh_key.ps1 then scripts/deploy_mushaf_cdn_assets.ps1"
  exit 0
}

Write-Host ""
Write-Host "FAIL: primary CDN and core fallbacks both broken."
exit 1
