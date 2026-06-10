#!/usr/bin/env bash
# Muftyat.kz + Fatua.kz — хадис/риуаят үзінділерін scraped_hadith SQLite-қа.
# Ресми рұқсат: docs/operations/kmdmb-official-content-license-kk.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PY="${PYTHON:-python3}"
DB="${RAQAT_HADITH_SCRAPE_DB:-$ROOT/data/hadith_scrape.sqlite3}"
DELAY="${RAQAT_HADITH_SCRAPE_DELAY_SEC:-1.5}"
PAGES="${RAQAT_HADITH_SCRAPE_MAX_PAGES:-30}"
MAX_URLS="${RAQAT_HADITH_SCRAPE_MAX_URLS:-0}"
HADITH_ONLY="${RAQAT_HADITH_SCRAPE_HADITH_ONLY:-0}"

extra=()
if [[ "$HADITH_ONLY" == "1" ]]; then
  extra+=(--hadith-only)
fi
if [[ "$MAX_URLS" != "0" ]]; then
  extra+=(--max-urls "$MAX_URLS")
fi

echo "== Muftyat crawl =="
"$PY" scripts/scrape_hadith_kk.py crawl --site muftyat --max-pages "$PAGES" --delay "$DELAY" "${extra[@]}"

echo "== Fatua crawl =="
"$PY" scripts/scrape_hadith_kk.py crawl --site fatua --max-pages "$PAGES" --delay "$DELAY" "${extra[@]}"

echo "== stats =="
"$PY" scripts/scrape_hadith_kk.py stats --db "$DB"

echo "== export mobile bundle =="
"$PY" scripts/export_scraped_hadith_mobile.py --db "$DB" --out "$ROOT/mobile/assets/bundled/scraped-hadith-muftyat.json"
