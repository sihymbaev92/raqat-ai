# iPhone IPA — EAS Cloud (Windows/Mac). Алғаш рет Apple Developer аккаунты сұралады.
# Шығыс: expo.dev → Builds → .ipa жүктеу (internal) немесе TestFlight (production).
$ErrorActionPreference = "Stop"
$mobileDir = Split-Path $PSScriptRoot -Parent
Set-Location $mobileDir

Write-Host "=== RAHAT OMIR iOS (EAS) ===" -ForegroundColor Cyan
Write-Host "Профиль: ios-device (телефонға орнату, internal distribution)"
Write-Host "Bundle ID: kz.raqat.app"
Write-Host ""

$env:CI = "false"
npx --yes eas-cli build --platform ios --profile ios-device @args

if ($LASTEXITCODE -ne 0) {
  Write-Error "EAS iOS build сәтсіз (код $LASTEXITCODE). Apple Developer кіру қажет болуы мүмкін."
}

Write-Host ""
Write-Host "Жинақ дайын болған соң: https://expo.dev → @raqat-omir/raqat-mobile → Builds" -ForegroundColor Green
