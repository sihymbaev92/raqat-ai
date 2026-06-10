# platform_api/app қабаты

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 16. Архитектура update (2026-04-16) — жаңа `platform_api/app` қабаты

Бұл бөлім соңғы енгізілген өзгерістерді (қазіргі сәттегі актуал күйді) бекітеді.

### 16.1 Не қосылды

`platform_api` ішінде жаңа модульдік қабат құрылды:

- `platform_api/app/main.py` — жаңа FastAPI entrypoint
- `platform_api/app/core/config.py` — env-конфигурация (`RAQAT_API_PREFIX`, `CORS_ORIGINS`, `RAQAT_DB_PATH`)
- `platform_api/app/core/response.py` — unified success/error envelope
- `platform_api/app/infrastructure/db.py` — readiness ping
- `platform_api/app/api/v1/router.py` — домендік роутер композициясы
- `platform_api/app/api/v1/endpoints/*` — auth/users/quran/hadith/ai/worship/halal

Қосымша құжат:

- `docs/RAQAT_V1_TECHNICAL_ARCHITECTURE.md` — layered архитектура, AI contract, security/reliability ережелері, next steps.

### 16.2 Үйлесімділік саясаты (compatibility)

Қазіргі production-модель бұзылған жоқ:

- `platform_api/main.py` (ескі MVP entrypoint) сақталды;
- жаңа архитектура параллель енгізілді (`platform_api/app/*`);
- көшу стратегиясы: endpoint-терді кезең-кезеңімен `app/` қабатына тасымалдау.

### 16.3 Жаңа v1 endpoint-тер (қазір жұмыс істейді)

Base: `http://<host>:8788/api/v1` (жаңа entrypoint қолданғанда)

| Метод | Жол | Күйі |
|--------|-----|------|
| POST | `/auth/login` | Жұмыс істейді (bootstrap credentials + JWT pair) |
| POST | `/auth/refresh` | Жұмыс істейді (refresh decode + jti revocation check + rotate) |
| GET | `/users/me` | Жұмыс істейді (Bearer access token claims) |
| GET | `/quran/surahs` | Жұмыс істейді |
| GET | `/quran/search` | Жұмыс істейді |
| GET | `/quran/surahs/{surah}/ayahs` | Жұмыс істейді |
| GET | `/quran/surahs/{surah}/ayahs/{ayah}` | Жұмыс істейді |
| GET | `/hadith/collections` | Placeholder list (v1 scaffold) |
| GET | `/hadith/search` | Жұмыс істейді |
| GET | `/hadith/{hadith_id}` | Жұмыс істейді |

Сервис health/readiness:

- `GET /health`
- `GET /ready`

### 16.4 Auth/identity техникалық деталь

Жаңа `app` auth endpoint-тері бар ортақ механизмдермен жұмыс істейді:

- `auth_credentials.py` — bootstrap credential verify
- `jwt_auth.py` — access/refresh issue/decode
- `db/governance_store.py` — refresh JTI revoke/prune
- `db_reader.resolve_db_path()` — DB орналасуын біріздендіру

Яғни жаңа қабат existing security/data механизмін қайта қолданады (duplicate logic жасалмаған).

### 16.5 Іске қосу командалары (жаңа қабат)

Репо түбінен:

```bash
cd platform_api
uvicorn app.main:app --host 0.0.0.0 --port 8788
```

Тексеру:

- `GET http://127.0.0.1:8788/health`
- `GET http://127.0.0.1:8788/ready`
- `GET http://127.0.0.1:8788/docs`

Ескерту:

- `8787` — legacy `main.py`;
- `8788` — жаңа modular `app.main`.

### 16.6 Қай файлдар нақты қосылды (2026-04-16)

- `docs/RAQAT_V1_TECHNICAL_ARCHITECTURE.md`
- `platform_api/app/__init__.py`
- `platform_api/app/main.py`
- `platform_api/app/core/config.py`
- `platform_api/app/core/response.py`
- `platform_api/app/infrastructure/db.py`
- `platform_api/app/api/v1/router.py`
- `platform_api/app/api/v1/endpoints/auth.py`
- `platform_api/app/api/v1/endpoints/users.py`
- `platform_api/app/api/v1/endpoints/quran.py`
- `platform_api/app/api/v1/endpoints/hadith.py`
- `platform_api/app/api/v1/endpoints/ai.py`
- `platform_api/app/api/v1/endpoints/worship.py`
- `platform_api/app/api/v1/endpoints/halal.py`

### 16.7 Келесі міндетті қадамдар (implementation backlog)

1. `app` қабатына толық JWT deps/policies қосу (scope-level guards).
2. `/ai/chat` — retrieval-grounded pipeline (`ai_proxy.py`) кеңейту, semantic cache (кейін).
3. SQLAlchemy + Alembic (PostgreSQL-first schema) — `docs/ALEMBIC_BOOTSTRAP.md`.
4. `platform_users / sessions / refresh_tokens` толық домен модельдері; **audit:** SQLite миграциясы **010** `audit_events` + `append_audit_event` (`db/governance_store.py`) іске қосылды.
5. **Redis:** AI rate limit multi-worker (`platform_api/ai_rate_limit.py`, `RAQAT_AI_RL_USE_REDIS`), `/ready` ішінде `redis` күйі (`db_reader.readiness_ping`, `app/infrastructure/db.py`); **exact AI cache** (`platform_api/ai_exact_cache.py`, `ai_routes` → `cached` өрісі).
6. **Celery:** `celery_tasks.py` (AI chat / сурет / TTS / transcribe), `ai_routes` **`async_mode`** + **`GET /ai/task/{id}`** — төмен **§21.5**, **§22.2**. Скелет `raqat.ping` + нақты тапсырмалар.
7. `platform_api/main.py` → `app.main` cutover runbook (zero-downtime) — әлі backlog.

Толығырақ жаңа өзгерістер: төмен **§21**, жинақ **§22**.

---
