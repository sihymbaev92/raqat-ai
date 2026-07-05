# Hetzner IP block — дайындық + unblock сұрау мәтіні
# Usage: powershell -ExecutionPolicy Bypass -File scripts/hetzner_unblock.ps1
#        powershell -ExecutionPolicy Bypass -File scripts/hetzner_unblock.ps1 -CopyTicket
param(
    [switch]$CopyTicket,
    [string]$VpsHost = "5.75.162.140",
    [string]$ServerName = "ai-bot"
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot

function Get-PublicIp {
    try { return (Invoke-RestMethod -Uri "https://api.ipify.org?format=json" -TimeoutSec 10).ip } catch { return "UNKNOWN" }
}

$myIp = Get-PublicIp
Write-Host ""
Write-Host "==== Hetzner IP block ====" -ForegroundColor Cyan
Write-Host "Server: $ServerName  IPv4: $VpsHost"
Write-Host "Your public IP (whitelist): $myIp"
Write-Host ""

$blocked = $true
foreach ($p in 22, 80, 443) {
    $r = Test-NetConnection -ComputerName $VpsHost -Port $p -WarningAction SilentlyContinue
    $ok = $r.TcpTestSucceeded
    Write-Host ("  TCP {0}:{1} -> {2}" -f $VpsHost, $p, $(if ($ok) { "OK" } else { "BLOCKED/TIMEOUT" }))
    if ($ok) { $blocked = $false }
}

if (-not $blocked) {
    Write-Host ""
    Write-Host "IP reachable — block may already be lifted. Try:" -ForegroundColor Green
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\vps_deploy_web.ps1 -SkipBuild"
    exit 0
}

Write-Host ""
Write-Host "==== Step 1: Hetzner Console ====" -ForegroundColor Yellow
Write-Host @"
1. https://console.hetzner.cloud → project → server '$ServerName'
2. Networking → red banner → [Request Unblock]
   (немесе Support → Technical → Public Network issue)
3. Gmail/Hetzner email: блоктау себебі + Locking ID (subject жолында)
4. Robot (егер Cloud unblock жоқ болса):
   https://robot.your-server.de → Support → Unlock → Locking ID
5. Уақытша SSH (бар болса): Robot → Servers → Server locking → whitelist IP: $myIp
6. Console (KVM): server → Console → root → cleanup:
   cd /opt/raqat-ai && sudo bash scripts/vps_hetzner_console_recovery.sh
"@

Write-Host ""
Write-Host "==== Step 2: Unblock ticket (copy to Hetzner) ====" -ForegroundColor Yellow

$ticket = @"
Subject: Unblock request — server $ServerName — IPv4 $VpsHost

Hello Hetzner Support,

Please unblock the Primary IPv4 address $VpsHost assigned to my Cloud server "$ServerName" (project: rahatomir / RAQAT).

The server hosts a legitimate Islamic lifestyle web app and API:
- https://rahatomir.com (static Expo web)
- https://api.rahatomir.com (FastAPI, nginx reverse proxy)

We received the IP block notification. We have reviewed the server via Hetzner Console (KVM) and taken remedial action:
- Removed unknown/unauthorized processes and cron jobs (if any were found)
- Rotated root SSH keys / passwords
- Verified only nginx (80/443), uvicorn API (127.0.0.1:8000), redis, postgres are running
- No outbound port scanning or mail relay (ports 25/465 not used)
- ufw allows only OpenSSH, 80, 443

Services on this host:
- nginx + Let's Encrypt (rahatomir.com, api.rahatomir.com)
- Python FastAPI platform API (/health endpoint)
- Static web at /var/www/raqat-web/dist

Please whitelist my current IP for temporary access if needed: $myIp

Locking ID: [PASTE FROM HETZNER EMAIL]

Thank you for reviewing and unblocking the IP.

Best regards
"@

Write-Host $ticket

$ticketPath = Join-Path $Root "scripts\hetzner_unblock_ticket.txt"
$ticket | Set-Content -Path $ticketPath -Encoding UTF8
Write-Host ""
Write-Host "Saved: $ticketPath" -ForegroundColor DarkGray

if ($CopyTicket) {
    try {
        Set-Clipboard -Value $ticket
        Write-Host "Copied to clipboard." -ForegroundColor Green
    } catch {
        Write-Host "Could not copy to clipboard: $_"
    }
}

Write-Host ""
Write-Host "==== Step 3 (fast workaround): NEW Primary IPv4 ====" -ForegroundColor Yellow
Write-Host @"
If unblock takes days, assign a fresh IPv4 (blocked IP stays blocked):

1. Console → $ServerName → Power → Power OFF (server must be off)
2. Networking → Primary IPs → Add Primary IP → IPv4 (location: same as server)
3. Assign new IPv4 to '$ServerName' (unassign old $VpsHost if required)
4. Power ON → Console: curl -4 ifconfig.me  (confirm new IP)
5. Update DNS (Cloudflare, proxy OFF):
   @ A → NEW_IP
   api A → NEW_IP
6. Local .env.deploy: RAQAT_VPS_HOST=NEW_IP
7. Deploy:
   powershell -ExecutionPolicy Bypass -File scripts\vps_deploy_web.ps1 -SkipBuild

Recovery on server after new IP:
  cd /opt/raqat-ai && sudo RUN_CERTBOT=1 bash scripts/vps-setup-rahatomir.sh
"@

Write-Host ""
Write-Host "==== Cloudflare check ====" -ForegroundColor Yellow
try {
    $web = Resolve-DnsName rahatomir.com -Type A -ErrorAction Stop | Select-Object -ExpandProperty IPAddress
    if ($web -match "^188\.114\.") {
        Write-Host "WARN: rahatomir.com → Cloudflare proxy ($web). Set A record DNS-only to $VpsHost (or NEW_IP)." -ForegroundColor Red
    } else {
        Write-Host "rahatomir.com A -> $($web -join ', ')"
    }
    $api = Resolve-DnsName api.rahatomir.com -Type A -ErrorAction Stop | Select-Object -ExpandProperty IPAddress
    Write-Host "api.rahatomir.com A -> $($api -join ', ')"
} catch {
    Write-Host "DNS lookup failed: $_"
}

Write-Host ""
