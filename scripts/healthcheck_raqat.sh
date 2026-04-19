#!/usr/bin/env bash
# RAQAT: дерекқор файлы, опциялық API / бот процесі. Мониторинг немесе cron үшін.
# Мысал: bash scripts/healthcheck_raqat.sh
# Орта: RAQAT_DB_PATH, RAQAT_PLATFORM_API_BASE (бос болса 127.0.0.1:8787)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="${RAQAT_DB_PATH:-${DB_PATH:-$ROOT/global_clean.db}}"
API="${RAQAT_PLATFORM_API_BASE:-http://127.0.0.1:8787}"
API="${API%/}"
ERR=0

echo "== RAQAT healthcheck $(date -Iseconds) =="

if [[ -f "$DB" ]]; then
  SZ=$(wc -c <"$DB" | tr -d ' ')
  echo "OK  SQLite: $DB (${SZ} bytes)"
else
  echo "ERR SQLite жоқ: $DB"
  ERR=1
fi

if command -v curl >/dev/null 2>&1; then
  if curl -sf --connect-timeout 3 "${API}/ready" >/dev/null; then
    echo "OK  API: ${API}/ready (дерекқор дайын)"
  elif curl -sf --connect-timeout 3 "${API}/health" >/dev/null; then
    echo "WARN API /health OK, бірақ /ready сәтсіз (DB немесе ескі сервер)"
  else
    echo "WARN API жауап бермейді (жұмыс істемесе де болады): $API"
  fi
  if curl -sf --connect-timeout 3 "${API}/metrics" >/dev/null; then
    echo "OK  API Prometheus: ${API}/metrics (rate() → req/s, errors, AI latency histogram)"
  else
    echo "WARN API /metrics (Prometheus) жауап бермеді"
  fi
  if curl -sf --connect-timeout 3 "${API}/metrics/json" >/dev/null; then
    echo "OK  API metrics JSON: ${API}/metrics/json"
  else
    echo "WARN API /metrics/json жауап бермеді"
  fi
else
  echo "SKIP curl жоқ — API тексерілмеді"
fi

if pgrep -f "bot_main.py" >/dev/null 2>&1; then
  echo "OK  bot: bot_main.py процесі табылды"
else
  echo "WARN bot: bot_main.py процесі жоқ (немесе басқа жолмен іске қосылған)"
fi

df -h "$ROOT" 2>/dev/null | tail -1 | awk '{print "     диск: "$4" бос ("$5" қолданылған)"}'

exit "$ERR"
