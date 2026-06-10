# Perf + API baseline smoke (feature freeze P2).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/perf_smoke_baseline.ps1
# Fill results: docs/mobile/changelog/2026-06-perf-baseline.md

param(
  [string]$ApiBase = "https://api.rahatomir.com",
  [int]$HalalTimeoutSec = 30
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Import-DeployEnv($path) {
  if (-not (Test-Path $path)) { return }
  foreach ($line in Get-Content $path) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $k = $Matches[1]; $v = $Matches[2].Trim()
      if ($v -match '^["''](.+)["'']$') { $v = $Matches[1] }
      if (-not (Get-Item "Env:$k" -ErrorAction SilentlyContinue)) { Set-Item "Env:$k" $v }
    }
  }
}
Import-DeployEnv (Join-Path $Root ".env.deploy")

function Measure-Ms([scriptblock]$Block) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  & $Block
  $sw.Stop()
  return [math]::Round($sw.Elapsed.TotalMilliseconds, 0)
}

Write-Host "== perf_smoke_baseline $(Get-Date -Format 'yyyy-MM-dd HH:mm') =="
Write-Host "API: $ApiBase"
Write-Host ""

$rows = @()

# /ready
try {
  $ms = Measure-Ms { $script:r = Invoke-RestMethod -Uri "$ApiBase/ready" -TimeoutSec 15 }
  $ok = $script:r.backend -and $script:r.redis.status -eq "ok"
  $rows += [pscustomobject]@{ Check = "/ready"; Ms = $ms; BudgetMs = 2000; Pass = $(if ($ok -and $ms -lt 2000) { "PASS" } else { "WARN" }) }
  Write-Host ("OK  /ready {0}ms backend={1} redis={2}" -f $ms, $script:r.backend, $script:r.redis.status)
} catch {
  $rows += [pscustomobject]@{ Check = "/ready"; Ms = "-"; BudgetMs = 2000; Pass = "FAIL" }
  Write-Host "FAIL /ready $($_.Exception.Message)"
}

# Halal proxy — status (жылдам) + companies sample (per_page=1)
try {
  $ms = Measure-Ms {
    $script:hs = Invoke-RestMethod -Uri "$ApiBase/api/v1/halal-damu/status" -TimeoutSec 10
  }
  $ok = $script:hs.ok -eq $true
  $rows += [pscustomobject]@{ Check = "halal-damu/status"; Ms = $ms; BudgetMs = 2000; Pass = $(if ($ok -and $ms -lt 2000) { "PASS" } else { "WARN" }) }
  Write-Host ("OK  halal status {0}ms enabled={1}" -f $ms, $script:hs.enabled)
} catch {
  $rows += [pscustomobject]@{ Check = "halal-damu/status"; Ms = "-"; BudgetMs = 2000; Pass = "FAIL" }
  Write-Host "FAIL halal status $($_.Exception.Message)"
}

try {
  $url = "$ApiBase/api/v1/halal-damu/halal-bot/v1/companies?per_page=1"
  $ms = Measure-Ms {
    $script:hr = Invoke-WebRequest -Uri $url -TimeoutSec $HalalTimeoutSec -UseBasicParsing
  }
  $pass = if ($script:hr.StatusCode -eq 200 -and $ms -lt 15000) { "PASS" } elseif ($ms -lt 20000) { "WARN" } else { "FAIL" }
  $rows += [pscustomobject]@{ Check = "halal companies sample"; Ms = $ms; BudgetMs = 15000; Pass = $pass }
  Write-Host ("OK  halal companies sample {0}ms HTTP {1}" -f $ms, $script:hr.StatusCode)
} catch {
  $rows += [pscustomobject]@{ Check = "halal companies sample"; Ms = "-"; BudgetMs = 15000; Pass = "FAIL" }
  Write-Host "WARN halal companies sample $($_.Exception.Message)"
}

# Anonymous AI blocked
try {
  Invoke-RestMethod -Method POST -Uri "$ApiBase/api/v1/ai/chat" -ContentType "application/json" `
    -Body '{"prompt":"smoke"}' -TimeoutSec 10 | Out-Null
  $rows += [pscustomobject]@{ Check = "AI anonymous 401"; Ms = "-"; BudgetMs = "-"; Pass = "WARN" }
  Write-Host "WARN anonymous AI not blocked"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) {
    $rows += [pscustomobject]@{ Check = "AI anonymous 401"; Ms = "-"; BudgetMs = "-"; Pass = "PASS" }
    Write-Host "OK  anonymous AI blocked (401)"
  } else {
    $rows += [pscustomobject]@{ Check = "AI anonymous 401"; Ms = "-"; BudgetMs = "-"; Pass = "FAIL" }
    Write-Host "FAIL AI smoke $($_.Exception.Message)"
  }
}

# Hatim roundtrip
if ($env:RAQAT_SMOKE_AUTH_PASSWORD) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $hatimOut = python scripts/smoke_hatim_api.py --api-base $ApiBase 2>&1 | Select-Object -Last 3
  $hatimExit = $LASTEXITCODE
  $ErrorActionPreference = $prev
  if ($hatimExit -eq 0) {
    $rows += [pscustomobject]@{ Check = "hatim GET/PUT/GET"; Ms = "-"; BudgetMs = 3000; Pass = "PASS" }
    Write-Host "OK  prod hatim roundtrip"
  } else {
    $rows += [pscustomobject]@{ Check = "hatim GET/PUT/GET"; Ms = "-"; BudgetMs = 3000; Pass = "FAIL" }
    Write-Host "FAIL prod hatim smoke"
    $hatimOut
  }
} else {
  Write-Host "SKIP hatim (RAQAT_SMOKE_AUTH_PASSWORD in .env.deploy)"
}

# Mobile Jest count (quick)
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
Push-Location "$Root\mobile"
$jestLine = (& npx jest --ci --passWithNoTests 2>&1 | Select-String "Tests:" | Select-Object -Last 1)
$jestExit = $LASTEXITCODE
Pop-Location
$ErrorActionPreference = $prevEap
if ($jestExit -eq 0 -and $jestLine) {
  Write-Host "OK  Jest $jestLine"
  $rows += [pscustomobject]@{ Check = "Jest full"; Ms = "-"; BudgetMs = "-"; Pass = "PASS" }
} else {
  Write-Host "WARN Jest exit $jestExit"
  $rows += [pscustomobject]@{ Check = "Jest full"; Ms = "-"; BudgetMs = "-"; Pass = "WARN" }
}

Write-Host ""
Write-Host "| Check | Ms | Budget | Pass |"
foreach ($r in $rows) {
  Write-Host ("| {0} | {1} | {2} | {3} |" -f $r.Check, $r.Ms, $r.BudgetMs, $r.Pass)
}
Write-Host ""
Write-Host "Device perf (manual): docs/mobile/changelog/2026-06-perf-baseline.md"
Write-Host "On-device QA: scripts/mobile_device_qa_on_device.ps1"
