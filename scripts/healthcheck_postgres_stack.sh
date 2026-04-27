#!/usr/bin/env bash
# PostgreSQL + platform_api + bot quick health
# Usage:
#   bash scripts/healthcheck_postgres_stack.sh
#   API_BASE=http://127.0.0.1:8787 PG_DSN=postgresql://... bash scripts/healthcheck_postgres_stack.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi
API_BASE="${API_BASE:-${RAQAT_PLATFORM_API_BASE:-http://127.0.0.1:8787}}"
API_BASE="${API_BASE%/}"
PG_DSN="${PG_DSN:-${DATABASE_URL:-}}"
ERR=0

echo "== RAQAT PostgreSQL stack health $(date -Iseconds) =="

if [[ -n "$PG_DSN" ]]; then
  if command -v psql >/dev/null 2>&1; then
    if PGPASSWORD="" psql "$PG_DSN" -Atqc "SELECT 1" >/dev/null 2>&1; then
      echo "OK   PostgreSQL: SELECT 1"
    else
      echo "ERR  PostgreSQL: SELECT 1 failed (DSN/ACL/network)"
      ERR=1
    fi
  else
    echo "WARN PostgreSQL: psql not found, DB direct check skipped"
  fi
else
  echo "WARN PostgreSQL: PG_DSN/DATABASE_URL is empty"
fi

if command -v curl >/dev/null 2>&1; then
  ready_json="$(curl -sS --connect-timeout 3 "${API_BASE}/ready" || true)"
  if [[ -n "$ready_json" ]]; then
    echo "INFO API /ready: $ready_json"
    if echo "$ready_json" | tr '[:upper:]' '[:lower:]' | grep -q '"backend":"postgresql"'; then
      echo "OK   API backend: postgresql"
    else
      echo "WARN API backend is not postgresql"
      ERR=1
    fi
    if echo "$ready_json" | tr '[:upper:]' '[:lower:]' | grep -q '"ok":true'; then
      echo "OK   API readiness: ok=true"
    else
      echo "ERR  API readiness: ok!=true"
      ERR=1
    fi
  else
    echo "ERR  API: /ready unreachable at ${API_BASE}"
    ERR=1
  fi
else
  echo "WARN curl not found, API checks skipped"
fi

if pgrep -f "bot_main.py" >/dev/null 2>&1; then
  echo "OK   Bot process: running"
else
  echo "WARN Bot process: not found"
fi

exit "$ERR"
