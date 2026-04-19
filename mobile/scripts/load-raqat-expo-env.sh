#!/usr/bin/env bash
# Түбір репо .env және mobile/.env жүктеп, RAQAT_* → EXPO_PUBLIC_RAQAT_* көпірлейді.
# Қолдану: MOBILE_ROOT=... пен source (build-apk, start:vps).
# RAQAT_EXPO_RELEASE_BUILD=1: mobile/.env.production соңғы болып жүктеледі; localhost EXPO_PUBLIC APK-ға кірмейді.
# shellcheck disable=SC1091
: "${MOBILE_ROOT:?MOBILE_ROOT must be set to the mobile/ directory}"

REPO_ROOT="$(cd "$MOBILE_ROOT/.." && pwd)"
if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  source "$REPO_ROOT/.env"
  set +a
fi
if [[ -f "$MOBILE_ROOT/.env" ]]; then
  set -a
  source "$MOBILE_ROOT/.env"
  set +a
fi
if [[ "${RAQAT_EXPO_RELEASE_BUILD:-0}" == "1" ]] && [[ -f "$MOBILE_ROOT/.env.production" ]]; then
  set -a
  source "$MOBILE_ROOT/.env.production"
  set +a
fi

_is_local_api_base() {
  case "${1:-}" in
    *127.0.0.1* | *localhost*) return 0 ;;
    *) return 1 ;;
  esac
}

if [[ -z "${EXPO_PUBLIC_RAQAT_API_BASE:-}" ]] && [[ -n "${RAQAT_PLATFORM_API_BASE:-}" ]]; then
  if [[ "${RAQAT_EXPO_RELEASE_BUILD:-0}" != "1" ]] || ! _is_local_api_base "${RAQAT_PLATFORM_API_BASE}"; then
    export EXPO_PUBLIC_RAQAT_API_BASE="${RAQAT_PLATFORM_API_BASE}"
  fi
fi
if [[ -z "${EXPO_PUBLIC_RAQAT_AI_SECRET:-}" ]] && [[ -n "${RAQAT_AI_PROXY_SECRET:-}" ]]; then
  export EXPO_PUBLIC_RAQAT_AI_SECRET="${RAQAT_AI_PROXY_SECRET}"
fi
if [[ -z "${EXPO_PUBLIC_RAQAT_CONTENT_SECRET:-}" ]] && [[ -n "${RAQAT_CONTENT_READ_SECRET:-}" ]]; then
  export EXPO_PUBLIC_RAQAT_CONTENT_SECRET="${RAQAT_CONTENT_READ_SECRET}"
fi

if [[ "${RAQAT_EXPO_RELEASE_BUILD:-0}" == "1" ]] && [[ "${RAQAT_ALLOW_LOCALHOST_EXPO:-}" != "1" ]]; then
  if [[ -n "${EXPO_PUBLIC_RAQAT_API_BASE:-}" ]] && _is_local_api_base "${EXPO_PUBLIC_RAQAT_API_BASE}"; then
    unset EXPO_PUBLIC_RAQAT_API_BASE
  fi
fi
