#!/usr/bin/env bash
# Ubuntu VPS: Redis + platform_api venv + systemd + nginx (HTTP). TLS — қолмен certbot.
#
# Алдына: репо /opt/raqat (немесе RAQAT_ROOT) салыңыз, түбірде .env (RAQAT_REDIS_URL т.б.)
#
# Пайдалану (root):
#   export RAQAT_ROOT=/opt/raqat
#   export RAQAT_DOMAIN=api.example.com   # nginx server_name; IP-only сынақ үшін: _
#   bash scripts/vps_install_stack.sh
#
set -euo pipefail

RAQAT_ROOT="${RAQAT_ROOT:-/opt/raqat}"
RAQAT_DOMAIN="${RAQAT_DOMAIN:-_}"
PORT="${PORT:-8787}"
API_DIR="${RAQAT_ROOT}/platform_api"
REQ="${API_DIR}/requirements.txt"
MAIN="${API_DIR}/main.py"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "root керек: sudo bash $0"
[[ -f "$MAIN" ]] || die "код жоқ: $MAIN (алдымен RAQAT_ROOT=$RAQAT_ROOT салыңыз)"
[[ -f "$REQ" ]] || die "жоқ: $REQ"

if [[ -f "${RAQAT_ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  # shellcheck source=/dev/null
  source "${RAQAT_ROOT}/.env"
  set +a
fi
: "${RAQAT_REDIS_URL:=redis://127.0.0.1:6379/0}"
export RAQAT_REDIS_URL
unset RAQAT_REDIS_REQUIRED 2>/dev/null || true

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  ca-certificates \
  curl \
  nginx \
  python3 \
  python3-venv \
  python3-pip \
  redis-server

systemctl enable --now redis-server
if ! redis-cli ping 2>/dev/null | grep -q PONG; then
  die "Redis жауап бермей жатыр (redis-cli ping)"
fi
echo "OK: Redis"

if [[ ! -d "${API_DIR}/.venv" ]]; then
  python3 -m venv "${API_DIR}/.venv"
fi
# shellcheck source=/dev/null
source "${API_DIR}/.venv/bin/activate"
python -m pip install -U -q pip
python -m pip install -q -r "$REQ"
echo "OK: venv + pip"

if [[ -d "$REPO_ROOT" ]] && [[ -f "$REPO_ROOT/scripts/systemd/raqat-platform-api.service.example" ]]; then
  UNIT_SRC="$REPO_ROOT/scripts/systemd/raqat-platform-api.service.example"
else
  UNIT_SRC="${RAQAT_ROOT}/scripts/systemd/raqat-platform-api.service.example"
fi
[[ -f "$UNIT_SRC" ]] || die "жоқ: raqat-platform-api.service.example"

install -d /etc/systemd/system
sed "s|/opt/raqat|${RAQAT_ROOT}|g" "$UNIT_SRC" > /etc/systemd/system/raqat-platform-api.service
chown -R www-data:www-data "$RAQAT_ROOT" 2>/dev/null || chown -R www-data:www-data "$API_DIR" "${RAQAT_ROOT}/.env" 2>/dev/null || true

systemctl daemon-reload
systemctl enable raqat-platform-api
systemctl restart raqat-platform-api
sleep 2
if ! systemctl is-active --quiet raqat-platform-api; then
  echo "---- journalctl (соңғы 50) ----" >&2
  journalctl -u raqat-platform-api -n 50 --no-pager >&2 || true
  die "raqat-platform-api іске қосылмады"
fi

if ! curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null; then
  die "/health сәтсіз (uvicorn 127.0.0.1:${PORT})"
fi
echo "OK: http://127.0.0.1:${PORT}/health"

NGX_EX="${REPO_ROOT}/infra/nginx/raqat-api.conf.example"
if [[ ! -f "$NGX_EX" ]]; then
  NGX_EX="${RAQAT_ROOT}/infra/nginx/raqat-api.conf.example"
fi
[[ -f "$NGX_EX" ]] || die "жоқ: infra/nginx/raqat-api.conf.example"

sed "s/__SERVER_NAME__/${RAQAT_DOMAIN}/g" "$NGX_EX" > /etc/nginx/sites-available/raqat-api
if [[ -L /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi
ln -sf /etc/nginx/sites-available/raqat-api /etc/nginx/sites-enabled/raqat-api
nginx -t
systemctl reload nginx
echo "OK: nginx → 127.0.0.1:${PORT}"

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH 2>/dev/null || true
  ufw allow "Nginx Full" 2>/dev/null || { ufw allow 80/tcp; ufw allow 443/tcp; }
  ufw --force enable 2>/dev/null || true
  echo "OK: ufw (HTTP/HTTPS ашық, тексеріңіз: ufw status)"
fi

PUBIP="$(curl -4 -sS --connect-timeout 3 ifconfig.me 2>/dev/null || true)"
cat <<EOF

==== Орындалды ====
- systemd: systemctl status raqat-platform-api
- ішкі API: http://127.0.0.1:${PORT}/ready
- HTTP (nginx): http://${PUBIP:-СЕРВЕР_IP}/health

TLS (домен DNS A-жазбасы дұрыс болса):
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d ${RAQAT_DOMAIN}

(Домен '_': тек IP бойынша HTTP; certbot керек емес болса, мобильдіке HTTPS қажет — нақты поддомен + certbot)
EOF
