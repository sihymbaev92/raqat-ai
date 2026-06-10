#!/usr/bin/env bash
# VPS: venv, pip, systemd restart, health + KB smoke.
set -euo pipefail
ROOT="${RAQAT_ROOT:-/opt/raqat-ai}"
PORT="${RAQAT_API_PORT:-8000}"
cd "$ROOT"
export PYTHONPATH="${ROOT}:${ROOT}/platform_api:${PYTHONPATH:-}"

echo "== vps_deploy_remote: ${ROOT} =="

if [[ -d "${ROOT}/scripts" ]]; then
  while IFS= read -r -d '' f; do
    sed -i 's/\r$//' "$f" 2>/dev/null || true
  done < <(find "${ROOT}/scripts" -maxdepth 1 -name '*.sh' -print0 2>/dev/null || true)
fi

if [[ ! -x "${ROOT}/.venv/bin/python" ]]; then
  echo "venv жасалуда…"
  python3 -m venv "${ROOT}/.venv"
fi

"${ROOT}/.venv/bin/pip" install -q -U pip
"${ROOT}/.venv/bin/pip" install -q -r "${ROOT}/platform_api/requirements.txt"

if systemctl list-unit-files raqat-platform-api.service &>/dev/null; then
  systemctl daemon-reload 2>/dev/null || true
  systemctl restart raqat-platform-api
  echo "restarted raqat-platform-api"
else
  echo "WARN: raqat-platform-api.service жоқ" >&2
fi

if systemctl list-unit-files raqat-celery-worker.service &>/dev/null; then
  systemctl restart raqat-celery-worker
  echo "restarted raqat-celery-worker"
fi

health_ok=0
for _ in $(seq 1 25); do
  if curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
    health_ok=1
    break
  fi
  sleep 1
done
if [[ "$health_ok" != "1" ]]; then
  echo "ERROR: /health жауап бермеді (порт ${PORT})" >&2
  journalctl -u raqat-platform-api -n 30 --no-pager 2>/dev/null || true
  exit 1
fi
curl -fsS "http://127.0.0.1:${PORT}/health" | head -c 200
echo

if curl -fsS "http://127.0.0.1:${PORT}/api/v1/ai/kb/status" >/dev/null 2>&1; then
  echo "== KB status =="
  curl -fsS "http://127.0.0.1:${PORT}/api/v1/ai/kb/status" | head -c 400
  echo
fi

if curl -fsS "http://127.0.0.1:${PORT}/api/v1/ai/kb/browse?limit=1" >/dev/null 2>&1; then
  echo "== KB browse (1) =="
  curl -fsS "http://127.0.0.1:${PORT}/api/v1/ai/kb/browse?limit=1" | head -c 300
  echo
fi

if [[ "${RUN_KB_BOOTSTRAP:-0}" == "1" ]]; then
  echo "== Islamic KB production bootstrap =="
  KB_DB="${RAQAT_ISLAMIC_KB_DB_PATH:-${ROOT}/data/islamic_kb.sqlite3}"
  BOOT_ARGS=()
  if [[ -f "$KB_DB" ]] && [[ "$(stat -c%s "$KB_DB" 2>/dev/null || echo 0)" -gt 50000 ]]; then
    echo "KB DB exists — incremental sync (--skip-full)"
    BOOT_ARGS+=(--skip-full)
  else
    echo "KB DB missing/small — full sync (ұзақ болуы мүмкін)"
  fi
  RAQAT_VENV_PYTHON="${ROOT}/.venv/bin/python" RAQAT_ENV_FILE="${ROOT}/.env" \
    bash "${ROOT}/scripts/bootstrap_islamic_kb_production.sh" "${BOOT_ARGS[@]}" || {
    echo "WARN: bootstrap қатесі" >&2
  }
  if systemctl list-unit-files raqat-platform-api.service &>/dev/null; then
    systemctl restart raqat-platform-api
    echo "restarted raqat-platform-api (post-KB bootstrap)"
    sleep 2
    curl -fsS "http://127.0.0.1:${PORT}/api/v1/ai/kb/status" | head -c 500 || true
    echo
  fi
elif [[ "${RUN_KB_SYNC:-0}" == "1" ]]; then
  echo "== Islamic KB sync (all sites) =="
  "${ROOT}/.venv/bin/python" "${ROOT}/scripts/sync_islamic_kb.py" --site all --max "${RAQAT_ISLAMIC_KB_SYNC_MAX_URLS:-500}" || {
    echo "WARN: sync қатесі" >&2
  }
fi

echo "remote deploy OK"
