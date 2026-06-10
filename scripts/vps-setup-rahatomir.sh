#!/usr/bin/env bash
# rahatomir.com — VPS: systemd (uvicorn :8000) + nginx + опция certbot.
#
# Алдына Cloudflare/DNS:
#   api.rahatomir.com  A  →  сервер public IP
#
# Серверде (root):
#   cd /opt/raqat-ai && git pull
#   sudo bash scripts/vps-setup-rahatomir.sh
#   sudo RUN_CERTBOT=1 bash scripts/vps-setup-rahatomir.sh   # DNS дайын болса
#
set -euo pipefail

RAQAT_ROOT="${RAQAT_ROOT:-/opt/raqat-ai}"
RAQAT_DOMAIN="${RAQAT_DOMAIN:-api.rahatomir.com}"
PORT="${PORT:-8000}"
RUN_CERTBOT="${RUN_CERTBOT:-0}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

die() { echo "ERROR: $*" >&2; exit 1; }
ok() { echo "OK: $*"; }

[[ "$(id -u)" -eq 0 ]] || die "root керек: sudo bash $0"

API_DIR="${RAQAT_ROOT}/platform_api"
MAIN="${API_DIR}/main.py"
REQ="${API_DIR}/requirements.txt"
VENV="${RAQAT_ROOT}/.venv"

[[ -f "$MAIN" ]] || die "код жоқ: $MAIN (RAQAT_ROOT=$RAQAT_ROOT)"

if [[ -f "${RAQAT_ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${RAQAT_ROOT}/.env"
  set +a
fi

grep -q '^RAQAT_REDIS_REQUIRED=' "${RAQAT_ROOT}/.env" 2>/dev/null || \
  echo 'RAQAT_REDIS_REQUIRED=0' >> "${RAQAT_ROOT}/.env"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl nginx python3 python3-venv python3-pip

if ! command -v redis-cli >/dev/null 2>&1; then
  apt-get install -y -qq redis-server || true
  systemctl enable --now redis-server 2>/dev/null || true
fi

[[ -d "$VENV" ]] || python3 -m venv "$VENV"
# shellcheck source=/dev/null
source "${VENV}/bin/activate"
python -m pip install -U -q pip
python -m pip install -q -r "$REQ"
ok "venv + requirements"

UNIT_SRC="${REPO_ROOT}/scripts/systemd/raqat-platform-api-raqat-ai.service.example"
[[ -f "$UNIT_SRC" ]] || UNIT_SRC="${RAQAT_ROOT}/scripts/systemd/raqat-platform-api-raqat-ai.service.example"
[[ -f "$UNIT_SRC" ]] || die "жоқ: raqat-platform-api-raqat-ai.service.example"

sed "s|/opt/raqat-ai|${RAQAT_ROOT}|g" "$UNIT_SRC" > /etc/systemd/system/raqat-platform-api.service
chmod o+X /opt /opt/raqat-ai 2>/dev/null || true
chmod -R o+rX "${RAQAT_ROOT}/platform_api" "${VENV}" 2>/dev/null || true
chown -R www-data:www-data "${RAQAT_ROOT}" 2>/dev/null || true

systemctl daemon-reload
systemctl enable raqat-platform-api
systemctl restart raqat-platform-api
sleep 2
systemctl is-active --quiet raqat-platform-api || {
  journalctl -u raqat-platform-api -n 40 --no-pager >&2 || true
  die "raqat-platform-api іске қосылмады"
}
curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null || die "ішкі /health сәтсіз"
ok "systemd → 127.0.0.1:${PORT}/health"

NGX_TMPL="${REPO_ROOT}/infra/nginx/raqat-api.conf.example"
[[ -f "$NGX_TMPL" ]] || die "жоқ: infra/nginx/raqat-api.conf.example"
sed -e "s/__SERVER_NAME__/${RAQAT_DOMAIN}/g" -e "s/__PORT__/${PORT}/g" \
  "$NGX_TMPL" > /etc/nginx/sites-available/raqat-api
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/raqat-api /etc/nginx/sites-enabled/raqat-api
nginx -t
systemctl reload nginx
ok "nginx HTTP → ${RAQAT_DOMAIN}"

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH 2>/dev/null || true
  ufw allow "Nginx Full" 2>/dev/null || { ufw allow 80/tcp; ufw allow 443/tcp; }
  ufw --force enable 2>/dev/null || true
fi

PUBIP="$(curl -4 -sS --connect-timeout 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo ""
echo "==== HTTP тексеру ===="
echo "  curl -s http://${RAQAT_DOMAIN}/health"
echo "  curl -s http://${PUBIP}/health   (DNS жоқ болса)"

if [[ "$RUN_CERTBOT" == "1" ]]; then
  apt-get install -y -qq certbot python3-certbot-nginx
  if getent hosts "$RAQAT_DOMAIN" >/dev/null 2>&1; then
    certbot --nginx -d "$RAQAT_DOMAIN" --non-interactive --agree-tos -m "admin@${RAQAT_DOMAIN#api.}" \
      --redirect || certbot --nginx -d "$RAQAT_DOMAIN"
    ok "certbot → https://${RAQAT_DOMAIN}/health"
  else
    die "DNS жоқ: ${RAQAT_DOMAIN} → A ${PUBIP} Cloudflare-те қосыңыз, содан RUN_CERTBOT=1 қайталаңыз"
  fi
else
  echo ""
  echo "HTTPS (DNS дайын болса):"
  echo "  sudo RUN_CERTBOT=1 bash scripts/vps-setup-rahatomir.sh"
fi

echo ""
echo "Мобильді / бот: https://${RAQAT_DOMAIN} (certbot кейін)"
