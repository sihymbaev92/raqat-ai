#!/usr/bin/env bash
# Құран бандл JSON-дарын api.alquran.cloud жаңарту үшін (интернет қажет)
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/assets/bundled"
mkdir -p "$DIR"
curl -sS "https://api.alquran.cloud/v1/surah" -o "$DIR/surah-list-api.json"
curl -sS "https://api.alquran.cloud/v1/quran/quran-uthmani" -o "$DIR/quran-uthmani-full.json"
curl -sS "https://api.alquran.cloud/v1/quran/en.transliteration" -o "$DIR/quran-en-transliteration-full.json"
echo "OK: $DIR (surah list + Uthmani + en.transliteration)"
