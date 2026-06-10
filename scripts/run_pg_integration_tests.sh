#!/usr/bin/env bash
# PostgreSQL integration tests (Docker postgres + migrate validate).
#
#   bash scripts/run_pg_integration_tests.sh
#   bash scripts/run_pg_integration_tests.sh --no-docker   # контейнер қазірдің өзінде істеп тұр
#
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

DSN="${RAQAT_PG_TEST_DSN:-postgresql://postgres:postgres@127.0.0.1:5432/raqat_test}"
CONTAINER="${RAQAT_PG_TEST_CONTAINER:-raqat-pg-test}"
COMPOSE_FILE="${REPO_ROOT}/infra/docker/docker-compose.pg-test.yml"
USE_DOCKER=1

for arg in "$@"; do
  case "$arg" in
    --no-docker) USE_DOCKER=0 ;;
    --help|-h)
      echo "Usage: bash scripts/run_pg_integration_tests.sh [--no-docker]"
      echo "  RAQAT_PG_TEST_DSN=$DSN"
      exit 0
      ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker жоқ — Docker Desktop іске қосыңыз." >&2
  exit 1
fi

if [[ "$USE_DOCKER" == "1" ]]; then
  if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
      echo "== start existing container: $CONTAINER =="
      docker start "$CONTAINER" >/dev/null
    fi
  else
    echo "== docker compose up: $COMPOSE_FILE =="
    docker compose -f "$COMPOSE_FILE" up -d
  fi

  echo "== wait for postgres =="
  for _ in $(seq 1 40); do
    if docker exec "$CONTAINER" pg_isready -U postgres -d raqat_test >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  if ! docker exec "$CONTAINER" pg_isready -U postgres -d raqat_test >/dev/null 2>&1; then
    echo "ERROR: postgres дайын емес ($CONTAINER)" >&2
    docker logs "$CONTAINER" 2>&1 | tail -20
    exit 1
  fi
fi

echo "== pip: requirements-postgres.txt =="
python -m pip install -q -U pip
python -m pip install -q -r requirements-postgres.txt

export RAQAT_PG_TEST_DSN="$DSN"
echo "== pytest integration (DSN=$DSN) =="
python -m pytest tests/test_pg_migrate_integration.py -m integration -v "$@"
