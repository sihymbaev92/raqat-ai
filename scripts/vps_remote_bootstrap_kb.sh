#!/usr/bin/env bash
# VPS-те орындалады: bootstrap + API restart
set -euo pipefail
ROOT="${RAQAT_ROOT:-/opt/raqat-ai}"
cd "$ROOT"
for f in scripts/*.sh; do
  [[ -f "$f" ]] && sed -i 's/\r$//' "$f" 2>/dev/null || true
done
chmod +x scripts/*.sh 2>/dev/null || true
if [[ ! -x .venv/bin/python ]]; then
  python3 -m venv .venv
fi
.venv/bin/pip install -q -r platform_api/requirements.txt
KB_DB="${ROOT}/data/islamic_kb.sqlite3"
BOOT_ARGS=()
if [[ -f "$KB_DB" ]] && [[ "$(stat -c%s "$KB_DB" 2>/dev/null || echo 0)" -gt 50000 ]]; then
  echo "KB exists ($(stat -c%s "$KB_DB") bytes) — incremental sync"
  BOOT_ARGS+=(--skip-full)
else
  echo "KB missing/small — full sync"
fi
export RAQAT_VENV_PYTHON="${ROOT}/.venv/bin/python"
export RAQAT_ENV_FILE="${ROOT}/.env"
bash "${ROOT}/scripts/bootstrap_islamic_kb_production.sh" "${BOOT_ARGS[@]}"
systemctl restart raqat-platform-api
sleep 3
curl -fsS "http://127.0.0.1:8000/health" | head -c 200
echo
grep -E '^RAQAT_ISLAMIC_KB_ENABLED=' "${ROOT}/.env" || true
echo "bootstrap_kb OK"
