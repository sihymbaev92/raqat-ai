#!/usr/bin/env bash
set -euo pipefail

# Контент релиз pipeline:
#   import -> API validate -> mobile sync smoke
#
# Usage examples:
#   bash scripts/release_content_pipeline.sh
#   bash scripts/release_content_pipeline.sh \
#     --import-cmd ".venv/bin/python scripts/hadith_corpus_sync.py import-json --db ./global_clean.db --input ./hadith.json --allow-errors" \
#     --import-cmd ".venv/bin/python scripts/import_quran_kk_verified.py --db ./global_clean.db --input ./quran_kk.json"
#
# Optional auth:
#   export RAQAT_CONTENT_READ_SECRET=...
#   export RAQAT_CONTENT_ACCESS_TOKEN=...

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PY="${ROOT}/.venv/bin/python"
[[ -x "$PY" ]] || PY="$(command -v python3)"

API_BASE="${RAQAT_PLATFORM_API_BASE:-http://127.0.0.1:8787}"
DB="${RAQAT_DB_PATH:-${DB_PATH:-$ROOT/global_clean.db}}"
CONTENT_SECRET="${RAQAT_CONTENT_READ_SECRET:-}"
CONTENT_ACCESS_TOKEN="${RAQAT_CONTENT_ACCESS_TOKEN:-}"

declare -a IMPORT_CMDS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --import-cmd)
      [[ $# -ge 2 ]] || { echo "Missing value for --import-cmd"; exit 2; }
      IMPORT_CMDS+=("$2")
      shift 2
      ;;
    *)
      echo "Unknown arg: $1"
      exit 2
      ;;
  esac
done

mkdir -p .logs
STAMP="$(date +%Y%m%d_%H%M%S)"
LOG=".logs/release_content_pipeline_${STAMP}.log"

{
  echo "[0/4] Context"
  echo "DB=$DB"
  echo "API_BASE=$API_BASE"
  echo "IMPORT_CMDS=${#IMPORT_CMDS[@]}"

  echo
  echo "[1/4] Schema migrations"
  RAQAT_DB_PATH="$DB" DB_PATH="$DB" "$PY" -c "import os; from db.migrations import run_schema_migrations; run_schema_migrations(os.environ['RAQAT_DB_PATH'])"

  if [[ ${#IMPORT_CMDS[@]} -gt 0 ]]; then
    echo
    echo "[2/4] Import commands"
    for cmd in "${IMPORT_CMDS[@]}"; do
      echo ">> $cmd"
      bash -lc "$cmd"
    done
  else
    echo
    echo "[2/4] Import commands skipped (none provided)"
    echo "Hint: pass --import-cmd \"...\" to bind import to this release run."
  fi

  echo
  echo "[3/4] API validate + mobile sync smoke"
  "$PY" scripts/validate_content_release.py \
    --api-base "$API_BASE" \
    --content-secret "$CONTENT_SECRET" \
    --access-token "$CONTENT_ACCESS_TOKEN"

  echo
  echo "[4/4] Done"
  echo "Content release pipeline OK."
} | tee "$LOG"

echo "Log: $LOG"
