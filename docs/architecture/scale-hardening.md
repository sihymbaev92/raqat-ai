# Scale hardening

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 17. Scale Hardening Mandates (2026-04-16)

Төмендегі 4 принцип RAQAT үшін **міндетті архитектуралық талап** ретінде бекітілсін.

### 17.1 Stateless API (ең маңызды)

API instance жадысында (in-memory/local state) бизнес-күй сақталмайды.

Міндетті:

- session/auth күйі — token + DB/Redis
- rate-limit counters — Redis
- қысқа AI жад/кэш — Redis
- фондық task күйі — queue backend

Нәтиже: горизонталь масштаб (`N` instance) кезінде consistency сақталады.

### 17.2 Redis (mandatory infrastructure)

Redis енді v1 target stack-тың міндетті бөлігі:

- AI rate limiting (**ZSET**, multi-worker — `ai_rate_limit.py`, §21.2)
- session/cache layer
- prayer/halal/AI short cache
- **AI exact chat cache** (`ai_exact_cache.py`, §21.2)
- queue coordination (broker/backend; Celery скелеті §21.5)

Критерий:

- Redis жоқ болса, сервис degraded деп белгіленуі тиіс;
- critical path DB-only режимінде қалмауы керек.

Толық env және файл жолдары: **§21.2–21.5**.

### 17.3 Queue System (async-first for heavy work)

Heavy процестер synchronous request жолынан шығарылады:

- AI heavy inference
- image analysis
- TTS generation
- notifications
- analytics aggregation

Ұсынылған стек:

- Celery + Redis (қазіргі baseline)
- болашақта қажет болса RabbitMQ/Kafka

### 17.4 Failover / Fallback policy

Бір сервистің ақауы бүкіл экожүйені құлатпауға тиіс:

- AI down -> Qur'an/Hadith read API жалғасады
- queue down -> sync fallback немесе graceful "accepted/degraded" жауап
- Redis down -> қысқа мерзім degraded mode (alert), critical flows continue
- API down -> bot limited fallback mode (read-only/basic)

SLO-ға әсер ететін барлық деградация audit/monitoring арқылы тіркелуі тиіс.

### 17.5 Қазіргі код базасына енгізілген минимал база

`platform_api/app` ішінде бастапқы hardening scaffold қосылған:

- `app/infrastructure/redis_client.py`
- `app/infrastructure/cache.py`
- `app/infrastructure/queue.py`
- `app/api/v1/endpoints/ai.py` (`async_mode`, queue attempt, graceful fallback, short cache)
- `app/core/config.py` (`RAQAT_REDIS_URL`, `RAQAT_QUEUE_BACKEND`, `RAQAT_FAILOVER_MODE`)

Ескерту: бұл — foundation layer; нақты **`ai_routes`** (`async_mode`, Celery) және **`/metrics`** production жолында; `app/api/v1/endpoints/ai.py` — scaffold/queue үлгісі. Толық hardening: policy guards, circuit breaker, retries, Sentry — келесі фаза. Толығырақ: **§22**.

---
