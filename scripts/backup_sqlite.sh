#!/usr/bin/env bash
# SQLite global_clean.db (немесе RAQAT_DB_PATH) сақтық көшірмесі — cron түнгі.
# Мысал: bash scripts/backup_sqlite.sh
# Нәтиже: backups/global_clean_YYYYMMDD_HHMMSS.db
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="${RAQAT_DB_PATH:-${DB_PATH:-$ROOT/global_clean.db}}"
OUT="${RAQAT_BACKUP_DIR:-$ROOT/backups}"
mkdir -p "$OUT"

if [[ ! -f "$DB" ]]; then
  echo "ERR DB табылмады: $DB" >&2
  exit 1
fi

TS=$(date +%Y%m%d_%H%M%S)
DEST="$OUT/global_clean_${TS}.db"
cp -a "$DB" "$DEST"
echo "OK  Сақталды: $DEST ($(wc -c <"$DEST" | tr -d ' ') bytes)"

# Сақтау санын шектеу (соңғы 14 файл)
ls -1t "$OUT"/global_clean_*.db 2>/dev/null | tail -n +15 | xargs -r rm -f

exit 0
