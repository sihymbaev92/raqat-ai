#!/bin/bash
# VPS: /opt/raqat-ai/check-gemini.sh — Gemini кілтін тексеру
set -euo pipefail
ROOT="/opt/raqat-ai"
exec "$ROOT/.venv/bin/python" "$ROOT/platform_api/scripts/check_gemini_key.py" "$@"
