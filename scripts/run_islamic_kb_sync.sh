#!/usr/bin/env bash
# VPS/cron: Fatua + Muftyat → data/islamic_kb.sqlite3 (күніне 2 рет: install_islamic_kb_cron_twice_daily.sh)
# Мысал: ./scripts/run_islamic_kb_sync.sh --site all --max 80
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

VENV_PY="${RAQAT_VENV_PYTHON:-$ROOT/platform_api/.venv/bin/python}"
if [[ ! -x "$VENV_PY" ]]; then
  VENV_PY="${PYTHON:-python3}"
fi

exec "$VENV_PY" "$ROOT/scripts/sync_islamic_kb.py" "$@"
