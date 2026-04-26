#!/usr/bin/env bash
set -euo pipefail

# Локаль matrix smoke:
#   1) SQLite backend
#   2) PostgreSQL backend (егер PG_DSN/DATABASE_URL бар болса)
#
# Usage:
#   bash scripts/local_content_smoke_matrix.sh
#   PG_DSN=postgresql://user:pass@127.0.0.1:5432/raqat bash scripts/local_content_smoke_matrix.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PY="${ROOT}/.venv/bin/python"
[[ -x "$PY" ]] || PY="$(command -v python3)"

DB="${RAQAT_DB_PATH:-${DB_PATH:-$ROOT/global_clean.db}}"
API_BASE="http://127.0.0.1:8787"
PG_DSN="${PG_DSN:-${DATABASE_URL:-}}"

run_api() {
  (
    cd "$ROOT/platform_api"
    nohup "$PY" -m uvicorn main:app --host 127.0.0.1 --port 8787 >/tmp/raqat_api_local_smoke.log 2>&1 &
    echo $! > /tmp/raqat_api_local_smoke.pid
  )
  local pid
  pid="$(cat /tmp/raqat_api_local_smoke.pid)"
  for _ in $(seq 1 20); do
    if "$PY" - <<'PY' >/dev/null 2>&1
import urllib.request
urllib.request.urlopen("http://127.0.0.1:8787/health", timeout=2)
PY
    then
      echo "$pid"
      return 0
    fi
    sleep 1
  done
  echo "$pid"
  return 1
}

stop_api() {
  local pid="$1"
  kill "$pid" >/dev/null 2>&1 || true
  sleep 1
}

echo "== [1/2] SQLite smoke =="
unset DATABASE_URL
RAQAT_DB_PATH="$DB" DB_PATH="$DB" "$PY" -c "import os; from db.migrations import run_schema_migrations; run_schema_migrations(os.environ['RAQAT_DB_PATH'])"
# Startup smoke: схема үйлесімділігі (quran/hadith минимал бағандары + info warnings)
"$PY" scripts/check_schema_compat.py --db "$DB"
pid="$(run_api)" || { echo "API startup failed (sqlite)"; exit 2; }
"$PY" scripts/validate_content_release.py --api-base "$API_BASE"
stop_api "$pid"
echo "SQLite smoke OK"

if [[ -z "$PG_DSN" ]]; then
  echo "== [2/2] PostgreSQL smoke skipped (PG_DSN/DATABASE_URL empty) =="
  exit 0
fi

echo "== [2/2] PostgreSQL smoke =="
export DATABASE_URL="$PG_DSN"
"$PY" - <<'PY'
import os, psycopg
dsn = os.environ["DATABASE_URL"]
with psycopg.connect(dsn) as con:
    with con.cursor() as cur:
        cur.execute("""
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS quran (
  id BIGINT PRIMARY KEY,
  surah INTEGER NOT NULL,
  ayah INTEGER NOT NULL,
  surah_name TEXT,
  text_ar TEXT,
  text_kk TEXT,
  text_ru TEXT,
  text_en TEXT,
  translit TEXT,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS hadith (
  id BIGINT PRIMARY KEY,
  source TEXT,
  text_ar TEXT,
  text_kk TEXT,
  text_ru TEXT,
  text_en TEXT,
  grade TEXT,
  updated_at TEXT
);
""")
    con.commit()
PY
pid="$(run_api)" || { echo "API startup failed (postgresql)"; exit 3; }
"$PY" scripts/validate_content_release.py --api-base "$API_BASE"
stop_api "$pid"
echo "PostgreSQL smoke OK"

echo "All local matrix smoke checks passed."
