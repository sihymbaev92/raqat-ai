#!/usr/bin/env bash
# VPS: GEMINI_API_KEY ауыстыру (.env) + тексеру + systemd restart
set -euo pipefail
ROOT="${RAQAT_ROOT:-/opt/raqat-ai}"
cd "$ROOT"

NEW_KEY="${1:-}"
if [[ -z "$NEW_KEY" ]]; then
  if [[ -f "${ROOT}/.env.bak-gemini" ]]; then
    NEW_KEY="$(grep -m1 '^GEMINI_API_KEY=' "${ROOT}/.env.bak-gemini" | cut -d= -f2- | sed 's/[[:space:]]*#.*//' | tr -d '"' | tr -d "'" | xargs)"
    echo "Кілт аргументсіз: .env.bak-gemini бірінші жолы қолданылады"
  else
    echo "Қолдану: $0 <жаңа_GEMINI_API_KEY>" >&2
    echo "Немесе .env.bak-gemini қойыңыз" >&2
    exit 1
  fi
fi

cp -a "${ROOT}/.env" "${ROOT}/.env.bak-$(date +%Y%m%d-%H%M%S)"
if grep -q '^GEMINI_API_KEY=' "${ROOT}/.env"; then
  sed -i "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=${NEW_KEY}|" "${ROOT}/.env"
else
  echo "GEMINI_API_KEY=${NEW_KEY}" >>"${ROOT}/.env"
fi
# Қосарланған GEMINI жолдарын жою
awk '!($0 ~ /^GEMINI_API_KEY=/ && seen++)' "${ROOT}/.env" >"${ROOT}/.env.tmp" && mv "${ROOT}/.env.tmp" "${ROOT}/.env"

echo "== Тексеру =="
if [[ -x "${ROOT}/check-gemini.sh" ]]; then
  bash "${ROOT}/check-gemini.sh"
elif [[ -f "${ROOT}/platform_api/scripts/check_gemini_key.py" ]]; then
  "${ROOT}/.venv/bin/python" "${ROOT}/platform_api/scripts/check_gemini_key.py"
else
  echo "check скрипт табылмады" >&2
  exit 1
fi

echo "== Қайта іске қосу =="
for svc in raqat-platform-api raqat-celery-worker; do
  if systemctl list-unit-files "${svc}.service" &>/dev/null; then
    systemctl restart "${svc}" && echo "restarted ${svc}"
  fi
done
if pgrep -f "${ROOT}/bot_main.py" >/dev/null; then
  pkill -f "${ROOT}/bot_main.py" || true
  sleep 2
  nohup "${ROOT}/.venv/bin/python" "${ROOT}/bot_main.py" >>"${ROOT}/.logs/bot_main.log" 2>&1 &
  echo "bot restarted"
fi

curl -fsS http://127.0.0.1:8000/health >/dev/null && echo "health OK" || curl -fsS http://127.0.0.1:8787/health >/dev/null && echo "health OK (8787)"
echo "Дайын."
