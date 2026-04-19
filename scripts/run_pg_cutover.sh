#!/usr/bin/env bash
set -euo pipefail

# SQLite -> PostgreSQL cutover wrapper.
# Аяқтағаннан кейін түбір .env ішінде DATABASE_URL / DATABASE_URL_WRITER = сол PG_DSN.
#
#   --validate-only  — audit + migrate --validate-only (көшірмесіз; PG-да дерек бар деп)
#   --apply | (default) — audit + backup + migrate + validate-only қайта жүргізу
#
# Usage:
#   export PG_DSN='postgresql://user:pass@host:5432/dbname'
#   bash scripts/run_pg_cutover.sh --validate-only
#   bash scripts/run_pg_cutover.sh
#   bash scripts/run_pg_cutover.sh --apply

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PY="${ROOT}/.venv/bin/python"
[[ -x "$PY" ]] || PY="$(command -v python3)"

MODE="apply"
for arg in "$@"; do
  case "$arg" in
    --validate-only) MODE="validate-only" ;;
    --apply) MODE="apply" ;;
  esac
done

SQLITE_DB="${RAQAT_DB_PATH:-${DB_PATH:-${ROOT}/global_clean.db}}"
PG_DSN="${PG_DSN:-${DATABASE_URL_WRITER:-${DATABASE_URL:-}}}"

if [[ -z "$PG_DSN" ]]; then
  echo "[error] PG_DSN/DATABASE_URL(_WRITER) бос."
  echo "Мысал: export PG_DSN='postgresql://user:pass@host:5432/dbname'"
  exit 2
fi

if [[ ! -f "$SQLITE_DB" ]]; then
  echo "[error] SQLite табылмады: $SQLITE_DB"
  exit 2
fi

mkdir -p .logs
STAMP="$(date +%Y%m%d_%H%M%S)"
LOG=".logs/pg_cutover_${STAMP}.log"

if [[ "$MODE" == "validate-only" ]]; then
  {
    echo "[validate-only] SQL placeholder audit"
    "$PY" scripts/audit_sql_placeholders.py
    echo
    echo "[validate-only] Row-count / sample validation (no copy)"
    "$PY" scripts/migrate_sqlite_to_postgres.py \
      --sqlite "$SQLITE_DB" \
      --pg-dsn "$PG_DSN" \
      --validate-only
    echo "[done] validate-only finished."
  } | tee "$LOG"
  echo "Log: $LOG"
  exit 0
fi

{
  echo "[1/4] SQL placeholder audit"
  "$PY" scripts/audit_sql_placeholders.py

  echo
  echo "[2/4] SQLite backup"
  bash scripts/backup_sqlite.sh

  echo
  echo "[3/4] SQLite -> PostgreSQL migrate"
  "$PY" scripts/migrate_sqlite_to_postgres.py \
    --sqlite "$SQLITE_DB" \
    --pg-dsn "$PG_DSN" \
    --bootstrap-ddl \
    --with-quran-hadith \
    --validate

  echo
  echo "[4/4] Validate-only rerun"
  "$PY" scripts/migrate_sqlite_to_postgres.py \
    --sqlite "$SQLITE_DB" \
    --pg-dsn "$PG_DSN" \
    --validate-only

  echo
  echo "[done] Cutover workflow finished."
} | tee "$LOG"

echo "Log: $LOG"
