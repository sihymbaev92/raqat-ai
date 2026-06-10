#!/usr/bin/env bash
# Fatua + Muftyat индексін күніне 2 рет жаңарту (04:15 және 16:15 UTC ≈ 09:15 / 21:15 Астана).
# VPS: bash scripts/install_islamic_kb_cron_twice_daily.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYNC="$ROOT/scripts/run_islamic_kb_sync.sh"
LOG="${RAQAT_ISLAMIC_KB_SYNC_LOG:-/var/log/raqat-islamic-kb-sync.log}"
# Incremental: ресми лицензияда .env RAQAT_ISLAMIC_KB_SYNC_MAX_URLS (әдепкі 500)
MAX="${RAQAT_ISLAMIC_KB_SYNC_MAX_URLS:-500}"

if [[ ! -x "$SYNC" ]]; then
  chmod +x "$SYNC"
fi

MARK_BEGIN="# raqat-islamic-kb-sync-twice-daily BEGIN"
MARK_END="# raqat-islamic-kb-sync-twice-daily END"
CRON_BLOCK=$(cat <<EOF
$MARK_BEGIN
15 4 * * * cd $ROOT && $SYNC --site all --max $MAX >> $LOG 2>&1
15 16 * * * cd $ROOT && $SYNC --site all --max $MAX >> $LOG 2>&1
$MARK_END
EOF
)

TMP="$(mktemp)"
crontab -l 2>/dev/null | awk '
  /raqat-islamic-kb-sync-twice-daily BEGIN/ { skip=1; next }
  /raqat-islamic-kb-sync-twice-daily END/ { skip=0; next }
  skip { next }
  { print }
' >"$TMP" || true
echo "$CRON_BLOCK" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "OK: Islamic KB sync cron (2×/day UTC 04:15 + 16:15)"
crontab -l | grep -A2 "raqat-islamic-kb-sync" || true
