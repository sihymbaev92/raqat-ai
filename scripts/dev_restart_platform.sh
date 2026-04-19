#!/usr/bin/env bash
# Локальды: схема миграциясы + platform_api (8787) фонда; ботты опциямен бір терминалда.
#
# Мысалдар:
#   bash scripts/dev_restart_platform.sh
#   RAQAT_DEV_KILL_API_PORT=0 bash scripts/dev_restart_platform.sh   # 8787 бос емес болса
#   RAQAT_DEV_START_BOT=1 bash scripts/dev_restart_platform.sh       # API + бот бір скриптте
#
# Орта: .env жүктелмейді — systemd/docker сияқты сырттан орнатыңыз немесе `set -a; source .env; set +a`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Өндіріс/локальды DSN (postgresql) және API кілттері үшін .env бар болса жүктеледі.
if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

PY="${ROOT}/.venv/bin/python"
[[ -x "$PY" ]] || PY="$(command -v python3)"

export RAQAT_DB_PATH="${RAQAT_DB_PATH:-${ROOT}/global_clean.db}"
export DB_PATH="${DB_PATH:-$RAQAT_DB_PATH}"

if [[ "${RAQAT_DEV_KILL_API_PORT:-1}" == "1" ]] && command -v fuser >/dev/null 2>&1; then
  fuser -k 8787/tcp 2>/dev/null || true
fi

"$PY" -c "import os; from db.migrations import run_schema_migrations; run_schema_migrations(os.environ['RAQAT_DB_PATH'])"

mkdir -p "${ROOT}/.logs"
API_LOG="${ROOT}/.logs/platform_api.log"

(
  cd "${ROOT}/platform_api"
  nohup "$PY" -m uvicorn main:app --host 0.0.0.0 --port 8787 >>"$API_LOG" 2>&1 &
  echo $! >"${ROOT}/.logs/platform_api.pid"
)

sleep 1
if command -v curl >/dev/null 2>&1; then
  if curl -sf "http://127.0.0.1:8787/health" >/dev/null; then
    echo "API /health OK"
  else
    echo "API /health сәтсіз — журнал: ${API_LOG}"
  fi
else
  echo "curl жоқ — /health тексерілмеді"
fi

echo "Platform API: http://127.0.0.1:8787/docs (PID $(cat "${ROOT}/.logs/platform_api.pid"))"
echo "Бот екінші терминалда: cd ${ROOT} && $PY bot_main.py"
echo "Бір скриптте бот + API: RAQAT_DEV_START_BOT=1 $0"

if [[ "${RAQAT_DEV_START_BOT:-0}" == "1" ]]; then
  exec "$PY" "${ROOT}/bot_main.py"
fi
