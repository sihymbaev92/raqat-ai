#!/usr/bin/env bash
# Platform API — apps/api картасынан іске қосу (нақты код: platform_api/)
# Пайдалану: cd apps/api  &&  bash dev.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec "$ROOT/scripts/run_platform_api.sh" "$@"
