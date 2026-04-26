#!/usr/bin/env bash
# VPS / жергілікті platform_api тексеру (деплойдан кейін).
# Мысал: bash scripts/smoke_platform_api_vps.sh
# Негізгі API: RAQAT_SMOKE_API_BASE (әдепкі http://127.0.0.1:8787)
set -euo pipefail
BASE="${RAQAT_SMOKE_API_BASE:-http://127.0.0.1:8787}"
BASE="${BASE%/}"
echo "== $BASE =="
curl -sS -f --connect-timeout 5 "${BASE}/health" | head -c 300
echo
echo "== POST /api/v1/ai/chat (quick, құпиясыз) =="
curl -sS -f --connect-timeout 120 -X POST "${BASE}/api/v1/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"ok","detail_level":"quick"}' | head -c 500
echo
echo "OK"
