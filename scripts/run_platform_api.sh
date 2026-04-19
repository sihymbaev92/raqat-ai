#!/usr/bin/env bash
# RAQAT платформа API (uvicorn). Порт: PORT немесе 8787.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/platform_api"
if [[ ! -x .venv/bin/uvicorn ]]; then
  echo "Алдымен: cd platform_api && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi
exec .venv/bin/uvicorn main:app --host "${HOST:-0.0.0.0}" --port "${PORT:-8787}"
