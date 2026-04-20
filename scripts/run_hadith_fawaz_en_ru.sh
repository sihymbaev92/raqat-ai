#!/usr/bin/env bash
# Интернеттен (fawazahmed0/hadith-api CDN) ағылшынша және орысша толтырады.
# Қазақша: GEMINI — translate_hadith_kk_batch.py / run_sahih_hadith_kk.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
DB="${1:-$ROOT/global_clean.db}"
PY="${PYTHON:-$ROOT/.venv/bin/python}"
if [[ ! -f "$PY" ]]; then PY="python3"; fi
"$PY" "$ROOT/scripts/fill_hadith_text_fawaz.py" --db "$DB" --target en
"$PY" "$ROOT/scripts/fill_hadith_text_fawaz.py" --db "$DB" --target ru
echo ""
echo "Қазақша (text_kk): $PY scripts/translate_hadith_kk_batch.py немесе bash scripts/run_sahih_hadith_kk.sh — GEMINI_API_KEY қажет."
echo "Мобильді бандл: cd mobile && npm run export:hadith-json"
