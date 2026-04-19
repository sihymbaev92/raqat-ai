#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SOURCE="${1:?usage: auto_resume_hadith_review.sh <source> <from_id> <to_id> <log_file>}"
FROM_ID="${2:?usage: auto_resume_hadith_review.sh <source> <from_id> <to_id> <log_file>}"
TO_ID="${3:?usage: auto_resume_hadith_review.sh <source> <from_id> <to_id> <log_file>}"
LOG_FILE="${4:?usage: auto_resume_hadith_review.sh <source> <from_id> <to_id> <log_file>}"

mkdir -p "$(dirname "$LOG_FILE")"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export AI_MODEL_CANDIDATES="${AI_MODEL_CANDIDATES:-gemini-2.5-flash,gemini-2.5-flash-lite}"

while true; do
  {
    echo
    echo "[$(date -Is)] START source=${SOURCE} from=${FROM_ID} to=${TO_ID}"
  } >>"$LOG_FILE"

  if .venv/bin/python translate_hadith_kk_batch.py \
    --source "$SOURCE" \
    --from-id "$FROM_ID" \
    --to-id "$TO_ID" \
    --review-only \
    --review-limit 5000 \
    --sleep 0.1 \
    --max-retries 0 \
    --retry-delay 1 \
    >>"$LOG_FILE" 2>&1; then
    echo "[$(date -Is)] DONE source=${SOURCE} from=${FROM_ID} to=${TO_ID}" >>"$LOG_FILE"
    break
  fi

  echo "[$(date -Is)] RETRY in 20s source=${SOURCE}" >>"$LOG_FILE"
  sleep 20
done
