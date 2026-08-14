# Release minuses preflight — automated checks (VPS deploy still manual).
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location (Join-Path $RepoRoot "mobile")

Write-Host "== Release minuses preflight ==" -ForegroundColor Cyan

npm run verify:cdn-assets
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run release:play:check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Manual gates (cannot automate here):" -ForegroundColor Yellow
Write-Host "  - VPS SSH + CDN deploy (RAQAT_VPS_SSH_KEY / BatchMode — see docs/mobile/CDN_DEPLOY_SSH.md)"
Write-Host "  - Play Internal upload (mobile/android/.../app-release.aab)"
Write-Host "  - Scholar sign-off (namazLearningContent approvedForPublicRelease)"
$namazReview = Get-Content (Join-Path $mobileDir "src\content\namazLearningContent.ts") -Raw
if ($namazReview -notmatch "approvedForPublicRelease:\s*true") {
  Write-Host "    WARN: namaz scholar sign-off pending (approvedForPublicRelease=false)" -ForegroundColor Yellow
} else {
  Write-Host "    OK: namaz scholar sign-off recorded" -ForegroundColor Green
}
Write-Host "  - Hadith catalog growth (expand kz-trusted-hadith-catalog.json; seed ~98 KK-only)"
Write-Host "  - Azan 3 OEM x 3 day QA"
Write-Host ""
Write-Host "OK: automated preflight passed." -ForegroundColor Green
