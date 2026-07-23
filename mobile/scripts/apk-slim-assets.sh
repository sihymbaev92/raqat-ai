#!/usr/bin/env bash
# Release APK/AAB: CDN-only asset-терді уақытша stash (Metro/APK-ға кірмейді).
# Runtime: rahatomir.com/assets/... + FileSystem кэш (loadBundledJson, qcf4FontLoader).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STASH="${ROOT}/.tmp-apk-slim-stash"

# paths relative to mobile/
CDN_ONLY_PATHS=(
  "assets/quran/qcf4/fonts"
  "assets/quran/qcf4/fonts-woff2"
  "assets/quran/qcf4/pages"
  "assets/quran_tajweed.json"
  "assets/hajj/muftyat"
  "assets/tajweed/muftyat"
  "assets/bundled/offline-auto-translations-core.json"
  "assets/bundled/halal-companies-snapshot.json"
)

apk_slim_stash() {
  if [[ -d "$STASH" ]]; then
    echo "apk-slim: stash already exists ($STASH) — run restore first" >&2
    exit 1
  fi
  mkdir -p "$STASH"
  local moved=0
  for rel in "${CDN_ONLY_PATHS[@]}"; do
    local src="$ROOT/$rel"
    if [[ -e "$src" ]]; then
      local dest_dir
      dest_dir="$(dirname "$STASH/$rel")"
      mkdir -p "$dest_dir"
      mv "$src" "$STASH/$rel"
      moved=$((moved + 1))
      echo "apk-slim: stashed $rel"
    fi
  done
  if [[ "$moved" -eq 0 ]]; then
    rmdir "$STASH" 2>/dev/null || true
    echo "apk-slim: nothing to stash"
  else
    echo "apk-slim: stashed $moved item(s) (~110+ MB typical)"
  fi
}

apk_slim_restore() {
  if [[ ! -d "$STASH" ]]; then
    return 0
  fi
  for rel in "${CDN_ONLY_PATHS[@]}"; do
    local back="$STASH/$rel"
    local dest="$ROOT/$rel"
    if [[ -e "$back" ]]; then
      mkdir -p "$(dirname "$dest")"
      if [[ -e "$dest" ]]; then
        echo "apk-slim: skip restore (dest exists): $rel" >&2
      else
        mv "$back" "$dest"
        echo "apk-slim: restored $rel"
      fi
    fi
  done
  # cleanup empty dirs
  find "$STASH" -depth -type d -empty -delete 2>/dev/null || true
  rmdir "$STASH" 2>/dev/null || true
  echo "apk-slim: restore done"
}

cmd="${1:-}"
case "$cmd" in
  stash) apk_slim_stash ;;
  restore) apk_slim_restore ;;
  *)
    echo "Usage: $0 stash|restore" >&2
    exit 1
    ;;
esac
