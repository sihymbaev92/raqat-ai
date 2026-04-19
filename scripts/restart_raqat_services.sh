#!/usr/bin/env bash
# platform_api (8787) + Telegram ботты түбір .env бойынша қайта іске қосу.
# Ескерту: бір BOT_TOKEN үшін тек бір polling процесс болуы керек (басқа VPS-та ботты тоқтатыңыз).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

echo "== platform_api =="
bash "${ROOT}/scripts/dev_restart_platform.sh"

echo "== bot (бір данасы) =="
pkill -f "${ROOT}/bot_main.py" 2>/dev/null || true
sleep 2
mkdir -p "${ROOT}/.logs"
nohup "${ROOT}/.venv/bin/python" "${ROOT}/bot_main.py" >>"${ROOT}/.logs/bot_main.log" 2>&1 &
echo $! >"${ROOT}/.logs/bot_main.pid"
sleep 2
echo "bot PID: $(cat "${ROOT}/.logs/bot_main.pid")"
tail -5 "${ROOT}/.logs/bot_main.log" || true
