#!/usr/bin/env bash
# RAQAT өндіріс/ВПС стек: PostgreSQL, Redis, Celery, DNS, мониторинг.
# Бұл скрипт тек қадамдарды шығарады; орындау қолмен немесе CI арқылы.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOC="${ROOT}/docs/OPERATIONS_STACK_CHECKLIST.md"

cat <<EOF
=== RAQAT ops stack (қысқа чеклист) ===
Толығырақ: ${DOC}

EOF

cat <<EOF

1) PostgreSQL cutover (SQLite → PG, PG_DSN қойыңыз):
   export PG_DSN='postgresql://user:pass@host:5432/dbname'
   bash ${ROOT}/scripts/run_pg_cutover.sh
   # содан: DATABASE_URL / DATABASE_URL_WRITER = сол DSN

2) Redis (API + Celery broker):
   # түбір .env:
   RAQAT_REDIS_URL=redis://localhost:6379/0
   RAQAT_CELERY_BROKER_URL=redis://localhost:6379/0
   RAQAT_CELERY_RESULT_BACKEND=redis://localhost:6379/0
   RAQAT_QUEUE_BACKEND=celery
   # Docker: cd ${ROOT}/infra/docker && docker compose up -d redis

3) Celery worker (AI / TTS / сурет async):
   cd ${ROOT}/platform_api
   celery -A celery_app worker --loglevel=info
   # немесе: docker compose --profile workers up -d celery-worker
   # POST /api/v1/ai/* денәсінде "async_mode": true + GET /api/v1/ai/task/{id}

4) DNS (міндетті systemd-resolved түзету):
   sudo bash ${ROOT}/scripts/fix_dns_resolved.sh --apply

5) Мониторинг (Prometheus + JSON):
   curl -s http://127.0.0.1:8787/metrics   # Prometheus scrape (raqat_http_*)
   curl -s http://127.0.0.1:8787/metrics/json
   curl -s http://127.0.0.1:8787/health
   curl -s http://127.0.0.1:8787/ready
   bash ${ROOT}/scripts/healthcheck_raqat.sh
   # логтар: uvicorn stdout + logger id 'raqat_platform_api' (http_request)

EOF
