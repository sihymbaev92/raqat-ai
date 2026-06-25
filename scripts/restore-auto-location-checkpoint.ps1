# Қайта оралу: checkpoint/auto-location-v1 (автоматты орын)
param(
  [string]$Tag = "checkpoint/auto-location-v1"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$files = @(
  "mobile/src/services/devicePrayerLocation.ts",
  "mobile/src/services/__tests__/devicePrayerLocation.test.ts",
  "mobile/src/constants/kzCities.ts",
  "mobile/src/storage/prefs.ts",
  "mobile/src/screens/DashboardScreen.tsx",
  "mobile/src/screens/PrayerTimesScreen.tsx",
  "mobile/src/components/settings/SettingsPrayerLocationSection.tsx",
  "mobile/src/context/QiblaSensorContext.tsx",
  "mobile/src/i18n/kk.ts",
  "docs/operations/CHECKPOINT_AUTO_LOCATION.md",
  "mobile/package.json"
)

if (-not (git rev-parse -q --verify "refs/tags/$Tag" 2>$null)) {
  Write-Error "Tag '$Tag' табылмады. Алдымен commit + tag жасалғанын тексеріңіз."
}

Write-Host "Restoring from tag: $Tag"
foreach ($f in $files) {
  git restore --source $Tag -- $f
  if ($LASTEXITCODE -ne 0) {
    Write-Error "restore сәтсіз: $f"
  }
  Write-Host "  OK $f"
}

Write-Host ""
Write-Host "Дайын. Тест:"
Write-Host "  cd mobile; npm run test:auto-location"
