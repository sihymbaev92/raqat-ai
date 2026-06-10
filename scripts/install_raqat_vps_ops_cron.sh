#!/usr/bin/env bash
# VPS: Islamic KB sync (2×/day) + SQLite/Islamic KB backup (1×/day).
# Usage: bash scripts/install_raqat_vps_ops_cron.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Islamic KB sync cron =="
bash "$ROOT/scripts/install_islamic_kb_cron_twice_daily.sh"
bash "$ROOT/scripts/install_islamic_kb_cron_weekly_full.sh"

BACKUP_DIR="${RAQAT_BACKUP_DIR:-/var/backups/raqat}"
KB_DB="${RAQAT_ISLAMIC_KB_DB_PATH:-$ROOT/data/islamic_kb.sqlite3}"
SQLITE_DB="${RAQAT_DB_PATH:-$ROOT/global_clean.db}"
BACKUP_LOG="${RAQAT_BACKUP_LOG:-/var/log/raqat-backup.log}"

MARK_BEGIN="# raqat-vps-backup-daily BEGIN"
MARK_END="# raqat-vps-backup-daily END"
BACKUP_CMD="mkdir -p $BACKUP_DIR && (test -f $KB_DB && tar -czf $BACKUP_DIR/islamic_kb_\$(date +\\%F).tar.gz -C \$(dirname $KB_DB) \$(basename $KB_DB) || true) && (test -f $SQLITE_DB && cp -a $SQLITE_DB $BACKUP_DIR/global_clean_\$(date +\\%F).db || true) && find $BACKUP_DIR -name 'islamic_kb_*.tar.gz' -mtime +14 -delete && find $BACKUP_DIR -name 'global_clean_*.db' -mtime +14 -delete"

CRON_BLOCK=$(cat <<EOF
$MARK_BEGIN
30 3 * * * $BACKUP_CMD >> $BACKUP_LOG 2>&1
$MARK_END
EOF
)

TMP="$(mktemp)"
crontab -l 2>/dev/null | awk '
  /raqat-vps-backup-daily BEGIN/ { skip=1; next }
  /raqat-vps-backup-daily END/ { skip=0; next }
  skip { next }
  { print }
' >"$TMP" || true
echo "$CRON_BLOCK" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "OK: VPS backup cron (daily 03:30 UTC)"
crontab -l | grep -A2 "raqat-vps-backup" || true
