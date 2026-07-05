# Privacy URL smoke — Play Store release gate
# Usage: powershell -File scripts/smoke_privacy_url.ps1

$ErrorActionPreference = "Stop"
$url = "https://rahatomir.com/privacy/"
Write-Host "GET $url"
try {
  $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
  if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
    if ($resp.Content -match "Құпиялылық|Privacy|RAHAT OMIR") {
      Write-Host "OK  privacy page live ($($resp.StatusCode))"
      exit 0
    }
    Write-Host "FAIL privacy page missing expected content"
    exit 1
  }
  Write-Host "FAIL HTTP $($resp.StatusCode)"
  exit 1
} catch {
  Write-Host "FAIL $($_.Exception.Message)"
  Write-Host "Deploy: mobile/static-web/privacy/ -> VPS (nginx /privacy/)"
  exit 2
}
