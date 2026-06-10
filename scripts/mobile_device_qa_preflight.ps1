# Device QA preflight — Jest + APK + prod API + optional prod hatim smoke.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/mobile_device_qa_preflight.ps1
# On-device §1–§4: scripts/mobile_device_qa_on_device.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Import-DeployEnv($path) {
  if (-not (Test-Path $path)) { return }
  foreach ($line in Get-Content $path) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $k = $Matches[1]
      $v = $Matches[2].Trim()
      if ($v -match '^["''](.+)["'']$') { $v = $Matches[1] }
      if (-not (Get-Item "Env:$k" -ErrorAction SilentlyContinue)) {
        Set-Item -Path "Env:$k" -Value $v
      }
    }
  }
}
Import-DeployEnv (Join-Path $Root ".env.deploy")

Write-Host "== Mobile Jest (quran/hadith/halal) =="
Push-Location "$Root\mobile"
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& npx jest --ci --testPathPattern="quranLastRead|Hadith|Halal|quranAyah|hatim" --passWithNoTests 2>&1 | Select-Object -Last 8
$jestExit = $LASTEXITCODE
$ErrorActionPreference = $prevEap
Pop-Location
if ($jestExit -ne 0) { exit $jestExit }

$apk = "$Root\mobile\apk-download\raqat-release-latest.apk"
if (-not (Test-Path $apk)) {
  $apk = "$Root\mobile\android\app\build\outputs\apk\release\app-release.apk"
}
if (Test-Path $apk) {
  $mb = [math]::Round((Get-Item $apk).Length / 1MB, 1)
  Write-Host "OK  APK: $apk ($mb MB)"
} else {
  Write-Host "WARN APK missing — run: cd mobile; npm run build:apk"
}

Write-Host "== Prod API smoke =="
try {
  $r = Invoke-RestMethod -Uri "https://api.rahatomir.com/ready" -TimeoutSec 15
  Write-Host "OK  /ready backend=$($r.backend) redis=$($r.redis.status)"
} catch {
  Write-Host "FAIL prod /ready: $($_.Exception.Message)"
}

try {
  Invoke-RestMethod -Method POST -Uri "https://api.rahatomir.com/api/v1/ai/chat" `
    -ContentType "application/json" -Body '{"prompt":"smoke"}' -TimeoutSec 15 | Out-Null
  Write-Host "WARN anonymous AI allowed (expected 401 when RAQAT_AI_ALLOW_ANONYMOUS=0)"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) {
    Write-Host "OK  anonymous AI blocked (401)"
  } else {
    Write-Host "WARN AI smoke: $($_.Exception.Message)"
  }
}

Write-Host "== Hatim API smoke (local in-process) =="
$prevEap2 = $ErrorActionPreference
$ErrorActionPreference = "Continue"
Push-Location $Root
python scripts/dev_test_hatim_auth_api.py 2>&1 | Select-Object -Last 3
$hatimExit = $LASTEXITCODE
$ErrorActionPreference = $prevEap2
Pop-Location
if ($hatimExit -ne 0) { Write-Host "WARN local hatim API smoke failed (exit $hatimExit)" }

if ($env:RAQAT_SMOKE_AUTH_PASSWORD) {
  Write-Host "== Prod hatim smoke (.env.deploy) =="
  $prevEap3 = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  python scripts/smoke_hatim_api.py --api-base "https://api.rahatomir.com" 2>&1 | Select-Object -Last 5
  $prodHatim = $LASTEXITCODE
  $ErrorActionPreference = $prevEap3
  if ($prodHatim -eq 0) { Write-Host "OK  prod /me/hatim roundtrip" }
  else { Write-Host "WARN prod hatim smoke failed — run: scripts/provision_prod_smoke_auth.ps1" }
} else {
  Write-Host "SKIP prod hatim (set RAQAT_SMOKE_AUTH_PASSWORD in .env.deploy or run provision_prod_smoke_auth.ps1)"
}

Write-Host ""
Write-Host "On-device QA: powershell -File scripts/mobile_device_qa_on_device.ps1"
Write-Host "Manual checklist: docs/mobile/changelog/2026-05-24-device-qa.md"
Write-Host "Install: adb install -r `"$apk`""
