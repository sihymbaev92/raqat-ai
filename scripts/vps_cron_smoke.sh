#!/usr/bin/env bash
# VPS cron: /ready + async AI ping. Лог: /opt/raqat-ai/.logs/vps_smoke.log
set -euo pipefail
ROOT="${RAQAT_ROOT:-/opt/raqat-ai}"
API_PORT="${RAQAT_API_PORT:-8000}"
PUBLIC_URL="${RAQAT_VPS_PUBLIC_URL:-https://api.rahatomir.com}"
PY="${ROOT}/.venv/bin/python"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p "${ROOT}/.logs"
echo "== vps_cron_smoke ${STAMP} =="

fail=0

if curl -fsS --connect-timeout 12 "http://127.0.0.1:${API_PORT}/health" >/dev/null; then
  echo "OK  local /health"
else
  echo "FAIL local /health" >&2
  fail=1
fi

ready_json="$(curl -fsS --connect-timeout 12 "http://127.0.0.1:${API_PORT}/ready" 2>/dev/null || true)"
if [[ -n "$ready_json" ]] && echo "$ready_json" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
  echo "OK  local /ready ${ready_json:0:120}"
else
  echo "FAIL local /ready ${ready_json:-empty}" >&2
  fail=1
fi

if systemctl is-active --quiet raqat-celery-worker 2>/dev/null; then
  echo "OK  celery-worker active"
else
  echo "WARN celery-worker not active" >&2
fi

if curl -fsS --connect-timeout 15 "${PUBLIC_URL%/}/health" >/dev/null; then
  echo "OK  public ${PUBLIC_URL}/health"
else
  echo "WARN public health" >&2
fi

if [[ -x "$PY" ]] && [[ -f "${ROOT}/scripts/smoke_async_ai_celery.py" ]]; then
  set -a
  # shellcheck disable=SC1091
  [[ -f "${ROOT}/.env" ]] && source "${ROOT}/.env"
  set +a
  if "$PY" "${ROOT}/scripts/smoke_async_ai_celery.py" \
    --api-base "http://127.0.0.1:${API_PORT}" \
    --prompt "Smoke ping" \
    --timeout 90 \
    --poll-interval 2; then
    echo "OK  async AI smoke"
  else
    echo "WARN async AI smoke (Gemini/quota)" >&2
  fi
fi

if [[ -x "$PY" ]] && [[ -f "${ROOT}/platform_api/scripts/check_gemini_key.py" ]]; then
  if "$PY" "${ROOT}/platform_api/scripts/check_gemini_key.py" >/dev/null 2>&1; then
    echo "OK  gemini key probe"
  else
    echo "WARN gemini key probe failed" >&2
  fi
fi

if [[ -x "$PY" ]] && [[ -f "${ROOT}/scripts/smoke_hatim_api.py" ]]; then
  set -a
  # shellcheck disable=SC1091
  [[ -f "${ROOT}/.env" ]] && source "${ROOT}/.env"
  set +a
  if [[ -n "${RAQAT_SMOKE_AUTH_PASSWORD:-}" ]] || [[ -n "${RAQAT_AUTH_PASSWORD:-}" ]]; then
    export RAQAT_SMOKE_AUTH_PASSWORD="${RAQAT_SMOKE_AUTH_PASSWORD:-$RAQAT_AUTH_PASSWORD}"
    export RAQAT_SMOKE_AUTH_USERNAME="${RAQAT_SMOKE_AUTH_USERNAME:-${RAQAT_AUTH_USERNAME:-admin}}"
    if "$PY" "${ROOT}/scripts/smoke_hatim_api.py" --api-base "http://127.0.0.1:${API_PORT}"; then
      echo "OK  hatim auth smoke"
    else
      echo "WARN hatim auth smoke" >&2
    fi
  else
    echo "SKIP hatim smoke (no RAQAT_SMOKE_AUTH_PASSWORD in .env)"
  fi
fi

exit "$fail"
