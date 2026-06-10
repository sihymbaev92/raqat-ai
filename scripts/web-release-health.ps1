param(
  [string]$WebUrl = "",
  [string]$ApiHealthUrl = ""
)

$ErrorActionPreference = "Stop"

if (-not $WebUrl) {
  $WebUrl = if ($env:RAQAT_WEB_PUBLIC_URL) { $env:RAQAT_WEB_PUBLIC_URL } else { "https://rahatomir.com" }
}
if (-not $ApiHealthUrl) {
  $ApiHealthUrl = "https://api.rahatomir.com/health"
}

function Fail($Message) {
  Write-Error $Message
  exit 1
}

function Join-Url([string]$Base, [string]$Path) {
  if ($Path -match '^https?://') { return $Path }
  return $Base.TrimEnd("/") + "/" + $Path.TrimStart("/")
}

function Get-StatusCode([string]$Url, [string]$Method = "GET") {
  try {
    $response = Invoke-WebRequest -Uri $Url -Method $Method -UseBasicParsing -TimeoutSec 25
    return [int]$response.StatusCode
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      return [int]$_.Exception.Response.StatusCode
    }
    throw
  }
}

Write-Host "== Web release health =="
Write-Host "WEB: $WebUrl"

$index = Invoke-WebRequest -Uri $WebUrl -UseBasicParsing -TimeoutSec 25
if ([int]$index.StatusCode -ne 200) {
  Fail "index.html status is $($index.StatusCode)"
}

$scriptSrcs = [regex]::Matches($index.Content, 'src="([^"]+\.js(?:\?[^"]*)?)"') |
  ForEach-Object { $_.Groups[1].Value } |
  Where-Object { $_ -like "*_expo/static/js/web/*" }

if (-not $scriptSrcs -or $scriptSrcs.Count -lt 3) {
  Fail "index.html ішінен негізгі Expo JS script табылмады."
}

foreach ($src in $scriptSrcs) {
  $url = Join-Url $WebUrl $src
  $code = Get-StatusCode $url "HEAD"
  Write-Host "JS $code $url"
  if ($code -ne 200) {
    Fail "JS bundle missing: $url returned $code"
  }
}

foreach ($route in @("/", "/more/quran", "/more/surah/1", "/more/mushaf-book/1")) {
  $url = Join-Url $WebUrl $route
  $code = Get-StatusCode $url "HEAD"
  Write-Host "ROUTE $code $url"
  if ($code -ne 200) {
    Fail "Route failed: $url returned $code"
  }
}

foreach ($asset in @(
  "/assets/bundled/hadith-from-db.json",
  "/assets/bundled/quran-translations-offline.json",
  "/assets/bundled/offline-auto-translations-core.json"
)) {
  $url = Join-Url $WebUrl $asset
  $code = Get-StatusCode $url "HEAD"
  Write-Host "ASSET $code $url"
  if ($code -ne 200) {
    Fail "Runtime bundled JSON missing: $url returned $code"
  }
}

$api = Invoke-WebRequest -Uri $ApiHealthUrl -UseBasicParsing -TimeoutSec 25
if ([int]$api.StatusCode -ne 200 -or $api.Content -notmatch '"status"\s*:\s*"ok"') {
  Fail "API health failed: $ApiHealthUrl"
}
Write-Host "API 200 $ApiHealthUrl"
Write-Host "OK: web release health passed"
