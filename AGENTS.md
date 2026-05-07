# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

RAQAT is an Islamic content + AI assistant platform (Kazakh-language focus). It is a modular monolith with:

- **Platform API** (FastAPI, Python 3.12) — central backend at `platform_api/`, serves on port `8787`
- **Telegram Bot** (aiogram) — entry point `bot_main.py`, requires `BOT_TOKEN`
- **Mobile App** (Expo 54 / React Native) — in `mobile/`
- **Static Web** — in `web/`, no build step needed

### Running the Platform API (dev)

```bash
cd /workspace/platform_api
RAQAT_REDIS_REQUIRED=0 RAQAT_DB_PATH=../global_clean.db \
  RAQAT_JWT_SECRET=raqat_dev_jwt_secret_minimum_32chars_long \
  RAQAT_AI_RL_DISABLED=1 RAQAT_PHONE_OTP_DEV=1 \
  .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8787
```

Key env vars for dev: `RAQAT_REDIS_REQUIRED=0` (skip Redis), `RAQAT_PHONE_OTP_DEV=1` (skip Twilio SMS), `RAQAT_AI_RL_DISABLED=1` (disable AI rate limit).

Health: `GET /health`, Readiness: `GET /ready`, OpenAPI docs: `GET /docs`.

### Database

SQLite file at repo root: `global_clean.db`. Schema migrations run automatically on API startup (`db/migrations.py`). The `quran` and `hadith` content tables are **not** auto-created by migrations — they must be seeded separately (see `scripts/import_content_pipeline.sh`). A minimal seed (Al-Fatiha + 1 hadith) exists in the dev setup.

### Running tests

**Python (pytest):**
```bash
cd /workspace
PYTHONPATH=/workspace:/workspace/platform_api RAQAT_REDIS_REQUIRED=0 \
  RAQAT_DB_PATH=./global_clean.db RAQAT_JWT_SECRET=raqat_dev_jwt_secret_minimum_32chars_long \
  /workspace/platform_api/.venv/bin/python -m pytest tests/ -v
```

Note: 2 tests in `test_language_service.py` are pre-existing failures (Chinese fallback logic changed but tests not updated).

**Mobile (Jest + TypeScript):**
```bash
cd /workspace/mobile
npm test           # Jest
npm run lint       # tsc --noEmit
```

### Gotchas

- The root `requirements.txt` is a **system package freeze** (not pip-installable). Bot dependencies (`aiogram`, `aiofiles`, etc.) must be installed into the platform_api venv separately.
- `PYTHONPATH` must include both `/workspace` and `/workspace/platform_api` for tests and scripts that import from both the bot and API codepaths.
- The `conftest.py` in `tests/` automatically sets `RAQAT_REDIS_REQUIRED=0` and forces SQLite mode (removing `DATABASE_URL` env vars).
- The mobile app uses `package-lock.json` (npm), not pnpm/yarn.
