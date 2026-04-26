# API /health, /ready және (опция) bot/sync/stats — құпияларды stdout-қа шығармайды.
# Репо түбірінен: powershell -ExecutionPolicy Bypass -File .\scripts\verify_raqat_stack.ps1
# Порт: $env:PORT немесе 8787; URL: $env:RAQAT_PLATFORM_URL | RAQAT_PLATFORM_API_BASE
param(
    [string]$BaseUrl = "",
    [int]$Port = 0
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Import-DotEnv {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    Get-Content -LiteralPath $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line.Length -eq 0 -or $line.StartsWith("#")) { return }
        $eq = $line.IndexOf("=")
        if ($eq -lt 1) { return }
        $key = $line.Substring(0, $eq).Trim()
        $val = $line.Substring($eq + 1).Trim()
        if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
        elseif ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Substring(1, $val.Length - 2) }
        if ($key.Length -gt 0) {
            [Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}

Import-DotEnv (Join-Path $Root ".env")

if ($Port -le 0) {
    $Port = 8787
    if ($env:PORT) { try { $Port = [int]$env:PORT } catch { $Port = 8787 } }
}
if (-not $BaseUrl) {
    $BaseUrl = ($env:RAQAT_PLATFORM_URL + "").Trim()
    if (-not $BaseUrl) { $BaseUrl = ($env:RAQAT_PLATFORM_API_BASE + "").Trim() }
    if (-not $BaseUrl) { $BaseUrl = "http://127.0.0.1:$Port" }
}
$BaseUrl = $BaseUrl.Trim().TrimEnd("/")

Write-Host "Checking: $BaseUrl/health and $BaseUrl/ready ..."

try {
    $h = Invoke-RestMethod -Uri "$BaseUrl/health" -TimeoutSec 8
    if ($h.status -ne "ok") { Write-Error "/health: status not ok" }
    Write-Host "OK: /health"
} catch {
    Write-Error "/health failed: $_"
}

try {
    $r = Invoke-RestMethod -Uri "$BaseUrl/ready" -TimeoutSec 15
    if (-not $r.ok) {
        Write-Error "/ready: ok=false (backend or DB)"
    }
    Write-Host "OK: /ready (backend=$($r.backend))"
} catch {
    Write-Error "/ready failed: $_"
}

$sync = ($env:RAQAT_BOT_SYNC_SECRET + "").Trim()
if ($sync) {
    try {
        $hdr = @{ "X-Raqat-Bot-Sync-Secret" = $sync }
        $s = Invoke-RestMethod -Uri "$BaseUrl/api/v1/bot/sync/stats" -Headers $hdr -TimeoutSec 10
        if ($s.ok) {
            Write-Host "OK: /api/v1/bot/sync/stats (users=$($s.users) bookmarks=$($s.bookmarks))"
        } else {
            Write-Warning "bot/sync/stats: ok=false (серверде RAQAT_BOT_SYNC_SECRET сәйкес емес болуы мүмкін)"
        }
    } catch {
        Write-Warning "bot/sync/stats: $_ (сервер .env-те RAQAT_BOT_SYNC_SECRET тексеріңіз)"
    }
} else {
    Write-Host "Skip: RAQAT_BOT_SYNC_SECRET бос (бот синхрон тесті өткізілді)"
}

Write-Host "Done."
