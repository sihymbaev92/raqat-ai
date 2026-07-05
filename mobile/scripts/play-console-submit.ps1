param(
  [string]$Aab = "",
  [switch]$OpenConsole,
  [switch]$SkipBuildCheck
)

$ErrorActionPreference = "Stop"

$mobileDir = Split-Path $PSScriptRoot
$repoRoot = Split-Path $mobileDir
if (-not $Aab) {
  $Aab = Join-Path $mobileDir "android\app\build\outputs\bundle\release\app-release.aab"
}

function Fail($Message) {
  Write-Error $Message
  exit 1
}

Write-Host "== Play Console submit wizard =="
Write-Host ""

if (-not $SkipBuildCheck) {
  & (Join-Path $PSScriptRoot "validate-play-release.ps1") -Aab $Aab -SkipGitHygiene
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$privacyUrls = @(
  "https://rahatomir.com/privacy/",
  "https://rahatomir.com/privacy/index.html"
)
$privacyOk = $false
foreach ($url in $privacyUrls) {
  try {
    $r = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 15
    if ($r.StatusCode -eq 200 -and ($r.Content -match "Құпиялылық|Privacy|privacy" -or $url -match "privacy")) {
      Write-Host "Privacy URL OK: $url"
      $privacyOk = $true
      break
    }
  } catch {
    # try next
  }
}
if (-not $privacyOk) {
  Write-Warning @"
Privacy URL әлі дайын емес (Play submit блоктайды).
1) cd mobile && npm run export:web
2) node scripts/copy-web-static-pages.js
3) bash scripts/vps_deploy_web.sh --skip-build
4) curl -I https://rahatomir.com/privacy/
Doc: docs/operations/play-console-internal-submit-2026-06.md §9
"@
}

$aabItem = Get-Item $Aab
$hash = (Get-FileHash -Path $Aab -Algorithm SHA256).Hash.ToLowerInvariant()

Write-Host ""
Write-Host "--- Upload artifact ---"
Write-Host ("AAB: {0}" -f $aabItem.FullName)
Write-Host ("Size: {0:N2} MB" -f ($aabItem.Length / 1MB))
Write-Host ("SHA256: {0}" -f $hash)
Write-Host ("Package: kz.raqat.app")
Write-Host ("Track: Play Console -> Testing -> Internal testing -> Create release")

try {
  Set-Clipboard -Value $aabItem.FullName
  Write-Host "Clipboard: AAB path copied"
} catch {
  Write-Warning "Clipboard copy failed — path-ті қолмен көшіріңіз."
}

$releaseNotes = @"
RAHAT OMIR v1.1.0 ішкі тест:
- Намаз карточкасы мен azan экраны тұрақтандырылды
- Құбыла Settings crash түзетілді
- Halal каталог bundled snapshot — лезде ашылу
- Dashboard суреттері оптимизацияланды
- Crash-free core navigation (device QA)
"@

Write-Host ""
Write-Host "--- Release notes (kk) — paste into Play Console ---"
Write-Host $releaseNotes

Write-Host ""
Write-Host "--- Data safety ---"
Write-Host "Doc: docs/operations/play-data-safety-google-form-2026-06.md"
Write-Host "Privacy URL: https://rahatomir.com/privacy/"

Write-Host ""
Write-Host "--- Full checklist ---"
Write-Host (Join-Path $repoRoot "docs/operations/play-console-internal-submit-2026-06.md")

$consoleUrls = @(
  "https://play.google.com/console",
  "https://play.google.com/console/developers/app/list"
)

if ($OpenConsole) {
  foreach ($u in $consoleUrls) {
    Start-Process $u
    break
  }
} else {
  Write-Host ""
  Write-Host "Open Console: powershell -File scripts/play-console-submit.ps1 -OpenConsole"
}

Write-Host ""
Write-Host "OK: submit package ready — upload AAB in Google UI (account holder)."
