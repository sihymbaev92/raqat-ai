#!/usr/bin/env bash
# Құран мен хадисті SQLite көзінен PostgreSQL-ке толық көшіру (COPY).
#
# Алдын ала: SQLite файлында `quran` / `hadith` кестелері толық толтырылған болуы керек
# (JSON импорт: `bash scripts/import_content_pipeline.sh`, `docs/QURAN_GPT_HANDOFF.md`).
#
# Қолдану:
#   export PG_DSN="postgresql://user:pass@127.0.0.1:5432/raqat"
#   bash scripts/copy_quran_hadith_full.sh
#
# Немесе:
#   RAQAT_DB_PATH=./global_clean.db PG_DSN="postgresql://..." bash scripts/copy_quran_hadith_full.sh
#
# Ескерту: `--truncate` мақсаттағы PG кестелерін тазалайды; өндірісте терезе таңдаңыз.
# Толығырақ: `scripts/migrate_sqlite_to_postgres.py --help`, `docs/MIGRATION_SQLITE_TO_POSTGRES.md`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SQLITE="${RAQAT_DB_PATH:-${DB_PATH:-$ROOT/global_clean.db}}"
PG_DSN="${PG_DSN:-${DATABASE_URL:-}}"

if [[ -z "$PG_DSN" ]]; then
  echo "PG_DSN немесе DATABASE_URL орнатыңыз (postgresql://...)" >&2
  exit 1
fi

if [[ ! -f "$SQLITE" ]]; then
  echo "SQLite табылмады: $SQLITE" >&2
  exit 1
fi

echo "Көз: $SQLITE"
echo "Мақсат: PostgreSQL (quran + hadith + платформа кестелері)"
echo

exec python "$ROOT/scripts/migrate_sqlite_to_postgres.py" \
  --sqlite "$SQLITE" \
  --pg-dsn "$PG_DSN" \
  --bootstrap-ddl \
  --with-quran-hadith \
  --truncate \
  --validate
