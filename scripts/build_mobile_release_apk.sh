#!/usr/bin/env bash
set -euo pipefail

ROOT="/root/bot/raqat_bot"
APP_DIR="$ROOT/mobile_flutter"
ENV_FILE="$ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env табылмады: $ENV_FILE" >&2
  exit 1
fi

API_BASE="$(python3 - <<'PY'
from pathlib import Path
vals={}
for line in Path("/root/bot/raqat_bot/.env").read_text(encoding="utf-8").splitlines():
    s=line.strip()
    if not s or s.startswith("#") or "=" not in s:
        continue
    k,v=s.split("=",1)
    vals[k.strip()]=v.strip().strip('"').strip("'")
print(vals.get("RAQAT_PLATFORM_API_BASE") or vals.get("RAQAT_API_BASE",""))
PY
)"
CONTENT_SECRET="$(python3 - <<'PY'
from pathlib import Path
vals={}
for line in Path("/root/bot/raqat_bot/.env").read_text(encoding="utf-8").splitlines():
    s=line.strip()
    if not s or s.startswith("#") or "=" not in s:
        continue
    k,v=s.split("=",1)
    vals[k.strip()]=v.strip().strip('"').strip("'")
print(vals.get("RAQAT_CONTENT_READ_SECRET",""))
PY
)"
AI_SECRET="$(python3 - <<'PY'
from pathlib import Path
vals={}
for line in Path("/root/bot/raqat_bot/.env").read_text(encoding="utf-8").splitlines():
    s=line.strip()
    if not s or s.startswith("#") or "=" not in s:
        continue
    k,v=s.split("=",1)
    vals[k.strip()]=v.strip().strip('"').strip("'")
print(vals.get("RAQAT_AI_PROXY_SECRET",""))
PY
)"

if [[ -z "$API_BASE" ]]; then
  echo "ERROR: RAQAT_PLATFORM_API_BASE/RAQAT_API_BASE бос." >&2
  exit 1
fi

cd "$APP_DIR"
flutter build apk --release \
  --dart-define "RAQAT_API_BASE=$API_BASE" \
  --dart-define "RAQAT_CONTENT_READ_SECRET=$CONTENT_SECRET" \
  --dart-define "RAQAT_AI_PROXY_SECRET=$AI_SECRET"

echo
echo "APK дайын:"
echo "$APP_DIR/build/app/outputs/flutter-apk/app-release.apk"
