#!/usr/bin/env bash
# scraped_hadith.sqlite3 → VPS (AI/RAG резерв, кейін API)
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f "${REPO_ROOT}/.env.deploy" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/.env.deploy"
  set +a
fi

HOST="${RAQAT_VPS_HOST:-5.75.162.140}"
USER="${RAQAT_VPS_USER:-root}"
REMOTE_ROOT="${RAQAT_VPS_ROOT:-/opt/raqat-ai}"
SSH_EXTRA="${RAQAT_VPS_SSH_OPTS:--o StrictHostKeyChecking=accept-new}"
TARGET="${USER}@${HOST}"
LOCAL_DB="${REPO_ROOT}/data/hadith_scrape.sqlite3"
LOCAL_JSON="${REPO_ROOT}/mobile/assets/bundled/scraped-hadith-muftyat.json"

if [[ ! -f "$LOCAL_DB" ]]; then
  echo "ERROR: $LOCAL_DB жоқ" >&2
  exit 1
fi

echo "== export mobile bundle =="
python scripts/export_scraped_hadith_mobile.py

echo "== scp hadith_scrape.sqlite3 + bundled JSON → VPS =="
# shellcheck disable=SC2206
ssh $SSH_EXTRA -o BatchMode=yes "$TARGET" "mkdir -p '${REMOTE_ROOT}/data' '${REMOTE_ROOT}/mobile/assets/bundled'"
# shellcheck disable=SC2206
scp $SSH_EXTRA -o BatchMode=yes "$LOCAL_DB" "${TARGET}:${REMOTE_ROOT}/data/hadith_scrape.sqlite3"
# shellcheck disable=SC2206
scp $SSH_EXTRA -o BatchMode=yes "$LOCAL_JSON" "${TARGET}:${REMOTE_ROOT}/mobile/assets/bundled/scraped-hadith-muftyat.json"

# shellcheck disable=SC2206
ssh $SSH_EXTRA "$TARGET" "ls -la '${REMOTE_ROOT}/data/hadith_scrape.sqlite3' '${REMOTE_ROOT}/mobile/assets/bundled/scraped-hadith-muftyat.json'"
echo "Дайын. (API endpoint — кейінгі фаза; мобиль офлайн бандл дайын.)"
