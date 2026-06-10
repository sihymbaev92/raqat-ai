#!/usr/bin/env bash
# Жексенбі 02:30 UTC — толық ресми sync (--full, OFFICIAL_LICENSE қажет).
# VPS: bash scripts/install_islamic_kb_cron_weekly_full.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYNC="$ROOT/scripts/run_islamic_kb_sync.sh"
LOG="${RAQAT_ISLAMIC_KB_FULL_SYNC_LOG:-/var/log/raqat-islamic-kb-full-sync.log}"

if [[ ! -x "$SYNC" ]]; then
  chmod +x "$SYNC"
fi

MARK_BEGIN="# raqat-islamic-kb-sync-weekly-full BEGIN"
MARK_END="# raqat-islamic-kb-sync-weekly-full END"
CRON_BLOCK=$(cat <<EOF
$MARK_BEGIN
30 2 * * 0 cd $ROOT && $SYNC --site all --full >> $LOG 2>&1
$MARK_END
EOF
)

TMP="$(mktemp)"
crontab -l 2>/dev/null | awk '
  /raqat-islamic-kb-sync-weekly-full BEGIN/ { skip=1; next }
  /raqat-islamic-kb-sync-weekly-full END/ { skip=0; next }
  skip { next }
  { print }
' >"$TMP" || true
echo "$CRON_BLOCK" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "OK: Islamic KB weekly full sync (Sunday 02:30 UTC)"
crontab -l | grep -A1 "raqat-islamic-kb-sync-weekly-full" || true
