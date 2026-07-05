#!/usr/bin/env bash
# VPS: Telegram бот өшірілгеннен кейін legacy raqat-bot процессін/сервисін тоқтатады.
# Қолдану (VPS SSH ішінде, repo түбірінен):
#   bash scripts/vps_disable_legacy_bot.sh
#   bash scripts/vps_disable_legacy_bot.sh --disable-unit   # systemd disable + mask
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DISABLE_UNIT=0
for arg in "$@"; do
  case "$arg" in
    --disable-unit) DISABLE_UNIT=1 ;;
  esac
done

echo "== Disable legacy Telegram bot (RAQAT) =="

if pgrep -f "bot_main.py" >/dev/null 2>&1; then
  echo "Stopping bot_main.py processes..."
  pkill -f "bot_main.py" || true
  sleep 2
fi

if systemctl list-unit-files raqat-bot.service >/dev/null 2>&1; then
  if systemctl is-active --quiet raqat-bot 2>/dev/null; then
    echo "Stopping raqat-bot.service..."
    systemctl stop raqat-bot || true
  fi
  if [[ "$DISABLE_UNIT" -eq 1 ]]; then
    echo "Disabling + masking raqat-bot.service..."
    systemctl disable raqat-bot || true
    systemctl mask raqat-bot || true
  else
    echo "Tip: run with --disable-unit to prevent auto-start on reboot."
  fi
else
  echo "No raqat-bot.service unit found (OK)."
fi

if pgrep -f "bot_main.py" >/dev/null 2>&1; then
  echo "WARN: bot_main.py still running after stop attempt."
  pgrep -af "bot_main.py" || true
  exit 1
fi

echo "OK: no bot_main.py process."
echo "Clients: mobile app + platform API only."
