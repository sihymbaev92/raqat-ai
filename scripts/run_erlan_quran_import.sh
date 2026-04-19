#!/usr/bin/env bash
# Ерлан Алимулы тексерілген JSON → global_clean.db (text_kk + provenance), содан кейін мобильді бандл.
# Алдымен data/quran_kk_verified.json қойыңыз (6224 аят; пішім: import_quran_kk_verified.py).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

JSON="${ERLAN_JSON:-$ROOT/data/quran_kk_verified.json}"
DB="${DB_PATH:-$ROOT/global_clean.db}"
PY="${PYTHON:-$ROOT/.venv/bin/python}"
if [[ ! -x "$PY" ]]; then
  PY="python3"
fi

if [[ ! -f "$JSON" ]]; then
  echo "Файл жоқ: $JSON" >&2
  echo "Толық JSON-ды осы жолға салыңыз (логотип пен лицензия бойынша). Пішім: data/quran_kk_verified.example.json және scripts/import_quran_kk_verified.py докстринг." >&2
  exit 1
fi

ATT="${ERLAN_ATTRIBUTION_KK:-Ерлан Алимулы аудармасы (тексерілген баспа)}"
DETAIL="${ERLAN_SOURCE_DETAIL:-}"

echo "=== import_quran_kk_verified.py ==="
if [[ -n "$DETAIL" ]]; then
  "$PY" scripts/import_quran_kk_verified.py --json "$JSON" --db "$DB" --attribution-kk "$ATT" --source-detail "$DETAIL"
else
  "$PY" scripts/import_quran_kk_verified.py --json "$JSON" --db "$DB" --attribution-kk "$ATT"
fi

echo "=== export_quran_kk_bundled_json.py (мобильді бандл) ==="
"$PY" scripts/export_quran_kk_bundled_json.py --db "$DB" --out "$ROOT/mobile/assets/bundled/quran-kk-from-db.json"

echo "Дайын: DB жаңартылды, quran-kk-from-db.json экспортталды."
