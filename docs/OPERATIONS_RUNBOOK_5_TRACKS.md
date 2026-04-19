# Operations runbook — бес инженерлік бағыт (PG cutover, JWT, Redis/cache, mobile sync, app.main)

Бұл құжат сыртқы GPT/инженерге **бірден орындалатын** қадамдарды береді. **Репозиториймен сәйкестік** төмендегі блокта — сыртқы нұсқаудағы `--pg` / `migrate_sqlite_to_postgres.py` түбірден сияқты айырмашылықтарды осы жерден түзетіңіз.

---

## Репозиториймен сәйкестік (маңызды)

| Сыртқы нұсқау | Нақты репо |
|----------------|--------------|
| `migrate_sqlite_to_postgres.py` түбірде | **`scripts/migrate_sqlite_to_postgres.py`** |
| `--pg "$PG_DSN"` | **`--pg-dsn "$PG_DSN"`** (миграция CLI) |
| `bash scripts/run_pg_cutover.sh --apply` | **`--apply`** қосымша; **аргументсіз** = толық pipeline (бұрынғыдай) |
| `--validate-only` dry-run | **`bash scripts/run_pg_cutover.sh --validate-only`** немесе `python scripts/validate_pg_copy.py …` |
| `scripts/smoke_platform_api.py` | **қосылды** — төмен §5 |
| `scripts/smoke_cutover_validate.py` | **қосылды** — миграция валидациясы + HTTP smoke |
| Redis + exact cache «жоспар» | **көптегені іске қосылған** — `platform_api/ai_exact_cache.py`, `redis_client.py`, `ai_rate_limit.py`, `docs/PLATFORM_GPT_HANDOFF.md` §21 |
| `tests/test_auth_link.py` | `/auth/link/telegram` бот құпиясы, uuid claim, bootstrap Bearer 400 |

---

## 1. PostgreSQL cutover

**Мақсат:** SQLite → PostgreSQL бір реттік көшу немесе `bootstrap + validate`, содан кейін қолданбаны DSN арқылы PG-ға бағыттау; rollback — env + restart.

### 1.1 Дайындық

- `.env`: `DATABASE_URL` немесе `DATABASE_URL_WRITER` / `DATABASE_URL_READER`; опция: `RAQAT_PG_USE_POOL`, `RAQAT_PG_POOL_MIN` / `RAQAT_PG_POOL_MAX`.
- `backups/` жазылатын (немесе `scripts/backup_sqlite.sh` өзі `mkdir` жасайды — скриптті қараңыз).
- Пакет: `pip install -r scripts/requirements-pg-migrate.txt` (немесе `requirements-postgres.txt`).

### 1.2 Audit (`?` → `%s` және SQLite-only)

```bash
cd /path/to/raqat_bot
.venv/bin/python scripts/audit_sql_placeholders.py
```

Назар: `db/`, `platform_api/`, `handlers/`, `services/`, `db/dialect_sql.py`.

### 1.3 SQLite сақтық көшірме

```bash
bash scripts/backup_sqlite.sh
# немесе:
# cp global_clean.db backups/global_clean.db.$(date +%Y%m%d%H%M%S)
```

### 1.4 Dry-run (көшірмесіз, тек салыстыру)

```bash
export PG_DSN='postgresql://user:pass@pg-host:5432/raqat_staging'
bash scripts/run_pg_cutover.sh --validate-only
```

Немесе тікелей:

```bash
.venv/bin/python scripts/migrate_sqlite_to_postgres.py \
  --sqlite ./global_clean.db \
  --pg-dsn "$PG_DSN" \
  --validate-only
```

### 1.5 Migrate (DDL + дерек)

```bash
export PG_DSN='postgresql://user:pass@pg-host:5432/raqat_prod'
bash scripts/run_pg_cutover.sh --apply
```

Немесе тікелей (мысал, тест PG-да тазалау):

```bash
.venv/bin/python scripts/migrate_sqlite_to_postgres.py \
  --sqlite ./global_clean.db \
  --pg-dsn "$PG_DSN" \
  --bootstrap-ddl \
  --with-quran-hadith \
  --truncate \
  --validate
```

