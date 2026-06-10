#!/usr/bin/env bash
# Локальды Backend топ: PostgreSQL + Redis (docker compose) + smoke.
# Usage: bash scripts/bootstrap_dev_pg_redis.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE="${ROOT}/infra/docker/docker-compose.yml"
PG_DSN="${PG_DSN:-postgresql://raqat:raqat_dev@127.0.0.1:5432/raqat}"
REDIS_URL="${RAQAT_REDIS_URL:-redis://127.0.0.1:6379/0}"

echo "== RAQAT Backend bootstrap: PostgreSQL + Redis =="

if ! command -v docker >/dev/null 2>&1; then
  echo "ERR: docker жоқ — infra/docker/docker-compose.yml қолдану мүмкін емес"
  exit 1
fi

docker compose -f "$COMPOSE" up -d postgres

echo "Күту: postgres health..."
for i in $(seq 1 30); do
  if docker compose -f "$COMPOSE" exec -T postgres pg_isready -U raqat -d raqat >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Windows: 6379/6380 Hyper-V excluded port range — 16379 fallback
REDIS_HOST_PORT="${RAQAT_REDIS_HOST_PORT:-6379}"
if ! docker compose -f "$COMPOSE" up -d redis 2>/dev/null; then
  docker rm -f raqat-redis 2>/dev/null || true
  REDIS_HOST_PORT=16379
  docker run -d --name raqat-redis --restart unless-stopped \
    -p "${REDIS_HOST_PORT}:6379" redis:7-alpine redis-server --appendonly yes
fi

REDIS_URL="${RAQAT_REDIS_URL:-redis://127.0.0.1:${REDIS_HOST_PORT}/0}"

echo ""
echo "OK  PostgreSQL: $PG_DSN"
echo "OK  Redis:      $REDIS_URL"
echo ""
echo "Түбір .env-ке қосыңыз:"
echo "  DATABASE_URL=$PG_DSN"
echo "  DATABASE_URL_WRITER=$PG_DSN"
echo "  RAQAT_REDIS_URL=$REDIS_URL"
echo "  RAQAT_REDIS_REQUIRED=1"
echo "  RAQAT_QUEUE_BACKEND=celery"
echo "  RAQAT_CELERY_BROKER_URL=$REDIS_URL"
echo "  RAQAT_CELERY_RESULT_BACKEND=$REDIS_URL"
echo ""
echo "Келесі қадам (Backend A2):"
echo "  export PG_DSN='$PG_DSN'"
echo "  bash scripts/run_pg_cutover.sh --validate-only"
echo ""
echo "API smoke (Redis қосулы .env-пен):"
echo "  bash scripts/dev_restart_platform.sh"
echo "  bash scripts/healthcheck_raqat.sh"
