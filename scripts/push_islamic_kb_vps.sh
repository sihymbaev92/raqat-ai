#!/usr/bin/env bash
# Жергілікті islamic_kb.sqlite3 → VPS + .env KB айнымалылары + API restart
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
LOCAL_DB="${REPO_ROOT}/data/islamic_kb.sqlite3"

if [[ ! -f "$LOCAL_DB" ]]; then
  echo "ERROR: $LOCAL_DB жоқ — алдымен sync_islamic_kb.py" >&2
  exit 1
fi

echo "== scp islamic_kb.sqlite3 → ${TARGET}:${REMOTE_ROOT}/data/ =="
# shellcheck disable=SC2206
ssh $SSH_EXTRA -o BatchMode=yes -o ConnectTimeout=15 "$TARGET" "mkdir -p '${REMOTE_ROOT}/data'"
# shellcheck disable=SC2206
scp $SSH_EXTRA -o BatchMode=yes "$LOCAL_DB" "${TARGET}:${REMOTE_ROOT}/data/islamic_kb.sqlite3"

echo "== remote .env + restart =="
# shellcheck disable=SC2206
ssh $SSH_EXTRA "$TARGET" "bash -s" <<EOF
set -euo pipefail
cd '${REMOTE_ROOT}'
ENV='${REMOTE_ROOT}/.env'
touch "\$ENV"
upsert() {
  local k="\$1" v="\$2"
  if grep -q "^\${k}=" "\$ENV" 2>/dev/null; then
    sed -i "s|^\${k}=.*|\${k}=\${v}|" "\$ENV"
  else
    echo "\${k}=\${v}" >> "\$ENV"
  fi
}
upsert RAQAT_ISLAMIC_KB_ENABLED 1
upsert RAQAT_ISLAMIC_KB_OFFICIAL_LICENSE 1
upsert RAQAT_ISLAMIC_KB_DB_PATH ${REMOTE_ROOT}/data/islamic_kb.sqlite3
upsert RAQAT_ISLAMIC_KB_SOURCES fatua,muftyat
upsert RAQAT_ISLAMIC_KB_SYNC_MAX_URLS 10000
upsert RAQAT_ISLAMIC_KB_FETCH_DELAY_SEC 1.0
upsert RAQAT_ISLAMIC_KB_EXCERPT_CHARS 1200
ls -la data/islamic_kb.sqlite3
systemctl restart raqat-platform-api
sleep 2
curl -fsS http://127.0.0.1:8000/api/v1/ai/kb/status
echo
EOF

echo "== VPS code + cron (2×/day incremental sync) =="
# shellcheck disable=SC2206
scp $SSH_EXTRA \
  "$REPO_ROOT"/platform_api/islamic_kb/*.py \
  "${TARGET}:${REMOTE_ROOT}/platform_api/islamic_kb/"
# shellcheck disable=SC2206
scp $SSH_EXTRA \
  "$REPO_ROOT/scripts/install_islamic_kb_cron_twice_daily.sh" \
  "$REPO_ROOT/scripts/run_islamic_kb_sync.sh" \
  "${TARGET}:${REMOTE_ROOT}/scripts/"
# shellcheck disable=SC2206
ssh $SSH_EXTRA "$TARGET" "bash -s" <<EOF
set -euo pipefail
cd '${REMOTE_ROOT}'
chmod +x scripts/run_islamic_kb_sync.sh scripts/install_islamic_kb_cron_twice_daily.sh
bash scripts/install_islamic_kb_cron_twice_daily.sh
EOF

PUBLIC="${RAQAT_VPS_PUBLIC_URL:-https://api.rahatomir.com}"
if curl -fsS --connect-timeout 12 "${PUBLIC%/}/health" >/dev/null 2>&1; then
  echo "== public health OK: ${PUBLIC}/health =="
fi

echo "Дайын."
