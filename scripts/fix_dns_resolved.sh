#!/usr/bin/env bash
set -euo pipefail

# DNS тұрақтандыру (systemd-resolved) және Telegram/API тексеруі.
# Қауіпсіздік үшін әдепкіде dry-run. Нақты қолдану:
#   sudo bash scripts/fix_dns_resolved.sh --apply

APPLY=0
if [[ "${1:-}" == "--apply" ]]; then
  APPLY=1
fi

RESOLVED_CONF="/etc/systemd/resolved.conf.d/raqat-dns.conf"

print_plan() {
  cat <<'EOF'
[plan] systemd-resolved override:
  [Resolve]
  DNS=1.1.1.1 8.8.8.8
  FallbackDNS=9.9.9.9 1.0.0.1
  DNSStubListener=yes
EOF
}

verify_dns() {
  echo "[check] DNS resolve: api.telegram.org"
  getent hosts api.telegram.org || true
  echo "[check] HTTPS head: https://api.telegram.org"
  python3 - <<'PY'
import socket, urllib.request
try:
    ip = socket.gethostbyname("api.telegram.org")
    print("dns_ok", ip)
except Exception as e:
    print("dns_fail", e)
try:
    r = urllib.request.urlopen("https://api.telegram.org", timeout=6)
    print("https_ok", r.status)
except Exception as e:
    print("https_fail", e)
PY
}

print_plan
if [[ "$APPLY" != "1" ]]; then
  echo "[dry-run] Еш өзгеріс жасалмады. Қолдану үшін: --apply"
  verify_dns
  exit 0
fi

echo "[apply] Writing ${RESOLVED_CONF}"
sudo mkdir -p "$(dirname "$RESOLVED_CONF")"
sudo tee "$RESOLVED_CONF" >/dev/null <<'EOF'
[Resolve]
DNS=1.1.1.1 8.8.8.8
FallbackDNS=9.9.9.9 1.0.0.1
DNSStubListener=yes
EOF

echo "[apply] Restarting systemd-resolved"
sudo systemctl restart systemd-resolved
sudo systemctl is-active systemd-resolved

echo "[apply] resolvectl status (short)"
resolvectl status | sed -n '1,40p'

verify_dns
echo "[done] DNS override applied."
