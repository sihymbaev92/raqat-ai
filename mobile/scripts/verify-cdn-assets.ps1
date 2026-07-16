# CDN smoke test for slim APK runtime assets.
param(
  [string]$Base = "https://rahatomir.com/assets"
)

$ErrorActionPreference = "Stop"
$checks = @(
  "$Base/quran/qcf4/pages/001.json",
  "$Base/bundled/quran-uthmani-full.json",
  "$Base/quran_tajweed.json",
  "$Base/tajweed/letters/alif.mp3",
  "$Base/tajweed/muftyat/page-001.jpg",
  "$Base/bundled/offline-auto-translations-core.json"
)

Write-Host "== CDN asset verify: $Base =="
$fail = 0
foreach ($u in $checks) {
  try {
    $r = Invoke-WebRequest -Uri $u -Method Head -UseBasicParsing -TimeoutSec 25
    $kb = if ($r.Headers.'Content-Length') { [math]::Round([int]$r.Headers.'Content-Length' / 1KB, 0) } else { "?" }
    Write-Host "OK $($r.StatusCode) ${kb}KB $u"
  } catch {
    Write-Host "FAIL $u :: $($_.Exception.Message)"
    $fail++
  }
}
if ($fail -gt 0) {
  Write-Host ""
  Write-Host "Fix: powershell -File scripts/deploy_mushaf_cdn_assets.ps1 (from repo root)"
  exit 1
}
Write-Host "All $($checks.Count) CDN checks passed."
