# Өндіріс позициясы — архитектура аудитіне жауап (SQLite, Redis, бақылау, AI cache, Celery)

Бұл құжат **сыртқы аудит тезистері** мен репозиторийдегі **нақты күйді** салыстырады: не міндетті, не әзірлеуге ғана, не инфрақұрылымда шешіледі.

---

## 1. SQLite — өндірісте қолданбау

| Тезис | Растау |
|-------|--------|
| SQLite: write lock, шектеулі concurrency, scale жоқ | Дұрыс — файлдық SQLite бір жазу процесіне икемді. |
| **Өндіріс шешімі** | **PostgreSQL** (`DATABASE_URL` / `DATABASE_URL_WRITER`). API `db/get_db.py` — DSN postgres болса SQLite миграциялары өтпейді. |
| Қайда SQLite қалды | Жергілікті әзірлеу, unit тест, көшу алдындағы `global_clean.db` снапшоты. |

**Жұмыс тізбегі:** `docs/MIGRATION_SQLITE_TO_POSTGRES.md`, `scripts/run_pg_cutover.sh`, `docs/OPERATIONS_STACK_CHECKLIST.md` §2.

Кодта «SQLite-ті өндірісте өшіру» — бұл **орта айнымалылары**: postgres DSN қойылғанда SQLite жолы іске қосылмайды; қосымша runtime guard қажет болса, өндірісте `DATABASE_URL` жоқ деп API іске қоспау саясатын CI/CD-де бекіту жеткілікті.

---

## 2. Redis — өндірісте міндетті

| Тезис | Растау |
|-------|--------|
| `RAQAT_REDIS_REQUIRED=0` production үшін дұрыс емес | **Дұрыс.** `=0` **тек** pytest үшін: `tests/conftest.py` API импортында Redis міндетті startup-ты өшіреді. |
| **Өндіріс** | `RAQAT_REDIS_REQUIRED=1` (әдепкі `platform_api/main.py`), `RAQAT_REDIS_URL` міндетті. Redis: rate limit, exact AI cache, Celery broker, семантикалық кэш үшін дерек құрылымы. |

Құжаттағы «optional» түсінік — тек **тест ортасы**; өндіріс чеклисті: `docs/OPERATIONS_STACK_CHECKLIST.md` §1.

---

## 3. Бақылау — `/metrics` база, Prometheus/Grafana — инфра

| Не бар кодта | `GET /metrics` (Prometheus text), `GET /metrics/json`; middleware latency / 5xx. |
| Не жоба кодында | Grafana панельдері, Alertmanager ережелері — **ортаңызда** орнатылады. |

**Ұсыныс:**

1. Prometheus `scrape_configs` → API `:8787/metrics` (`OPERATIONS_STACK_CHECKLIST.md` §5).
2. Grafana — Prometheus datasource.
3. Алерттер: `/ready` 503, `rate(raqat_http_errors_total[5m])`, AI latency histogram, worker heartbeat.

Сенбей қалу мәселесі («қашан құлайды») — **алертинг жоқ** дегенді білдіреді; оны код емес, **observability стек** шешеді.

---

## 4. AI кэш — exact + семантикалық (қосу керек)

| Тезис | Растау |
|-------|--------|
| Тек exact — ақша күйеді | Exact кэш `ai_exact_cache.py` бар. |
| Semantic жоқ | **Бар:** `platform_api/ai_semantic_cache.py`, worker ішінде `cache_get_semantic` / `cache_set_semantic` (`celery_tasks.py`). Қосу: **`RAQAT_AI_SEMANTIC_CACHE=1`** + `GEMINI_API_KEY` (embedding шығыны). |

Өндірісте ұсыныс: **`RAQAT_AI_SEMANTIC_CACHE=1`** және ұқсастық табалдырығын (`RAQAT_AI_SEM_CACHE_MIN_SIM`) баптау; шығынды бақылау.

---

## 5. Celery — retry / timeout бар; DLQ — кеңейту

| Не іске қосылған (`platform_api/celery_app.py`) | `task_time_limit`, `task_soft_time_limit`, `result_expires`, `visibility_timeout`, `broker_transport_options.retry_on_timeout`, `task_max_retries`, `task_default_retry_delay`. |
| `celery_tasks.py` | `RaqatTask`: `autoretry_for` (OSError, ConnectionError, …), exponential backoff; `task_ai_chat` үшін `_maybe_retry_chat` (transient Gemini қателері). |

| Аудит: DLQ жоқ | **Растау:** арнайы dead-letter queue репода әлі толық бөлінбеген. Celery-де әдеті: сәтсіз тапсырмаларды бөлек queue/route арқылы бағыттау немесе Flower/Redis мониторинг. **Келесі фаза** — `task_routes` + `celery.dead` тәрізді кезек + алерт. |

High load кезінде «stuck» — **visibility_timeout** + **soft time limit** кеміту/арттыруды `RAQAT_CELERY_*` арқылы баптау; worker саны мен prefetch (`worker_prefetch_multiplier=1`) қазір консервативті.

---

## Қысқа verdict кестесі

| Сұрақ | Өндіріс позициясы |
|--------|-------------------|
| SQLite | Тек dev/test; **PG міндетті**. |
| Redis | **Міндетті**; `REQUIRED=0` — тек тест. |
| Monitoring | Код `/metrics` береді; **Prometheus + Grafana + alerts** — орнату керек. |
| AI cache | Exact + **семантикалық** (`RAQAT_AI_SEMANTIC_CACHE=1`). |
| Queue | Retry + timeout **бар**; DLQ — жол картасына қосу. |

Сілтемелер: `docs/OPERATIONS_STACK_CHECKLIST.md`, `docs/PLATFORM_GPT_HANDOFF.md` §21–§22.
