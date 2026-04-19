#!/usr/bin/env bash
# Safe resume for hadith -> Kazakh translation.
# - Loads .env
# - Forces modern model candidates
# - Uses conservative retries/sleep to reduce transient failures
# - Supports resume via --from-id
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export AI_MODEL_CANDIDATES="${AI_MODEL_CANDIDATES:-gemini-2.5-flash,gemini-2.5-flash-lite}"

FROM_ID="${FROM_ID:-0}"
LIMIT="${LIMIT:-0}"
SLEEP_SEC="${SLEEP_SEC:-4.0}"
RETRY_DELAY="${RETRY_DELAY:-12.0}"
MAX_RETRIES="${MAX_RETRIES:-4}"
MAX_ERRORS="${MAX_ERRORS:-20}"
# Алдымен соңғы аудармаларды тексеру+түзету (Gemini JSON). Өшірмек: HADITH_REVIEW_LIMIT=0
REVIEW_LIMIT="${HADITH_REVIEW_LIMIT:-400}"

exec .venv/bin/python translate_hadith_kk_batch.py \
  --db "${HADITH_DB:-$ROOT/global_clean.db}" \
  --bukhari-muslim \
  --from-id "$FROM_ID" \
  --limit "$LIMIT" \
  --review-limit "$REVIEW_LIMIT" \
  --sleep "$SLEEP_SEC" \
  --retry-delay "$RETRY_DELAY" \
  --max-retries "$MAX_RETRIES" \
  --max-errors "$MAX_ERRORS" \
  --backup \
  "$@"

