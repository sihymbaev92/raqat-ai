# RAQAT: стек орнату чеклисті (Redis, PostgreSQL, Celery, DNS, тексеру)

**Өндіріс vs әзірлеу (аудит жауабы):** [`PRODUCTION_POSTURE.md`](./PRODUCTION_POSTURE.md) — SQLite/Redis/бақылау/AI cache/Celery нақты шешімдері.

Қысқа нұсқау: [`scripts/ops_stack_checklist.sh`](../scripts/ops_stack_checklist.sh) терминалда қадамдарды шығарады.

## Жылдам тізбек (келесі қадамдар)

1. **Redis** — `.env`-те `RAQAT_REDIS_URL`; өндірісте `RAQAT_REDIS_REQUIRED=1`; `docker compose ... up -d redis` немесе өз серверіңіз.
2. **API** — Redis дайын болғаннан кейін `uvicorn` / [`run_platform_api.sh`](../scripts/run_platform_api.sh); іске қосылмаса логта Redis қатесі болады.
3. **Celery worker** — `cd platform_api && celery -A celery_app worker --loglevel=info` (немесе compose `--profile workers`).
4. **Prometheus** — `curl -s http://127.0.0.1:8787/metrics` және таргетті Prometheus-қа қосу (толығы төмен §5).
5. **Семантикалық кэш** (қажет болса) — `RAQAT_AI_SEMANTIC_CACHE=1`, `GEMINI_API_KEY` бар екенін тексеру.
6. **PostgreSQL** — әлі SQLite болса: `export PG_DSN=...` → `bash scripts/run_pg_cutover.sh --apply` → `.env`-те `DATABASE_URL`.

## 1. Ортаңызды жинақтаңыз

Түбір `.env`:

- **`RAQAT_REDIS_URL=redis://localhost:6379`** (немесе `/0` индексі: `redis://localhost:6379/0` — автоматты нормалдау)
- **`RAQAT_REDIS_REQUIRED=1`** (әдепкі) — Redis жоқ болса **API іске қосылмайды**. Тек тест: `RAQAT_REDIS_REQUIRED=0`
- `RAQAT_QUEUE_BACKEND=celery`
- `RAQAT_CELERY_BROKER_URL`, `RAQAT_CELERY_RESULT_BACKEND` (әдетте Redis-пен бір)
- `RAQAT_CELERY_RESULT_EXPIRES_SEC` (әдетті нәтиже TTL, мысалы `3600`)
- `GEMINI_API_KEY` — AI + **семантикалық кэш embedding** үшін
- PostgreSQL болса: `DATABASE_URL` / `DATABASE_URL_WRITER`

**Семантикалық AI кэш (embedding):** `RAQAT_AI_SEMANTIC_CACHE=1`, опция `RAQAT_AI_SEM_CACHE_MIN_SIM` (0.88), `RAQAT_AI_EMBED_MODEL` (әдепкі `text-embedding-004`).

Redis:

```bash
docker compose -f infra/docker/docker-compose.yml up -d redis
```

(немесе өз Redis инстансы.)

## 2. PostgreSQL (егер әлі SQLite болса)

```bash
export PG_DSN='postgresql://user:pass@host:5432/dbname'
bash scripts/run_pg_cutover.sh --apply
```

(`--apply` әдепкі; тек аудит: `--validate-only`.) Содан `.env` ішінде `DATABASE_URL` / `DATABASE_URL_WRITER` = сол DSN.

## 3. DNS (серверде, керек болса ғана)

```bash
sudo bash scripts/fix_dns_resolved.sh --apply
```

## 4. API + Celery

- **API:** `platform_api` ішінен uvicorn (мысалы [`scripts/run_platform_api.sh`](../scripts/run_platform_api.sh) немесе systemd).
- **Worker:**

```bash
cd platform_api && celery -A celery_app worker --loglevel=info
```

немесе:

```bash
docker compose -f infra/docker/docker-compose.yml --profile workers up -d celery-worker
```

Worker үшін `GEMINI_API_KEY` және дерекқор DSN API-пен бірдей ортада болуы керек (түбір `.env` немесе контейнер `environment`).

Celery өндіріс: exponential backoff retry (транзиент қателер), `result_expires`, `visibility_timeout`, `task_time_limit` — `platform_api/celery_app.py` + `RAQAT_CELERY_*` айнымалылары.

## 5. Тексеру және Prometheus

```bash
bash scripts/healthcheck_raqat.sh
curl -s http://127.0.0.1:8787/metrics
curl -s http://127.0.0.1:8787/metrics/json
```

- **`GET /metrics`** — Prometheus text (`prometheus_client`): `raqat_http_requests_total`, `raqat_http_errors_total`, `raqat_http_request_duration_seconds`, `raqat_ai_chat_duration_seconds`.
- **`GET /metrics/json`** — бұрынғы JSON терезесі (uptime, 5xx, latency).

Prometheus `prometheus.yml` мысалы:

```yaml
scrape_configs:
  - job_name: raqat_api
    static_configs:
      - targets: ["127.0.0.1:8787"]
    metrics_path: /metrics
```

PromQL мысалдары:

- сұрау/сек: `rate(raqat_http_requests_total[1m])`
- қате: `rate(raqat_http_errors_total[1m])`
- AI latency: `histogram_quantile(0.95, rate(raqat_ai_chat_duration_seconds_bucket[5m]))`

**Async AI (бір рет):**

1. `POST /api/v1/ai/chat` денесі: `"async_mode": true`
2. Жауаптағы `task_id` бойынша: `GET /api/v1/ai/task/{task_id}`

## 6. Бот / мобильді клиент (AI async керек болса)

HTTP шақыруларға `async_mode: true` және нәтижені `GET /api/v1/ai/task/...` арқылы poll — өндіріске өткенде қосылады; API дайын.
