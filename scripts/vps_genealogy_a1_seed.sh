#!/usr/bin/env bash
# VPS: Alembic A1 migrate + P0 upsert + A1 graph import.
#   cd /opt/raqat-ai && bash scripts/vps_genealogy_a1_seed.sh
set -euo pipefail
ROOT="${RAQAT_ROOT:-/opt/raqat-ai}"
cd "$ROOT"
export PYTHONPATH="${ROOT}:${ROOT}/platform_api:${PYTHONPATH:-}"

if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

PY="${ROOT}/.venv/bin/python"
PIP="${ROOT}/.venv/bin/pip"
if [[ ! -x "$PY" ]]; then
  echo "FAIL: ${PY} not found — run vps_deploy first" >&2
  exit 1
fi

if [[ -f "${ROOT}/requirements-postgres.txt" ]]; then
  "$PIP" install -q -r "${ROOT}/requirements-postgres.txt"
fi

echo "== alembic upgrade head =="
"$PY" -m alembic -c "${ROOT}/alembic.ini" upgrade head

echo "== P0 upsert (genealogy_clans mirror) =="
"$PY" "${ROOT}/scripts/seed_genealogy_p0.py" --postgres

echo "== A1 graph import =="
"$PY" "${ROOT}/scripts/seed_genealogy_a1.py" --skip-alembic

echo "== P2 persons =="
"$PY" "${ROOT}/scripts/seed_genealogy_persons.py" --postgres

echo "== verify A1 tables =="
"$PY" - <<'PY'
from db.get_db import get_db

with get_db() as conn:
    n = conn.execute("SELECT COUNT(*) FROM genealogy_nodes").fetchone()
    e = conn.execute("SELECT COUNT(*) FROM genealogy_edges").fetchone()
    print(f"genealogy_nodes={n[0] if not isinstance(n, dict) else n['count']}")
    print(f"genealogy_edges={e[0] if not isinstance(e, dict) else e['count']}")
PY

echo "OK  genealogy A1 seed complete"
