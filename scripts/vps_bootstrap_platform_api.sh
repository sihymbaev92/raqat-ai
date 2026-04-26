#!/usr/bin/env bash
# Ubuntu VPS: Redis (apt) + platform_api venv + /health сынақ.
# Пайдалану (root, репо /opt/raqat болуы керек):
#   curl -O ...  немесе  git pull  →  cd /opt/raqat
#   chmod +x scripts/vps_bootstrap_platform_api.sh
#   sudo RAQAT_ROOT=/opt/raqat bash scripts/vps_bootstrap_platform_api.sh
#
# Жүктелмейді: .env (түбірде /opt/raqat/.env өзіңіз қойыңыз), Docker/Postgres.
set -euo pipefail

RAQAT_ROOT="${RAQAT_ROOT:-/opt/raqat}"
PORT="${PORT:-8787}"
API_DIR="${RAQAT_ROOT}/platform_api"
REQ="${API_DIR}/requirements.txt"
MAIN="${API_DIR}/main.py"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "root керек: sudo bash $0"
[[ -f "$MAIN" ]] || die "код жоқ: $MAIN (WinSCP арқылы ${RAQAT_ROOT} толық салыңыз)"
[[ -f "$REQ" ]] || die "жоқ: $REQ"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  ca-certificates \
  curl \
  python3 \
  python3-venv \
  python3-pip \
  redis-server

systemctl enable --now redis-server
if ! redis-cli ping 2>/dev/null | grep -q PONG; then
  die "Redis жауап бермей жатыр (redis-cli ping)"
fi
echo "OK: Redis (redis://127.0.0.1:6379/0)"

if [[ -f "${RAQAT_ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  # shellcheck source=/dev/null
  source "${RAQAT_ROOT}/.env"
  set +a
fi
: "${RAQAT_REDIS_URL:=redis://127.0.0.1:6379/0}"
export RAQAT_REDIS_URL
# Өндірісте Redis талап қойылған (main.py)
unset RAQAT_REDIS_REQUIRED 2>/dev/null || true

if [[ ! -d "${API_DIR}/.venv" ]]; then
  python3 -m venv "${API_DIR}/.venv"
fi
# shellcheck source=/dev/null
source "${API_DIR}/.venv/bin/activate"
python -m pip install -U -q pip
python -m pip install -q -r "$REQ"
echo "OK: venv + pip install"

# Ескі uvicorn-ды тоқтату (тек осы порт)
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}"/tcp 2>/dev/null || true
fi
sleep 1

cd "$API_DIR"
LOG_DIR="${RAQAT_ROOT}/.logs"
mkdir -p "$LOG_DIR"
API_LOG="${LOG_DIR}/platform_api_bootstrap.log"
nohup python -m uvicorn main:app --host 0.0.0.0 --port "${PORT}" >>"$API_LOG" 2>&1 &
echo $! >"${LOG_DIR}/platform_api.pid"
sleep 2

if curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null; then
  echo "OK: http://127.0.0.1:${PORT}/health"
  curl -sS "http://127.0.0.1:${PORT}/health" | head -c 200 || true
  echo ""
else
  echo "СІЗГЕ: /health сәтсіз (журнал: $API_LOG, PID: $(cat "${LOG_DIR}/platform_api.pid"))" >&2
  tail -40 "$API_LOG" 2>/dev/null || true
  exit 1
fi

if command -v ufw >/dev/null 2>&1; then
  ufw allow "${PORT}"/tcp >/dev/null 2>&1 || true
  echo "Ескерту: ufw мәнін тексеріңіз: ufw status"
fi

cat <<EOF

==== Аяқталды ====
API:  http://0.0.0.0:${PORT}  (PID: $(cat "${LOG_DIR}/platform_api.pid"))
Журнал: ${API_LOG}
Systemd: ${RAQAT_ROOT}/scripts/systemd/raqat-platform-api.service.example → /etc/systemd/system/
Сырттан: curl -i http://$(curl -4 -sS ifconfig.me 2>/dev/null || echo 'СЕРВЕР_IP'):${PORT}/health
EOF
