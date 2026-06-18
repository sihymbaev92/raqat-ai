#!/usr/bin/env bash
# VPS cron: /ready + async AI ping. Лог: /opt/raqat-ai/.logs/vps_smoke.log
set -euo pipefail
ROOT="${RAQAT_ROOT:-/opt/raqat-ai}"
API_PORT="${RAQAT_API_PORT:-8000}"
PUBLIC_URL="${RAQAT_VPS_PUBLIC_URL:-https://api.rahatomir.com}"
PY="${ROOT}/.venv/bin/python"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REQUIRED_CHECKS="${RAQAT_CRON_REQUIRED_CHECKS:-local_health,local_ready,public_health,async_ai,hatim_auth}"

mkdir -p "${ROOT}/.logs"
echo "== vps_cron_smoke ${STAMP} =="

fail=0

is_required() {
  case ",${REQUIRED_CHECKS}," in
    *",$1,"*) return 0 ;;
    *) return 1 ;;
  esac
}

warn_or_fail() {
  local check="$1"
  local message="$2"
  if is_required "$check"; then
    echo "FAIL ${message}" >&2
    fail=1
  else
    echo "WARN ${message}" >&2
  fi
}

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
  warn_or_fail "celery_worker" "celery-worker not active"
fi

if curl -fsS --connect-timeout 15 "${PUBLIC_URL%/}/health" >/dev/null; then
  echo "OK  public ${PUBLIC_URL}/health"
else
  warn_or_fail "public_health" "public ${PUBLIC_URL}/health"
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
    warn_or_fail "async_ai" "async AI smoke (Gemini/quota)"
  fi
elif is_required "async_ai"; then
  warn_or_fail "async_ai" "async AI smoke script unavailable"
fi

if [[ -x "$PY" ]] && [[ -f "${ROOT}/platform_api/scripts/check_gemini_key.py" ]]; then
  if "$PY" "${ROOT}/platform_api/scripts/check_gemini_key.py" >/dev/null 2>&1; then
    echo "OK  gemini key probe"
  else
    warn_or_fail "gemini_key" "gemini key probe failed"
  fi
elif is_required "gemini_key"; then
  warn_or_fail "gemini_key" "gemini key probe script unavailable"
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
      warn_or_fail "hatim_auth" "hatim auth smoke"
    fi
  else
    warn_or_fail "hatim_auth" "hatim smoke skipped (no RAQAT_SMOKE_AUTH_PASSWORD in .env)"
  fi
elif is_required "hatim_auth"; then
  warn_or_fail "hatim_auth" "hatim auth smoke script unavailable"
fi

exit "$fail"
