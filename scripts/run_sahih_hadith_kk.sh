#!/usr/bin/env bash
# Сахих әл-Бұхари → Сахих Муслим кезегімен text_kk толтыру (қазақ кирилл).
# Ұзақ: мыңдаған сұрау. Желіде орындаңыз: .env ішінде GEMINI_API_KEY болуы керек.
# Параллель (мысалы 4 процесс): ... --workers 4 --sleep 1 "$@"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
exec .venv/bin/python translate_hadith_kk_batch.py \
  --db "${HADITH_DB:-$ROOT/global_clean.db}" \
  --bukhari-muslim \
  --backup \
  --sleep "${SAHIH_HADITH_SLEEP:-2.5}" \
  "$@"
