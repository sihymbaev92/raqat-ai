#!/usr/bin/env bash
# VPS: eski JS bundle-дарды тазалау + AppEntry gzip (nginx gzip_static).
set -euo pipefail
WEB="${1:-/var/www/raqat-web/dist}"
JS="${WEB}/_expo/static/js/web"
INDEX="${WEB}/index.html"
MANIFEST="${WEB}/.raqat-web-js-manifest.txt"
[[ -f "$INDEX" ]] || exit 0

mapfile -t KEEP < <(grep -oE 'AppEntry-[a-f0-9]+\.js|__common-[a-f0-9]+\.js|__expo-metro-runtime-[a-f0-9]+\.js|BackgroundFetch-[a-f0-9]+\.js' "$INDEX" | sort -u)

if [[ -d "$JS" ]]; then
  shopt -s nullglob
  if [[ -f "$MANIFEST" ]]; then
    mapfile -t CURRENT_JS < <(tr -d '\r' < "$MANIFEST" | sed '/^[[:space:]]*$/d')
    if [[ "${#CURRENT_JS[@]}" -eq 0 ]]; then
      echo "ERROR: empty web JS manifest: $MANIFEST" >&2
      exit 1
    fi
    for f in "${CURRENT_JS[@]}"; do
      if [[ -n "$f" && ! -f "$JS/$f" ]]; then
        echo "ERROR: manifest JS missing after extract: $JS/$f" >&2
        exit 1
      fi
    done
    for f in "$JS"/*.js; do
      base=$(basename "$f")
      keep=0
      for k in "${CURRENT_JS[@]}"; do [[ "$base" = "$k" ]] && keep=1; done
      if [[ "$keep" = 0 ]]; then
        rm -f "$f" "$f.gz"
      fi
    done
  fi
  for f in "$JS"/AppEntry-*.js "$JS"/__common-*.js "$JS"/__expo-metro-runtime-*.js "$JS"/BackgroundFetch-*.js; do
    base=$(basename "$f")
    keep=0
    for k in "${KEEP[@]}"; do [[ "$base" = "$k" ]] && keep=1; done
    if [[ "$keep" = 0 ]]; then
      rm -f "$f" "$f.gz"
    fi
  done
  APP=$(grep -oE 'AppEntry-[a-f0-9]+\.js' "$INDEX" | head -1 || true)
  for k in "${KEEP[@]}"; do
    if [[ ! -f "$JS/$k" ]]; then
      echo "ERROR: index references missing JS: $JS/$k" >&2
      exit 1
    fi
  done
  if [[ -n "$APP" && -f "$JS/$APP" ]]; then
    gzip -kf -9 "$JS/$APP"
  fi
else
  echo "ERROR: web JS directory missing: $JS" >&2
  exit 1
fi

chown -R www-data:www-data /var/www/raqat-web 2>/dev/null || true
