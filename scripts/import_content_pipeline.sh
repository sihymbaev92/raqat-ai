#!/usr/bin/env bash
# Құран/хадис және схема: дереккөз файлдарыңызбен бірге іске қосыңыз.
# Репода толық корпус әрдайым болмауы мүмкін — JSON/скрипт параметрлерін толтырыңыз.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
DB="${RAQAT_DB_PATH:-${DB_PATH:-$ROOT/global_clean.db}}"
export RAQAT_DB_PATH="$DB"
export DB_PATH="$DB"

echo "== 1) Схема миграциялары =="
python -c "import os; from db.migrations import run_schema_migrations; run_schema_migrations(os.environ['RAQAT_DB_PATH'])"

echo
echo "== 2) Құран / хадис — қолмен дереккөз =="
echo "Мысалдар (файл жолдарын өзгертіңіз):"
echo "  python scripts/hadith_corpus_sync.py import-json --db \"$DB\" --input ./hadith-from-db.json"
echo "  python scripts/import_hadith_from_open_sources.py --db \"$DB\" --books bukhari,muslim --replace --i-understand"
echo "    (бос кесте немесе алдымен көшірме; ашық hadith-api CDN — араб + en + ru)"
echo "  python scripts/import_quran_translit_json.py --help"
echo "  python scripts/import_quran_kk_verified.py --help"
echo
echo "DB: $DB"
echo "Кейін: python scripts/dev_verify_platform_flow.py"
echo
echo "== 3) Толық көшіру: SQLite → PostgreSQL (quran + hadith COPY) =="
echo "  PG_DSN=postgresql://user:pass@127.0.0.1:5432/raqat bash scripts/copy_quran_hadith_full.sh"
echo "  (немесе migrate_sqlite_to_postgres.py — толығырақ docs/MIGRATION_SQLITE_TO_POSTGRES.md)"
