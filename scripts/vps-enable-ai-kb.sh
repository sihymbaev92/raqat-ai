#!/usr/bin/env bash
# VPS: Gemini + Islamic KB тексеру және бірінші sync (Fatua/Muftyat).
# Пайдалану:
#   cd /opt/raqat-ai && git pull
#   nano .env   # GEMINI_API_KEY=... және төмендегі RAQAT_ISLAMIC_KB_* қосыңыз
#   bash scripts/vps-enable-ai-kb.sh
#   sudo systemctl restart raqat-platform-api   # өз сервис атауыңыз
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

API_BASE="${RAQAT_SMOKE_API_BASE:-http://127.0.0.1:8787}"
API_BASE="${API_BASE%/}"

echo "== RAQAT VPS AI + Islamic KB =="
echo "Repo: $ROOT"

if [[ -z "${GEMINI_API_KEY:-}" ]] && [[ -z "${RAQAT_GEMINI_API_KEY:-}" ]]; then
  echo "ERROR: .env ішінде GEMINI_API_KEY жоқ."
  echo "  https://aistudio.google.com/apikey → GEMINI_API_KEY=... қосыңыз"
  exit 1
fi
echo "OK: GEMINI_API_KEY орнатылған"

if [[ "${RAQAT_ISLAMIC_KB_ENABLED:-0}" != "1" ]]; then
  echo "WARN: RAQAT_ISLAMIC_KB_ENABLED=1 қойылмаған — Fatua/Muftyat RAG өшік"
fi

DB_PATH="${RAQAT_ISLAMIC_KB_DB_PATH:-${ROOT}/data/islamic_kb.sqlite3}"
mkdir -p "$(dirname "$DB_PATH")"

if [[ "${RAQAT_ISLAMIC_KB_ENABLED:-0}" == "1" ]]; then
  echo "== Islamic KB sync (бірінші рет ұзақ болуы мүмкін) =="
  if [[ -f "${ROOT}/platform_api/.venv/bin/python" ]]; then
    PY="${ROOT}/platform_api/.venv/bin/python"
  else
    PY=python3
  fi
  "$PY" "${ROOT}/scripts/sync_islamic_kb.py" --site all --max "${RAQAT_ISLAMIC_KB_SYNC_MAX_URLS:-120}" || true
  echo "(Толық ресми sync: RAQAT_ISLAMIC_KB_OFFICIAL_LICENSE=1 $PY scripts/sync_islamic_kb.py --site all --full)"
fi

echo "== API smoke =="
if ! curl -sf "${API_BASE}/health" >/dev/null; then
  echo "ERROR: API жауап бермейді: ${API_BASE}/health"
  echo "  uvicorn/systemd іске қосылғанын тексеріңіз"
  exit 1
fi
curl -sS "${API_BASE}/health" | head -c 200
echo ""

KB="$(curl -sS "${API_BASE}/api/v1/ai/kb/status" 2>/dev/null || echo '{}')"
if echo "$KB" | grep -q '"enabled":true'; then
  echo "OK: Islamic KB: $KB" | head -c 400
  echo ""
else
  echo "WARN: /api/v1/ai/kb/status жоқ немесе enabled=false — кодты git pull + API restart қажет"
  echo "  Response: $KB"
fi

echo "== AI chat (қысқа) =="
CHAT="$(curl -sS -f --connect-timeout 90 -X POST "${API_BASE}/api/v1/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Сәлем","detail_level":"quick"}' 2>/dev/null || echo '{}')"
if echo "$CHAT" | grep -q '"text"'; then
  echo "OK: AI жауап берді"
  echo "$CHAT" | head -c 300
  echo ""
else
  echo "ERROR: AI жауап жоқ — GEMINI кілті/квота немесе ескі API коды"
  echo "$CHAT" | head -c 500
  exit 1
fi

echo ""
echo "Дайын. Мобильді: EXPO_PUBLIC_RAQAT_API_BASE=<сіздің VPS HTTPS/HTTP>"
