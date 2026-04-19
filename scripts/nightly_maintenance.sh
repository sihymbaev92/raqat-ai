#!/usr/bin/env bash
# Түнгі/тәуліктік: SQLite сақтық көшірме + healthcheck + content/API smoke.
# Cron мысалы: 0 3 * * * cd /path/to/raqat_bot && bash scripts/nightly_maintenance.sh
# Орта: RAQAT_DB_PATH, RAQAT_PLATFORM_API_BASE, RAQAT_LOG_DIR (әдепкі: .logs/)
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${RAQAT_LOG_DIR:-$ROOT/.logs}"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/nightly_maintenance.log"
PY="${ROOT}/.venv/bin/python"
[[ -x "$PY" ]] || PY="$(command -v python3)"
API_BASE="${RAQAT_PLATFORM_API_BASE:-http://127.0.0.1:8787}"
CONTENT_SECRET="${RAQAT_CONTENT_READ_SECRET:-}"

{
  echo "=== nightly $(date -Iseconds) ==="
  bash "$ROOT/scripts/backup_sqlite.sh" || echo "WARN: backup_sqlite сәтсіз"
  bash "$ROOT/scripts/healthcheck_raqat.sh" || echo "WARN: healthcheck non-zero"
  "$PY" "$ROOT/scripts/validate_content_release.py" --api-base "$API_BASE" \
    || echo "WARN: validate_content_release non-zero"
  "$PY" "$ROOT/scripts/smoke_bot_api_only_content.py" \
    --api-base "$API_BASE" \
    --content-secret "$CONTENT_SECRET" \
    || echo "WARN: smoke_bot_api_only_content non-zero"
} >>"$LOG" 2>&1

exit 0
