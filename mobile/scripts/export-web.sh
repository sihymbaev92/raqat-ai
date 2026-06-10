#!/usr/bin/env bash
# Expo web — статикалық сайт (dist/). VPS/nginx немесе Cloudflare Pages-ке жүктеу.
set -euo pipefail
cd "$(dirname "$0")/.."
MOBILE_ROOT="$(pwd)"
export RAQAT_EXPO_RELEASE_BUILD=1
# shellcheck disable=SC1091
source "$MOBILE_ROOT/scripts/load-raqat-expo-env.sh"

if [[ -z "${EXPO_PUBLIC_RAQAT_API_BASE:-}" ]] && [[ -z "${EXPO_PUBLIC_IMAM_AI_API_BASE:-}" ]]; then
  echo ""
  echo "=== ЕСКЕРТУ ==="
  echo "EXPO_PUBLIC_RAQAT_API_BASE орнатылмаған."
  echo "mobile/.env.production.example → .env.production көшіріп, API URL толтырыңыз."
  echo "Мысал: EXPO_PUBLIC_RAQAT_API_BASE=https://api.rahatomir.com"
  echo "=============="
  echo ""
fi

echo "Web export (production env)..."
npx expo export --platform web --output-dir dist
node scripts/patch-web-boot-html.js
node scripts/copy-web-bundled-json.js
node scripts/copy-web-quran-assets.js

echo ""
echo "Дайын: mobile/dist/"
echo "Жергілікті тексеру: npx serve dist -l 8090"
echo "VPS: docs/operations/web-app-deploy.md"
