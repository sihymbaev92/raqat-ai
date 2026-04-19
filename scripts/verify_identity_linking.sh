#!/usr/bin/env bash
set -euo pipefail

# Бот ↔ API ↔ тарих flow тексеруі (identity linking end-to-end)
# 1) /auth/link/telegram
# 2) /ai/chat (mock арқылы dev_verify_platform_flow.py ішінде)
# 3) /users/me/history
#
# Usage:
#   bash scripts/verify_identity_linking.sh
#   TG_TEST_USER_ID=777000001 bash scripts/verify_identity_linking.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PY="${ROOT}/.venv/bin/python"
[[ -x "$PY" ]] || PY="$(command -v python3)"

DB="${RAQAT_DB_PATH:-${DB_PATH:-${ROOT}/global_clean.db}}"
TG_TEST_USER_ID="${TG_TEST_USER_ID:-987654321}"

if [[ ! -f "$DB" ]]; then
  echo "[error] SQLite табылмады: $DB"
  exit 2
fi

echo "[run] dev_verify_platform_flow.py"
"$PY" scripts/dev_verify_platform_flow.py --db "$DB" --telegram-user-id "$TG_TEST_USER_ID"

echo "[ok] Identity linking flow verified."