`--truncate` **қауіпті** — тек бос/тест схемасында. Advisory lock әдепкі қосулы (`migrate_sqlite_to_postgres.py`).

### 1.6 Валидация скрипттері

```bash
.venv/bin/python scripts/validate_pg_copy.py --sqlite ./global_clean.db --pg-dsn "$PG_DSN"
# немесе --pg (синоним)
```

Интеграциялық pytest (PG DSN орнатылғанда): `pytest tests/test_pg_migrate_integration.py -m integration -v` (`MIGRATION_SQLITE_TO_POSTGRES.md` §13.1).

### 1.7 Қолданбаны ауыстыру

- `.env.production`: `DATABASE_URL` = PG DSN (немесе writer DSN).
- Қалғаны бұрынғыдай: `RAQAT_READINESS_REQUIRE_REDIS`, пул env (`RAQAT_PG_USE_POOL=1`, т.б.).
- Қызметті қайта іске қосу: `bash scripts/dev_restart_platform.sh` немесе systemd бірлігі.

### 1.8 Post-cutover smoke

```bash
curl -fsS http://127.0.0.1:8787/health
curl -fsS http://127.0.0.1:8787/ready
.venv/bin/python scripts/smoke_platform_api.py --api-base http://127.0.0.1:8787 --content-secret "$RAQAT_CONTENT_READ_SECRET"
RAQAT_SMOKE_AUTH_PASSWORD='...' .venv/bin/python scripts/smoke_platform_api.py --api-base http://127.0.0.1:8787 --auth-login
```

Толық JWT + тарих: **локальды** `TestClient` арқылы:

```bash
RAQAT_DB_PATH=./global_clean.db .venv/bin/python scripts/dev_verify_platform_flow.py
```

Көшу + API бір терезеде:

```bash
.venv/bin/python scripts/smoke_cutover_validate.py --sqlite ./global_clean.db --pg-dsn "$PG_DSN" --api-base http://127.0.0.1:8787
```

### 1.9 Rollback

- Env-те `DATABASE_URL` босату немесе SQLite `DB_PATH` / `RAQAT_DB_PATH` қалдыру; сақтық көшірмеден `global_clean.db` қалпына келтіру.
- Қызметті қайта іске қосу.
- PG-да жазбалар қалса — талдау үшін сақтау; split-write болды ма — қолмен reconcile жоспары.

### 1.10 Негізгі файл жолдары

| Файл |
|------|
| `docs/MIGRATION_SQLITE_TO_POSTGRES.md` |
| `scripts/audit_sql_placeholders.py` |
| `scripts/backup_sqlite.sh` |
| `scripts/copy_quran_hadith_full.sh` |
| `scripts/migrate_sqlite_to_postgres.py` |
| `scripts/run_pg_cutover.sh` |
| `scripts/validate_pg_copy.py` |
| `scripts/smoke_cutover_validate.py` |
| `platform_api/db_reader.py` |
| `db/dialect_sql.py` |
| `scripts/nightly_maintenance.sh` |

---

## 2. JWT linking (бот → platform → мобильді)

**Мақсат:** `POST /api/v1/auth/link/telegram` + `X-Raqat-Bot-Link-Secret` → access (және refresh, егер схемада бар) → `user_preferences` / secure storage.

### 2.1 Env

- `RAQAT_BOT_LINK_SECRET`, `RAQAT_JWT_SECRET` (≥32), `RAQAT_JWT_EXPIRE_MINUTES`
- `RAQAT_PLATFORM_API_BASE` (ботта)
- Админ bootstrap: `RAQAT_AUTH_USERNAME` / `RAQAT_AUTH_PASSWORD` (жоба конфигіне қараңыз)

### 2.2 Curl (бот сыры)

```bash
curl -fsS -X POST "${RAQAT_PLATFORM_API_BASE}/api/v1/auth/link/telegram" \
  -H "X-Raqat-Bot-Link-Secret: ${RAQAT_BOT_LINK_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"telegram_user_id": 123456789}'
```

### 2.3 Код жолдары

| Файл |
|------|
| `platform_api/auth_routes.py` |
| `db/platform_identity_chat.py` |
| `handlers/start.py`, `services/platform_link_service.py` (бар болса) |
| `platform_api/jwt_auth.py` |
| `db/governance_store.py` (refresh JTI) |

