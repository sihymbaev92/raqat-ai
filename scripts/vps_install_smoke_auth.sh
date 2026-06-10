#!/usr/bin/env bash
# VPS: bootstrap smoke login (bcrypt). Құпиялар тек env арқылы (git-ке енгізбейді).
#
#   export RAQAT_AUTH_PASSWORD_BCRYPT='$2b$12$...'
#   export RAQAT_SMOKE_AUTH_PASSWORD='...'
#   export RAQAT_AUTH_USERNAME='raqat-smoke'
#   bash scripts/vps_install_smoke_auth.sh
#
set -euo pipefail
ENV="${RAQAT_ENV_FILE:-/opt/raqat-ai/.env}"
ROOT="/opt/raqat-ai"
USER="${RAQAT_AUTH_USERNAME:-raqat-smoke}"
BCRYPT="${RAQAT_AUTH_PASSWORD_BCRYPT:-}"
SMOKE_PW="${RAQAT_SMOKE_AUTH_PASSWORD:-}"

if [[ -z "$BCRYPT" ]]; then
  echo "ERROR: RAQAT_AUTH_PASSWORD_BCRYPT required" >&2
  exit 1
fi

[[ -f "$ENV" ]] || { echo "ERROR: $ENV missing" >&2; exit 1; }
cp -a "$ENV" "${ENV}.bak-smoke-auth-$(date +%Y%m%d-%H%M%S)"

PY="${ROOT}/.venv/bin/python"
if [[ ! -x "$PY" ]]; then PY="python3"; fi

"$PY" - "$ENV" "$USER" "$BCRYPT" "$SMOKE_PW" <<'PY'
import sys
from pathlib import Path

env_path = Path(sys.argv[1])
username = sys.argv[2]
bcrypt = sys.argv[3]
smoke_pw = sys.argv[4] if len(sys.argv) > 4 else ""

updates = {
    "RAQAT_AUTH_USERNAME": username,
    "RAQAT_AUTH_PASSWORD_BCRYPT": bcrypt,
}
if smoke_pw:
    updates["RAQAT_SMOKE_AUTH_USERNAME"] = username
    updates["RAQAT_SMOKE_AUTH_PASSWORD"] = smoke_pw


def fmt_line(key: str, val: str) -> str:
    # bash `source .env` expands $ — bcrypt/hash міндетті quote
    if "$" in val or " " in val or "#" in val or "'" in val:
        esc = val.replace("'", "'\"'\"'")
        return f"{key}='{esc}'"
    return f"{key}={val}"


lines = env_path.read_text(encoding="utf-8").splitlines()
out: list[str] = []
seen: set[str] = set()
for line in lines:
    if not line.strip() or line.lstrip().startswith("#"):
        out.append(line)
        continue
    if "=" not in line:
        out.append(line)
        continue
    key = line.split("=", 1)[0].strip()
    if key == "RAQAT_AUTH_PASSWORD":
        continue
    if key in updates:
        out.append(fmt_line(key, updates[key]))
        seen.add(key)
    else:
        out.append(line)
for key, val in updates.items():
    if key not in seen:
        out.append(fmt_line(key, val))
env_path.write_text("\n".join(out) + "\n", encoding="utf-8")
PY

chmod 600 "$ENV"

if systemctl list-unit-files raqat-platform-api.service &>/dev/null; then
  systemctl restart raqat-platform-api
  echo "OK  restarted raqat-platform-api"
else
  echo "WARN raqat-platform-api.service not found — restart API manually"
fi

echo "OK  smoke auth user=${USER} bcrypt installed"
