#!/usr/bin/env bash
# platform_api (8787) — түбір .env бойынша қайта іске қосу.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

echo "== platform_api =="
bash "${ROOT}/scripts/dev_restart_platform.sh"
