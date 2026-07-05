# VPS-сыз локальды әзірлеу — API + web + Expo (Windows)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/start_local_dev.ps1
param(
    [switch]$SkipDocker,
    [switch]$SkipExpo,
    [switch]$SkipWeb
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Get-LanIp {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -match '^192\.168\.' -and
            $_.InterfaceAlias -notmatch 'vEthernet|WSL|Virtual|Hyper-V'
        } |
        Select-Object -First 1 -ExpandProperty IPAddress
    if ($ip) { return $ip }
    return "127.0.0.1"
}

$Lan = Get-LanIp
Write-Host "== RAQAT local dev (no VPS) ==" -ForegroundColor Cyan
Write-Host "LAN IP: $Lan"

# mobile/.env — локальды API (gitignore)
$MobileEnv = Join-Path $Root "mobile\.env"
$envLines = @(
    "# Auto: VPS-сыз локальды режим (scripts/start_local_dev.ps1)",
    "EXPO_PUBLIC_IMAM_AI_API_BASE=http://${Lan}:8787",
    "EXPO_PUBLIC_RAQAT_API_BASE=http://${Lan}:8787",
    "EXPO_PUBLIC_RAQAT_WEB_URL=http://${Lan}:8090",
    "EXPO_PUBLIC_HALAL_DAMU_URL=https://halaldamu.kz/",
    "EXPO_PUBLIC_HALAL_DAMU_DIRECT=1",
    "EXPO_PUBLIC_RAQAT_AI_KB_ONLY=1"
)
if (Test-Path $MobileEnv) {
    $secret = Get-Content $MobileEnv -ErrorAction SilentlyContinue |
        Where-Object { $_ -match '^RAQAT_BOT_SYNC_SECRET=' } |
        Select-Object -First 1
    if ($secret) { $envLines += $secret }
}
$envLines | Set-Content -Path $MobileEnv -Encoding UTF8
Write-Host "OK: mobile/.env -> http://${Lan}:8787"

Write-Host ""
Write-Host "== Docker PG + Redis =="
if (-not $SkipDocker) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\bootstrap_dev_pg_redis.ps1")
}

Write-Host ""
Write-Host "== Platform API :8787 =="
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\restart_raqat_stack.ps1") -StartRedis -SkipBot

function Stop-PortListener {
    param([int]$Port)
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

if (-not $SkipWeb) {
    if (-not (Test-Path (Join-Path $Root "mobile\dist\index.html"))) {
        Write-Host "== Web export (first time) =="
        Set-Location (Join-Path $Root "mobile")
        $env:RAQAT_EXPO_RELEASE_BUILD = "1"
        npx expo export --platform web --output-dir dist
        node scripts/patch-web-boot-html.js
        node scripts/copy-web-bundled-json.js
        node scripts/copy-web-quran-assets.js
        Set-Location $Root
    }
    Stop-PortListener -Port 8090
    Start-Process -WindowStyle Hidden -FilePath "cmd.exe" `
        -ArgumentList "/c", "cd /d `"$(Join-Path $Root 'mobile')`" && npx --yes serve dist -l 8090" `
        -WorkingDirectory (Join-Path $Root "mobile")
    Write-Host "OK: web static http://127.0.0.1:8090"
}

if (-not $SkipExpo) {
    Stop-PortListener -Port 8081
    $expoCmd = "cd /d `"$(Join-Path $Root 'mobile')`" && set EXPO_PUBLIC_IMAM_AI_API_BASE=http://${Lan}:8787 && npx expo start --lan"
    Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/k", $expoCmd
    Write-Host "OK: Expo Metro (LAN) — телефон: exp://${Lan}:8081"
}

Write-Host ""
Write-Host "==== Дайын (VPS керек емес) ====" -ForegroundColor Green
Write-Host "  API:     http://127.0.0.1:8787/health"
Write-Host "  Web:     http://127.0.0.1:8090"
Write-Host "  Expo:    http://127.0.0.1:8081"
Write-Host "  Телефон: exp://${Lan}:8081  (бір Wi-Fi, debug APK)"
Write-Host ""
Write-Host "Тест: cd mobile && npm test"
Write-Host "Debug APK: cd mobile && npm run build:apk:debug"
