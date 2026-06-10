#!/usr/bin/env bash
# VPS: Celery worker systemd unit орнату (бір рет).
#   export RAQAT_ROOT=/opt/raqat-ai
#   bash scripts/vps_install_celery_worker.sh
set -euo pipefail
ROOT="${RAQAT_ROOT:-/opt/raqat-ai}"
UNIT_SRC="${ROOT}/scripts/systemd/raqat-celery-worker-raqat-ai.service.example"
UNIT_DST="/etc/systemd/system/raqat-celery-worker.service"

[[ "$(id -u)" -eq 0 ]] || { echo "root керек: sudo bash $0"; exit 1; }
[[ -f "$UNIT_SRC" ]] || { echo "ERROR: $UNIT_SRC жоқ"; exit 1; }

if ! redis-cli ping 2>/dev/null | grep -q PONG; then
  echo "WARN: redis-cli ping сәтсіз — RAQAT_REDIS_URL тексеріңіз"
fi

install -d /etc/systemd/system
cp "$UNIT_SRC" "$UNIT_DST"
systemctl daemon-reload
systemctl enable raqat-celery-worker
systemctl restart raqat-celery-worker
sleep 2
if systemctl is-active --quiet raqat-celery-worker; then
  echo "OK: raqat-celery-worker active"
  systemctl status raqat-celery-worker --no-pager -l | head -12
else
  journalctl -u raqat-celery-worker -n 40 --no-pager
  exit 1
fi
