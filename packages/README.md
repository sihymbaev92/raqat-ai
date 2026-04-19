# RAQAT — `packages/` (домендік модульдер)

[`PRODUCTION_BLUEPRINT_2M_USERS.md`](../docs/PRODUCTION_BLUEPRINT_2M_USERS.md): **modular monolith** — шекаралар `packages/*` ішінде, deploy бір образ/процесс ретінде қалады.

## Жоспарланған пакеттер

| Пакет | Мазмұны (мақсат) | Қазіргі код (түбір) |
|-------|------------------|---------------------|
| `core` | ортақ типтер, қателер, нәтиже envelope | `platform_api/app/core/` |
| `auth` | JWT, sessions, link telegram | `platform_api/auth_*.py`, `jwt_*`, `app/api/v1/endpoints/auth.py` |
| `quran` | сүре/аят, іздеу | `platform_api/content_reader.py`, `app/api/v1/endpoints/quran.py`, `db/quran_repo.py` |
| `hadith` | хадис корпусы | `handlers/hadith.py`, `app/api/v1/endpoints/hadith.py` |
| `ai` | прокси, rate limit, orchestration | `platform_api/ai_*.py`, `ai_multimodal.py` |
| `prayer` | намаз уақыты | `services/prayer_times_service.py`, `app/api/v1/endpoints/worship.py` |
| `qibla` | құбыла есебі | `services/qibla_service.py`, `handlers/qibla.py` |
| `notifications` | push, fanout | `services/prayer_notifications` (mobile), бот хабарламалары |
| `billing` | кейінгі фаза | — |
| `observability` | лог, метрикалар | `.logs/`, health/readiness |

Қазір **физикалық пакеттер құрылмады** — бұл «келесі қадам» картасы. Python үшін `pip install -e packages/quran` сияқты құрылым Alembic + PG көшумен бірге енгізіледі.

## Build order (blueprint)

1. PostgreSQL толық көшу  
2. SQLAlchemy + Alembic  
3. Redis — **басталды:** `docker compose`, `RAQAT_REDIS_URL`, AI rate limit (`RAQAT_AI_RL_USE_REDIS`), `/ready` → `redis`, **AI exact cache** (`RAQAT_AI_EXACT_CACHE`), **audit_events** (миграция 010), **Celery** (`celery_app.py`, compose profile `workers`)  
4. `packages/` ішіне доменді бөлу (импорт графын кішірейту)
