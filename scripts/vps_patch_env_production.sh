#!/usr/bin/env bash
# VPS: /opt/raqat-ai/.env — Islamic KB + AI production жолдары (құпияларды өзгертпейді).
set -euo pipefail
ENV="${RAQAT_ENV_FILE:-/opt/raqat-ai/.env}"
ROOT="/opt/raqat-ai"

set_kv() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV"
  else
    echo "${key}=${val}" >>"$ENV"
  fi
}

[[ -f "$ENV" ]] || { echo "ERROR: $ENV жоқ"; exit 1; }
cp -a "$ENV" "${ENV}.bak-patch-$(date +%Y%m%d-%H%M%S)"

set_kv "RAQAT_ISLAMIC_KB_ENABLED" "1"
set_kv "RAQAT_ISLAMIC_KB_OFFICIAL_LICENSE" "1"
set_kv "RAQAT_ISLAMIC_KB_DB_PATH" "${ROOT}/data/islamic_kb.sqlite3"
set_kv "RAQAT_ISLAMIC_KB_SOURCES" "fatua,muftyat"
set_kv "RAQAT_ISLAMIC_KB_TOP_K" "5"
set_kv "RAQAT_ISLAMIC_KB_MAX_CONTEXT_CHARS" "9000"
set_kv "RAQAT_ISLAMIC_KB_SYNC_MAX_URLS" "500"
set_kv "RAQAT_ISLAMIC_KB_FETCH_DELAY_SEC" "1.0"
set_kv "RAQAT_ISLAMIC_KB_EXCERPT_CHARS" "1200"
set_kv "RAQAT_ISLAMIC_KB_MAX_LISTING_PAGES" "200"
set_kv "RAQAT_AI_ENABLE_GOOGLE_SEARCH" "0"
set_kv "RAQAT_AI_KB_ONLY" "1"
set_kv "RAQAT_AI_PIPELINE_STAGES" "0"
set_kv "RAQAT_HALAL_DAMU_ORIGIN" "https://halaldamu.kz"
set_kv "RAQAT_AI_ALLOW_ANONYMOUS" "1"

mkdir -p "${ROOT}/data"
mkdir -p "${ROOT}/.logs"
chmod 755 "${ROOT}/data"
echo "OK: .env patched (KB + RAQAT_AI_ALLOW_ANONYMOUS=1 + halaldamu)"
