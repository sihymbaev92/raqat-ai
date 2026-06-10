# Тесттер

> Ағымдағы құжат. Архив: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md).

---

## Жинақтау

| Қабат | Орны | Іске қосу |
|-------|------|-----------|
| **Platform API + bot** | `tests/test_*.py` | `python -m pytest tests` (repo түбі) |
| **Fixtures** | `tests/fixtures/` | HTML парсер тесттері (fatua/muftyat) |
| **Mobile unit** | `mobile/src/**/__tests__/*.test.ts` | `cd mobile && npm run test:full` |
| **Mobile e2e** | `mobile/e2e/` | `npm run e2e:test:emu` (жергілікті) |

**Орнату (Python):**

```bash
pip install -r requirements.txt
# немесе: pip install -r platform_api/requirements.txt -r scripts/requirements-dev.txt
python -m pytest tests
```

**Windows subset:** `scripts/run_pytest_portable.ps1`

**Mobile:**

```bash
cd mobile
npm run test:full   # tsc --noEmit + jest --ci
npm test            # jest only
```

**Android release phone smoke (нақты телефон):**

```powershell
cd mobile
npm run build:apk
npm run qa:android:release
```

Бұл smoke script `adb` арқылы release APK орнатады, Android 13+ notification permission береді, exact-alarm settings ашады, app launch жасайды және намаз notification diagnostics үшін қабылдау checklist шығарады. Fresh install QA үшін телефонда USB debugging қосулы болсын; Android 12+ құрылғыда exact alarm және battery restriction баптауларын қолмен растаңыз.

---

## Негізгі Python тесттер

- `tests/test_platform_api.py` — health, `/ready`, auth, AI, metadata ETag
- `tests/test_migrations.py` — DB миграциялар
- `tests/test_auth_link.py` — Telegram link flow
- `tests/test_islamic_kb.py`, `test_islamic_kb_browse.py`, `test_islamic_kb_home_feed.py` — Islamic KB + home feed parser
- `tests/test_ai_reply_guards.py` — AI degraded reply detection
- `tests/conftest.py` — SQLite fixture, `RAQAT_REDIS_REQUIRED=0`

---

## CI

- `.github/workflows/refactor-smoke.yml` — py_compile, subset pytest, **mobile Jest**
- `.github/workflows/content-release-smoke.yml` — content release validation (sqlite + postgres)

---

## PostgreSQL integration (Docker)

Локальды migrate + validate (`tests/test_pg_migrate_integration.py`):

```bash
# Linux / macOS / Git Bash
bash scripts/run_pg_integration_tests.sh

# Windows PowerShell (Docker Desktop қосулы)
powershell -ExecutionPolicy Bypass -File scripts/run_pg_integration_tests.ps1
```

Compose (бөлек): `infra/docker/docker-compose.pg-test.yml` — `postgresql://postgres:postgres@127.0.0.1:5432/raqat_test`.

DSN өзгерту: `RAQAT_PG_TEST_DSN=... bash scripts/run_pg_integration_tests.sh`

---

## Ескертулер

- `integration` marker: `tests/test_pg_migrate_integration.py` — PostgreSQL қажет
- Bot deps: `requirements-bot.txt` → `platform_api/requirements.txt` + `scripts/requirements-dev.txt`
- Probe/sync log файлдары `data/` ішінде gitignore — fixture-тар `tests/fixtures/`
