# Redis, Celery, AI cache, audit

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 21. Экожүйе, Redis, AI cache, audit, Celery, Telegram күту (2026-04-16 жаңарту)

Бұл бөлім GPT/инженер үшін **соңғы код күйін** бекітеді: репо құрылымы, орталық API оптимизациясы, боттың сынбауы мен ұзақ күтпеуі.

### 21.1 Репозиторий картасы (modular monolithқа дайындық)

| Элемент | Сипат |
|---------|--------|
| `ECOSYSTEM.md` | Түбірде: қалталар кестесі, Docker, build order сілтемесі |
| `apps/` | Blueprint карта: `apps/api/README.md` → нақты `platform_api/`, `apps/bot`, `apps/mobile` → `mobile/`, т.б. |
| `packages/` | Келешек Python домен пакеттері (қазір `.gitkeep` + `README.md`) |
| `infra/docker/docker-compose.yml` | PostgreSQL 16 + Redis 7; **Celery** `celery-worker` сервисі профиль **`workers`** |
| `docs/PRODUCTION_BLUEPRINT_2M_USERS.md` | 2M+ user архитектуралық карта |
| `docs/ALEMBIC_BOOTSTRAP.md` | Alembic бастау, PG үшін `audit_events` DDL |

### 21.2 Redis (platform_api)

| Айнымалы / файл | Мазмұны |
|------------------|---------|
| `RAQAT_REDIS_URL` | Әдепкі `redis://127.0.0.1:6379/0`; `app/core/config.py` → `settings.redis_url` |
| `platform_api/app/infrastructure/redis_client.py` | `get_redis_client()`, ping сәтті болса клиент кэште |
| `platform_api/ai_rate_limit.py` | Redis **ZSET** sliding window (`raqat:ai_rl:v1:…`); `RAQAT_AI_RL_USE_REDIS=0` → in-memory fallback |
| `platform_api/db_reader.py` → `/ready` | Жауапқа **`redis`** блогы (`ok` / `unavailable`); `RAQAT_READINESS_REQUIRE_REDIS=1` болса Redis жоқта **`ok: false`** |
| `platform_api/ai_exact_cache.py` | L1 **exact** prompt→жауап кэші; `RAQAT_AI_EXACT_CACHE`, `RAQAT_AI_CACHE_TTL_SECONDS`, `RAQAT_AI_CACHE_MAX_CHARS` |
| `platform_api/ai_routes.py` | `/ai/chat` алдымен кеш, содан `generate_ai_reply`; жауапта **`cached`: bool** |

### 21.3 AI proxy жылдамдығы (Gemini)

| Файл | Өзгеріс |
|------|---------|
| `platform_api/ai_proxy.py` | `thinking_budget=0`, `RAQAT_AI_MAX_OUTPUT_TOKENS`, Google Search өшік кезде де `GenerateContentConfig`; қысқартылған structure rules |
| `services/genai_service.py` | Тікелей Gemini шақыруда да сол thinking + max_output; `RAQAT_AI_MAX_OUTPUT_TOKENS` |

### 21.4 Audit (SQLite миграция 010)

| Элемент | Сипат |
|---------|--------|
| `db/migrations.py` | `_migration_010_audit_events` — кесте `audit_events` + индекстер |
| `db/governance_store.py` | `append_audit_event(...)` — AI чат соңында шақырылады |
| PostgreSQL | Кестені қолмен/Alembic қосу: `docs/ALEMBIC_BOOTSTRAP.md` ішіндегі DDL мысалы |

### 21.5 Celery

| Элемент | Сипат |
|---------|--------|
| `platform_api/celery_app.py` | `Celery("raqat")`, broker=`RAQAT_CELERY_BROKER_URL` \| `RAQAT_REDIS_URL`, result backend, task **`raqat.ping`** (smoke), `task_track_started`, уақыт шектеулері |
| `platform_api/celery_tasks.py` | **`raqat.ai.chat`**, **`raqat.ai.analyze_image`**, **`raqat.ai.tts`**, **`raqat.ai.transcribe`** — Gemini/кэш/audit worker ішінде |
| `platform_api/app/infrastructure/queue.py` | Бір ортақ `celery_app.send_task` (бұрынғы жаңа `Celery()` дубликаты жойылған) |
| `ai_routes.py` | Денеде **`async_mode`: true** → `task_id`; **`GET /api/v1/ai/task/{task_id}`** — нәтиже |
| `infra/docker/docker-compose.yml` | `celery-worker` профиль **`workers`**, `RAQAT_QUEUE_BACKEND=celery` |
| `.env.example` | `RAQAT_QUEUE_BACKEND`, `RAQAT_CELERY_BROKER_URL`, `RAQAT_CELERY_RESULT_BACKEND` |
| `docs/OPERATIONS_STACK_CHECKLIST.md` | Worker іске қосу, GEMINI/DB ортасының worker-де де болуы |

### 21.6 Telegram бот — сынбау және ұзақ күтпеу

| Файл | Мазмұны |
|------|---------|
| `services/telegram_ai.py` | `ask_genai_telegram` — `asyncio.wait_for` + timeout/exception жұмсақ жауап |
| `config/settings.py` | `RAQAT_PLATFORM_AI_HTTP_TIMEOUT` (httpx оқу, әдепкі ~52 с), `RAQAT_BOT_AI_WAIT_TOTAL` (бот, әдепкі ~68 с) |
| `services/genai_service.py` | Platform `/ai/chat` шақыруы осы HTTP timeout-пен шектеледі |
| `handlers/ai_chat.py`, `handlers/halal.py`, `handlers/voice.py` | Барлығы `ask_genai_telegram` пайдаланады; күту хабарламасы: **«Жауап дайындалуда…»** |
| `handlers/ai_chat.py` | `append_telegram_ai_turn` және жауап жіберу бөлек try/except |

### 21.7 Expo / мобильді (қысқа)

| Тақырып | Файл |
|---------|------|
| Вебте браузер «артқа» | `mobile/App.tsx` → `linking={raqatLinking}`, `mobile/src/navigation/linking.ts` |
| Құран сүре атауы KK | `mobile/src/constants/surahTitleKk.ts`, `surahBundledMeta.ts` |
| `QuranSurah` deep link | `route.params.englishName` / `arabicName` опциялы; `useLayoutEffect` title |
| Офлайн Құран + UI жауаптығы | `bundledQuranSeed.ts` (`runWhenHeavyWorkAllowed` → `utils/uiDefer.ts`), тізім/сүре: кеш барда фондық сидинг |
| Күнделікті аят | `DailyAyahScreen` — араб кеште болса сидингсіз |

### 21.8 Тазалау (репо)

- Логтар (`*.log`, `.logs/`, `logs/`), `__pycache__` жойылды; `.gitignore` → `logs/`.
- **`reset_working_bot.sh`**, **`setup_raqat.sh`** жойылды (ескі scaffold, нақты файлдарды үстінен жазатын болған).

### 21.9 Келесі инженерлік басымдық (қысқа)

1. Semantic AI cache — **опциялық қосылған**: `RAQAT_AI_SEMANTIC_CACHE`, embedding/Gemini ортасы; `ai_semantic_cache.py`, `OPERATIONS_STACK_CHECKLIST.md`.  
2. PostgreSQL толық cutover + Alembic ревизиялары (`run_pg_cutover.sh`, `OPERATIONS_STACK_CHECKLIST.md`).  
3. `platform_api/main.py` → `app.main` өндіріс cutover runbook.  
4. Бот/мобильді клиенттерде **`async_mode`** + poll (`/ai/task/...`) — қажет болса өндіріс UX-ге қосу (API дайын).

---
