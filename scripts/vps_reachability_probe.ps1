# VPS + DNS reachability probe (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/vps_reachability_probe.ps1
param(
  [string]$VpsHost = "5.75.162.140",
  [string]$WebUrl = "https://rahatomir.com",
  [string]$ApiUrl = "https://api.rahatomir.com/health"
)

$ErrorActionPreference = "Continue"
Write-Host "== VPS reachability: $VpsHost =="

foreach ($p in 22, 80, 443, 8000) {
  $r = Test-NetConnection -ComputerName $VpsHost -Port $p -WarningAction SilentlyContinue
  Write-Host ("  TCP {0}:{1} -> {2}" -f $VpsHost, $p, $r.TcpTestSucceeded)
}

Write-Host ""
Write-Host "== DNS =="
foreach ($name in "rahatomir.com", "api.rahatomir.com") {
  try {
    $recs = Resolve-DnsName $name -Type A -ErrorAction Stop | Select-Object -ExpandProperty IPAddress
    Write-Host "  $name A -> $($recs -join ', ')"
    if ($name -eq "rahatomir.com" -and ($recs -match "^188\.114\.")) {
      Write-Host "  WARN: rahatomir.com Cloudflare proxy ON (188.114.*) — DNS only (сұр бұлт OFF) қажет" -ForegroundColor Yellow
    }
  } catch {
    Write-Host "  $name -> resolve failed"
  }
}

Write-Host ""
Write-Host "== HTTP =="
foreach ($url in $WebUrl, $ApiUrl) {
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15 -Method Head
    Write-Host "  $url -> $($resp.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code) { Write-Host "  $url -> HTTP $code" }
    else { Write-Host "  $url -> $($_.Exception.Message)" }
  }
}

Write-Host ""
Write-Host "SSH timeout болса: Hetzner Console -> root login -> bash /opt/raqat-ai/scripts/vps_hetzner_console_recovery.sh"
