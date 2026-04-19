#!/usr/bin/env bash
set -euo pipefail

echo "[1/4] Checking memory status..."
free -h

echo "[2/4] Stopping stale translation workers..."
pkill -f "translate_.*\.py" || true
pkill -f "/root/bot/raqat_bot/.venv/bin/python.*translate_" || true

echo "[3/4] Cleaning Python caches in workspace..."
find . -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".pytest_cache" -prune -exec rm -rf {} + 2>/dev/null || true

echo "[4/4] Post-cleanup memory snapshot..."
free -h

echo
echo "Done. For lighter runs, prefer single-process commands, for example:"
echo "  OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 .venv/bin/python bot_main.py"
