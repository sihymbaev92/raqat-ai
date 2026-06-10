#!/usr/bin/env bash
# Жергіліктен VPS-ке deploy: rsync platform_api + scripts, содан кейін remote restart/smoke.
#
# Бірінші рет:
#   cp .env.deploy.example .env.deploy   # SSH user/host түзетіңіз
#   ssh-copy-id root@5.75.162.140
#
# Қолдану:
#   bash scripts/vps_deploy.sh
#   bash scripts/vps_deploy.sh --sync-kb       # incremental KB sync (fatua)
#   bash scripts/vps_deploy.sh --bootstrap-kb  # .env + sync + cron + API restart
#   bash scripts/vps_deploy.sh --dry-run
#
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
PUBLIC_URL="${RAQAT_VPS_PUBLIC_URL:-https://api.rahatomir.com}"
SSH_EXTRA="${RAQAT_VPS_SSH_OPTS:--o StrictHostKeyChecking=accept-new}"
API_PORT="${RAQAT_API_PORT:-8000}"

DRY_RUN=0
SYNC_KB=0
BOOTSTRAP_KB=0
USE_GIT=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --sync-kb) SYNC_KB=1 ;;
    --bootstrap-kb) BOOTSTRAP_KB=1 ;;
    --git-pull) USE_GIT=1 ;;
  esac
done

SSH=(ssh)
RSYNC=(rsync -az --human-readable)
# shellcheck disable=SC2206
SSH+=($SSH_EXTRA)
RSYNC+=(-e "ssh ${SSH_EXTRA}")
SSH_TARGET="${USER}@${HOST}"

RSYNC_EX=(
  --exclude '__pycache__/'
  --exclude '*.pyc'
  --exclude '.venv/'
  --exclude '.env'
  --exclude '*.sqlite3'
  --exclude '*.db'
)

if [[ "$DRY_RUN" == "1" ]]; then
  RSYNC+=(--dry-run -nv)
  echo "DRY RUN — файлдар жіберілмейді"
fi

echo "== Deploy → ${SSH_TARGET}:${REMOTE_ROOT} =="

"${SSH[@]}" -o BatchMode=yes -o ConnectTimeout=15 "${SSH_TARGET}" "mkdir -p '${REMOTE_ROOT}/platform_api' '${REMOTE_ROOT}/scripts' '${REMOTE_ROOT}/data'"

if [[ "$USE_GIT" == "1" ]]; then
  echo "== remote git pull =="
  "${SSH[@]}" "${SSH_TARGET}" "cd '${REMOTE_ROOT}' && git pull --ff-only" || echo "WARN: git pull сәтсіз — rsync жалғасады"
fi

echo "== rsync db (platform_api тәуелділігі) =="
"${RSYNC[@]}" "${RSYNC_EX[@]}" \
  "${REPO_ROOT}/db/" "${SSH_TARGET}:${REMOTE_ROOT}/db/"

echo "== rsync platform_api =="
"${RSYNC[@]}" "${RSYNC_EX[@]}" \
  "${REPO_ROOT}/platform_api/" "${SSH_TARGET}:${REMOTE_ROOT}/platform_api/"

echo "== rsync scripts =="
"${RSYNC[@]}" "${RSYNC_EX[@]}" \
  "${REPO_ROOT}/scripts/" "${SSH_TARGET}:${REMOTE_ROOT}/scripts/"

for f in check-gemini.sh; do
  if [[ -f "${REPO_ROOT}/${f}" ]]; then
    "${RSYNC[@]}" "${REPO_ROOT}/${f}" "${SSH_TARGET}:${REMOTE_ROOT}/${f}"
  fi
done

if [[ "$DRY_RUN" == "1" ]]; then
  echo "dry-run аяқталды"
  exit 0
fi

echo "== remote install + restart =="
"${RSYNC[@]}" "${REPO_ROOT}/scripts/vps_deploy_remote.sh" "${SSH_TARGET}:${REMOTE_ROOT}/scripts/vps_deploy_remote.sh"
"${SSH[@]}" "${SSH_TARGET}" \
  "chmod +x '${REMOTE_ROOT}/scripts/vps_deploy_remote.sh' && \
   RAQAT_ROOT='${REMOTE_ROOT}' RAQAT_API_PORT='${API_PORT}' RUN_KB_SYNC='${SYNC_KB}' RUN_KB_BOOTSTRAP='${BOOTSTRAP_KB}' \
   bash '${REMOTE_ROOT}/scripts/vps_deploy_remote.sh'"

echo "== public smoke: ${PUBLIC_URL} =="
if curl -fsS --connect-timeout 12 "${PUBLIC_URL%/}/health" >/dev/null 2>&1; then
  curl -fsS "${PUBLIC_URL%/}/health" | head -c 200
  echo
  if curl -fsS --connect-timeout 12 "${PUBLIC_URL%/}/api/v1/ai/kb/browse?limit=1" 2>/dev/null | head -c 200; then
    echo
  fi
  echo "public OK"
else
  echo "WARN: ${PUBLIC_URL}/health сырттан жауап бермеді (nginx/DNS тексеріңіз)" >&2
fi

echo "Дайын: ${PUBLIC_URL}"
