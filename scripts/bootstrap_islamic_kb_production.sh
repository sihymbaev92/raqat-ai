#!/usr/bin/env bash
# Production: Islamic KB .env + бір рет толық sync + cron (күніне 2× incremental, жексенбі full).
# VPS: bash scripts/bootstrap_islamic_kb_production.sh
# Жергілікті: RAQAT_ENV_FILE=.env bash scripts/bootstrap_islamic_kb_production.sh --skip-full
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV="${RAQAT_ENV_FILE:-$ROOT/.env}"
SKIP_FULL=0
for arg in "$@"; do
  case "$arg" in
    --skip-full) SKIP_FULL=1 ;;
  esac
done

set_kv() {
  local key="$1" val="$2"
  if [[ ! -f "$ENV" ]]; then
    touch "$ENV"
  fi
  if grep -q "^${key}=" "$ENV" 2>/dev/null; then
    sed -i.bak-kb-bootstrap "s|^${key}=.*|${key}=${val}|" "$ENV"
    rm -f "${ENV}.bak-kb-bootstrap"
  else
    echo "${key}=${val}" >>"$ENV"
  fi
}

echo "== Patch $ENV (Islamic KB production) =="
cp -a "$ENV" "${ENV}.bak-bootstrap-$(date +%Y%m%d-%H%M%S)" 2>/dev/null || touch "$ENV"

set_kv "RAQAT_ISLAMIC_KB_ENABLED" "1"
set_kv "RAQAT_ISLAMIC_KB_OFFICIAL_LICENSE" "1"
set_kv "RAQAT_ISLAMIC_KB_DB_PATH" "${ROOT}/data/islamic_kb.sqlite3"
set_kv "RAQAT_ISLAMIC_KB_SOURCES" "fatua,muftyat"
set_kv "RAQAT_ISLAMIC_KB_TOP_K" "5"
set_kv "RAQAT_ISLAMIC_KB_MAX_CONTEXT_CHARS" "9000"
set_kv "RAQAT_ISLAMIC_KB_SYNC_MAX_URLS" "500"
set_kv "RAQAT_ISLAMIC_KB_FETCH_DELAY_SEC" "1.0"
set_kv "RAQAT_ISLAMIC_KB_EXCERPT_CHARS" "1200"
set_kv "RAQAT_ISLAMIC_KB_MAX_LISTING_PAGES" "200"
set_kv "RAQAT_AI_KB_ONLY" "1"
set_kv "RAQAT_AI_ENABLE_GOOGLE_SEARCH" "0"
set_kv "RAQAT_AI_PIPELINE_STAGES" "0"

mkdir -p "${ROOT}/data" "${ROOT}/.logs"

set -a
# shellcheck disable=SC1090
source "$ENV"
set +a

VENV_PY="${RAQAT_VENV_PYTHON:-$ROOT/platform_api/.venv/bin/python}"
if [[ ! -x "$VENV_PY" ]]; then
  VENV_PY="${ROOT}/.venv/bin/python"
fi
if [[ ! -x "$VENV_PY" ]]; then
  VENV_PY="python3"
fi

if [[ "$SKIP_FULL" -eq 0 ]]; then
  echo "== Full sync (OFFICIAL_LICENSE; ~10k URL max) =="
  "$VENV_PY" "$ROOT/scripts/sync_islamic_kb.py" --site all --full
else
  echo "== Skip --full (incremental only) =="
  "$VENV_PY" "$ROOT/scripts/sync_islamic_kb.py" --site all --max "${RAQAT_ISLAMIC_KB_SYNC_MAX_URLS:-500}"
fi

echo "== Install cron (2×/day incremental + Sunday full) =="
bash "$ROOT/scripts/install_islamic_kb_cron_twice_daily.sh"
bash "$ROOT/scripts/install_islamic_kb_cron_weekly_full.sh"

echo "== KB stats =="
"$VENV_PY" -c "
import sys
sys.path.insert(0, 'platform_api')
from islamic_kb.db import kb_stats
print(kb_stats())
"

echo ""
echo "OK: Islamic KB production bootstrap done."
echo "  Restart API: systemctl restart raqat-platform-api  (VPS)"
echo "  Check: curl -s http://127.0.0.1:8000/api/v1/ai/kb/status"
