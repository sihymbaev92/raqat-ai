# Play Internal Testing handoff (manual upload — no Play API key in repo).
param(
  [string]$Aab = ""
)

$ErrorActionPreference = "Stop"
$mobile = Join-Path (Split-Path $PSScriptRoot -Parent) "mobile"
if (-not $Aab) {
  $Aab = Join-Path $mobile "android\app\build\outputs\bundle\release\app-release.aab"
}
if (-not (Test-Path $Aab)) {
  throw "AAB жоқ: $Aab. Алдымен: cd mobile && npm run build:aab"
}

$dest = Join-Path $mobile "raqat-play-release-latest.aab"
Copy-Item -Force $Aab $dest
$hash = (Get-FileHash $Aab -Algorithm SHA256).Hash.ToLowerInvariant()
$mb = [math]::Round((Get-Item $Aab).Length / 1MB, 2)

Write-Host "== Play Internal handoff =="
Write-Host "AAB: $dest ($mb MB)"
Write-Host "SHA256: $hash"
Write-Host ""
Write-Host "1. Play Console -> Testing -> Internal testing -> Create release"
Write-Host "2. Upload: $dest"
Write-Host "3. Data safety: docs/RELEASE_1MIN_CHECKLIST.md"
Write-Host "4. Product gates: docs/mobile/PRODUCT_GATES.md"
