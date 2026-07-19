# iPhone IPA — EAS Cloud (Windows/Mac).
# Маңызды: осы скриптті Cursor терминалында емес, Windows Terminal / PowerShell-де іске қосыңыз
# (TTY керек — Apple ID / құрылғы тіркеу интерактивті).
#
# Алғашқы рет:
#   1) Apple Developer Program (ақылы) аккаунты
#   2) Expo аккаунтына Apple байланысы (eas credentials сұрайды)
#   3) iPhone UDID тіркеу (Ad Hoc / internal)
#
# Шығыс: expo.dev → @raqat-omir/raqat-mobile → Builds → .ipa
$ErrorActionPreference = "Stop"
$mobileDir = Split-Path $PSScriptRoot -Parent
Set-Location $mobileDir

Write-Host "=== RAHAT OMIR iOS (EAS) ===" -ForegroundColor Cyan
Write-Host "Профиль: ios-device (телефонға орнату, internal distribution)"
Write-Host "Bundle ID: kz.raqat.app + kz.raqat.app.PrayerWidgetExtension"
Write-Host ""

if ($env:CI -eq "1" -or $env:CI -eq "true") {
  Write-Host "CI=true анықталды — интерактивті Apple кіру жұмыс істемейді. CI өшіріліп тұр." -ForegroundColor Yellow
}
Remove-Item Env:CI -ErrorAction SilentlyContinue
Remove-Item Env:EAS_NO_VCS -ErrorAction SilentlyContinue

Write-Host "Қадамдар (алғашқы build):" -ForegroundColor Yellow
Write-Host "  • Apple ID арқылы кіру (EAS сұрайды)"
Write-Host "  • Distribution Certificate + Ad Hoc Provisioning (app + widget)"
Write-Host "  • iPhone құрылғысын тіркеу (UDID) — QR немесе қолмен"
Write-Host ""

npx --yes eas-cli build --platform ios --profile ios-device @args

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Сәтсіз болса тексеріңіз:" -ForegroundColor Red
  Write-Host "  1) npx eas-cli whoami   (raqat-omir жобасына кіру)"
  Write-Host "  2) Apple Developer Team байланысы"
  Write-Host "  3) iPhone UDID тіркелгені (eas device:create)"
  Write-Error "EAS iOS build сәтсіз (код $LASTEXITCODE)."
}

Write-Host ""
Write-Host "Жинақ дайын болған соң:" -ForegroundColor Green
Write-Host "  https://expo.dev/accounts/raqat-omir/projects/raqat-mobile/builds"
Write-Host "IPA-ны телефонға: Expo build бетіндегі Install сілтемесі (Safari) немесе Apple Configurator."