### 2.4 Тест

- **`scripts/dev_verify_platform_flow.py`** — link → ai/chat (mock) → `/users/me/history` + DB оқу.
- **`tests/test_auth_link.py`** — `/auth/link/telegram` контракты.

---

## 3. Redis + AI exact cache

**Күй:** exact cache, rate limit ZSET, readiness Redis — негізінен орнатылған.

### 3.1 Env (мысал)

- `RAQAT_REDIS_URL`
- `RAQAT_AI_EXACT_CACHE` (`0`/`off` өшіру)
- `RAQAT_AI_CACHE_TTL_SECONDS`, `RAQAT_AI_CACHE_MAX_CHARS`
- `RAQAT_READINESS_REQUIRE_REDIS`
- Celery: `RAQAT_CELERY_BROKER_URL` (пайдаланса)

### 3.2 Тест

```bash
docker run -d --name raqat-redis -p 6379:6379 redis:7
export RAQAT_REDIS_URL=redis://127.0.0.1:6379/0
# API іске қосылған соң:
# POST /api/v1/ai/chat бір prompt екі рет — екіншісінде "cached": true
```

Файлдар: `platform_api/app/infrastructure/redis_client.py`, `ai_exact_cache.py`, `ai_routes.py`, `ai_rate_limit.py`, `db_reader.py` / `app/infrastructure/db.py` (readiness нұсқасына қарай).

---

## 4. Mobile content sync (ETag / since)

**Сервер:** `GET /api/v1/metadata/changes` — `ETag`, `Last-Modified`, `since`, `If-None-Match` → 304.

### 4.1 Клиент жолдары

| Файл |
|------|
| `mobile/src/services/platformApiClient.ts` |
| `mobile/src/services/contentSync.ts` |
| `platform_api/content_routes.py`, `content_reader.py` |

### 4.2 Серверді жылдам тексеру

```bash
.venv/bin/python scripts/smoke_platform_api.py --api-base "$URL" --content-secret "$SECRET" --metadata
```

---

## 5. Zero-downtime: `main.py` (8787) → `app.main` (8788)

**Стратегия:** nginx / балансер артында blue/green — жаңа инстанс басқа портта, денсаулық тексерілген соң upstream ауыстыру.

### 5.1 Жаңа инстанс

```bash
cd platform_api
uvicorn app.main:app --host 127.0.0.1 --port 8788 --workers 2
```

### 5.2 Health

```bash
curl -fsS http://127.0.0.1:8788/health
curl -fsS http://127.0.0.1:8788/ready
```

**Ескерту:** `app.main` жауабы `{ "success": true, "data": { ... } }` пішінінде болуы мүмкін; legacy `main.py` — түзу `ok`. `scripts/smoke_platform_api.py` екі пішінді де тануға тырысады.

### 5.3 Smoke

```bash
.venv/bin/python scripts/smoke_platform_api.py --api-base http://127.0.0.1:8788
```

### 5.4 Rollback

- nginx upstream қайта eski портқа (`8787`).
- `nginx -t && nginx -s reload` (нақты жол жүйеңізге сәйкес).

### 5.5 Үйлестіру файлы

- `platform_api/main.py`, `platform_api/app/main.py`
- `infra/docker/`, systemd unit (бар болса)
- CI entrypoint өзгерту

---

## Қосымша: read-only терезе / dual-write

Өндірісте split-write қаупін азайту үшін қысқа **жазбаны тоқтату** терезесі немесе **dual-write + validate** паттерні `MIGRATION_SQLITE_TO_POSTGRES.md` және өнімдік саясатпен қоса жоспарланады — осы runbookта тек сілтеме; толық сценарийді жоба басшысымен келісіңіз.

---

## Жаңарту

Соңғы түгендеу: репо ішіндегі скрипт атауларымен келісімді сақтау үшін осы файлды **PR кезінде** `MIGRATION_SQLITE_TO_POSTGRES.md` / `PLATFORM_GPT_HANDOFF.md` кестелерінен бір реттік сілтеме арқылы жаңартыңыз.
