#!/usr/bin/env bash
# Hetzner Console (KVM) арқылы VPS-ті қалпына келтіру.
# SSH/HTTP сырттан timeout болса — осы скриптті серверде root ретінде іске қосыңыз.
#
#   curl -fsSL https://raw.githubusercontent.com/.../vps_hetzner_console_recovery.sh | bash
# немесе repo бар болса:
#   cd /opt/raqat-ai && sudo bash scripts/vps_hetzner_console_recovery.sh
#
set -euo pipefail

RAQAT_ROOT="${RAQAT_ROOT:-/opt/raqat-ai}"
WEB_ROOT="${RAQAT_VPS_WEB_ROOT:-/var/www/raqat-web/dist}"
API_PORT="${RAQAT_API_PORT:-8000}"

ok() { echo "OK: $*"; }
warn() { echo "WARN: $*" >&2; }
die() { echo "ERROR: $*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "root керек: sudo bash $0"

echo "==== RAQAT VPS recovery ===="
echo "hostname: $(hostname -f 2>/dev/null || hostname)"
PUBIP="$(curl -4 -sS --connect-timeout 8 ifconfig.me 2>/dev/null || true)"
echo "public IPv4: ${PUBIP:-unknown}"
echo "expected:    5.75.162.140 (DNS api.rahatomir.com)"
if [[ -n "$PUBIP" && "$PUBIP" != "5.75.162.140" ]]; then
  warn "IP өзгерген! Cloudflare A жазбаларын жаңартыңыз: @ және api → ${PUBIP}"
fi

echo ""
echo "==== firewall (ufw) ===="
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH 2>/dev/null || ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow "${API_PORT}/tcp" 2>/dev/null || true
  ufw --force enable 2>/dev/null || true
  ufw status verbose || true
  ok "ufw: 22, 80, 443 ашық"
else
  warn "ufw жоқ — Hetzner Cloud Firewall тексеріңіз (Console → Firewalls)"
fi

echo ""
echo "==== listening ports ===="
ss -tlnp | grep -E ':(22|80|443|'"${API_PORT}"') ' || warn "күтілген порттар тыңдамайды"

echo ""
echo "==== nginx ===="
if command -v nginx >/dev/null 2>&1; then
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
  systemctl is-active --quiet nginx && ok "nginx active" || die "nginx іске қосылмады"
else
  warn "nginx орнатылмаған — cd ${RAQAT_ROOT} && bash scripts/vps-setup-rahatomir.sh"
fi

echo ""
echo "==== platform API (systemd) ===="
if systemctl list-unit-files | grep -q raqat-platform-api; then
  systemctl enable raqat-platform-api
  systemctl restart raqat-platform-api
  sleep 2
  if curl -sf "http://127.0.0.1:${API_PORT}/health" >/dev/null; then
    ok "API /health → 127.0.0.1:${API_PORT}"
  else
    journalctl -u raqat-platform-api -n 30 --no-pager || true
    warn "API health сәтсіз — journalctl қараңыз"
  fi
else
  warn "raqat-platform-api unit жоқ — bash ${RAQAT_ROOT}/scripts/vps-setup-rahatomir.sh"
fi

echo ""
echo "==== web static ===="
if [[ -f "${WEB_ROOT}/index.html" ]]; then
  ok "web dist бар: ${WEB_ROOT}/index.html"
else
  warn "web dist жоқ — компьютерден: powershell -File scripts/vps_deploy_web.ps1"
fi

echo ""
echo "==== nginx site configs ===="
SNIP="${RAQAT_ROOT}/scripts/server_snippets"
if [[ -d "$SNIP" ]]; then
  for f in nginx_raqat_web_app.conf nginx_raqat_api_vps_live.conf; do
    src="${SNIP}/${f}"
    dst="/etc/nginx/sites-available/${f%.conf}"
    if [[ -f "$src" ]]; then
      cp "$src" "$dst"
      ln -sf "$dst" "/etc/nginx/sites-enabled/${f%.conf}"
    fi
  done
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  ok "nginx configs reload"
fi

echo ""
echo "==== local smoke ===="
curl -sfI "http://127.0.0.1/" | head -n 3 || warn "nginx :80 жауап бермеді"
curl -sf "http://127.0.0.1:${API_PORT}/health" | head -c 120 || true
echo ""

echo ""
echo "==== сырттан тексеру (компьютерде) ===="
echo "  Test-NetConnection 5.75.162.140 -Port 22"
echo "  curl -fsS https://api.rahatomir.com/health"
echo "  curl -fsS https://rahatomir.com/ | head"
echo ""
echo "Cloudflare: @ A → ${PUBIP:-5.75.162.140}, proxy OFF (сұр бұлт)"
echo "Hetzner Cloud Firewall: inbound TCP 22,80,443 → 0.0.0.0/0"
echo ""
ok "recovery аяқталды"
