#!/usr/bin/env bash
# Ресми көздер: (1) koran.kz/trnc/ → quran.translit; (2) Ерлан Алимулы JSON → quran.text_kk.
# Толық мәтін JSON репоға кірмейді — data/quran_kk_verified.json жергілікті қойылады (.gitignore).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB="${DB_PATH:-$ROOT/global_clean.db}"
PY="${PYTHON:-$ROOT/.venv/bin/python}"
if [[ ! -x "$PY" ]]; then
  PY="python3"
fi

DRY=""
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY="--dry-run"
fi

echo "=== 1/2 Транскрипция: koran.kz/trnc/ → translit (DB=$DB) ==="
"$PY" scripts/import_quran_translit_koran_kz.py --db "$DB" $DRY

VERIFIED="$ROOT/data/quran_kk_verified.json"
if [[ -f "$VERIFIED" ]]; then
  echo ""
  echo "=== 2/2 Қазақша мағына: import_quran_kk_verified.py ($VERIFIED) ==="
  "$PY" scripts/import_quran_kk_verified.py --json "$VERIFIED" --db "$DB" $DRY
else
  echo ""
  echo "=== 2/2 өткізілді: $VERIFIED жоқ ==="
  echo "Ерлан Алимулы тексерілген 6224 аят JSON-ын осы жолға қойыңыз (пішім: scripts/import_quran_kk_verified.py докстринг)."
  echo "Мысал құрылымы: data/quran_kk_verified.example.json"
fi

echo ""
echo "Дайын."
