#!/usr/bin/env bash
# VPS: 6 сағат сайын smoke cron орнату.
#   sudo bash scripts/vps_install_cron_smoke.sh
set -euo pipefail
ROOT="${RAQAT_ROOT:-/opt/raqat-ai}"
SCRIPT="${ROOT}/scripts/vps_cron_smoke.sh"
CRON_LINE="0 */6 * * * ${SCRIPT} >> ${ROOT}/.logs/vps_smoke.log 2>&1"

[[ "$(id -u)" -eq 0 ]] || { echo "root керек"; exit 1; }
[[ -f "$SCRIPT" ]] || { echo "ERROR: $SCRIPT жоқ"; exit 1; }
chmod +x "$SCRIPT"
mkdir -p "${ROOT}/.logs"

if crontab -l 2>/dev/null | grep -Fq "vps_cron_smoke.sh"; then
  echo "OK  cron entry already exists"
else
  (crontab -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -
  echo "OK  cron installed: $CRON_LINE"
fi

bash "$SCRIPT" || true
