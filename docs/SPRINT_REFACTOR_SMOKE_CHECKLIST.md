# Sprint Refactor Smoke Checklist

This checklist verifies the recent architecture refactor without changing product behavior.

## 1) Bot Routing Structure

- `bot_main.py` should stay bootstrap-only (no large inline route registration blocks).
- Route registration should flow through:
  - `handlers/routes.py`
  - `handlers/routes_commands.py` (+ `routes_commands_core.py`, `routes_commands_features.py`)
  - `handlers/routes_callbacks.py` (+ `routes_callbacks_core.py`, `routes_callbacks_features.py`)
  - `handlers/routes_messages.py` (+ `routes_messages_common.py`, `routes_messages_quran.py`, `routes_messages_misc.py`)

Quick validation:

```bash
python3 -m py_compile bot_main.py handlers/routes.py handlers/routes_*.py
```

## 2) Platform API Entrypoint

- Canonical app lives in `platform_api/main.py`.
- Compatibility entrypoint `platform_api/app/main.py` must import canonical app.

Quick validation:

```bash
python3 -m py_compile platform_api/main.py platform_api/app/main.py
```

## 3) API Startup/Shutdown Safety

- API uses FastAPI lifespan (not deprecated `on_event`).
- SQLite mode: startup runs `run_schema_migrations(...)`.
- Shutdown closes optional PostgreSQL pools via `close_postgresql_pools()`.

Manual check:

```bash
bash scripts/run_platform_api.sh
# In another terminal:
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/ready
```

## 4) Refresh Rotation Atomicity

- Refresh flow must consume old refresh JTI atomically.
- Logic is centralized in `platform_api/refresh_rotation.py`.
- Both auth stacks should call shared helper.

Regression test:

```bash
.venv/bin/python -m pytest tests/test_platform_api.py -q -k refresh_token_roundtrip_and_revokes_old
```

## 5) Content Endpoint Guard Consistency

- `optional_content_read_secret` dependency should be present in both:
  - legacy `platform_api/content_routes.py`
  - app endpoints `platform_api/app/api/v1/endpoints/quran.py` and `hadith.py`

Smoke:

```bash
.venv/bin/python -m pytest tests/test_platform_api.py -q -k "quran or hadith"
```

## 6) Mobile Sync Performance Sanity

- Incremental Quran patching should batch writes per surah, not per ayah.
- Check file: `mobile/src/services/contentSync.ts`.

## 7) Release Gate (Recommended)

Run all before deploy:

```bash
python3 -m py_compile bot_main.py handlers/routes.py handlers/routes_*.py
python3 -m py_compile platform_api/main.py platform_api/app/main.py platform_api/refresh_rotation.py
.venv/bin/python -m pytest tests/test_platform_api.py -q -k "refresh_token_roundtrip_and_revokes_old or quran or hadith or health"
```

If all green, proceed to staging smoke then production deploy.
