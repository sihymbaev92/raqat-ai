# Репозиторий құрылымы

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 2. Репозиторий құрылымы

| Қалта | Рөлі |
|-------|------|
| `bot_main.py`, `handlers/`, `services/`, `keyboards/`, `state/`, `config/` | Telegram бот (**aiogram 3**) |
| `global_clean.db` | SQLite; жол **`db/get_db.py` → `sqlite_database_path()`** (env `RAQAT_DB_PATH` / `DB_PATH`, содан `config.settings.DB_PATH`, әйтпесе репо түбі) |
| `db/get_db.py` | `get_db()` / `get_db_writer()` — postgres: psycopg, опция `RAQAT_PG_USE_POOL` → pool; `close_postgresql_pools()`; SQLite fallback; `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §4, §Архитектуралық ағым |
| `db/migrations.py`, `db/platform_identity_chat.py`, `db/dialect_sql.py` | Миграциялар; платформа uuid, AI тарих; SQL `?`/уақыт psycopg үшін |
| `platform_api/` | **FastAPI**, әдепкі порт **8787** — `bash scripts/run_platform_api.sh` (`main.py` репо түбін `sys.path`-қа қосады — `db` импортталады) |
| `platform_api/app/` | **Жаңа модульдік v1 қабаты**: `app/main.py` (entrypoint), `app/api/v1/*` (auth/users/quran/hadith/ai/worship/halal), `app/core/*`, `app/infrastructure/*` |
| `web/` | Статикалық MVP (`index.html`, `styles.css`) |
| `mobile/` | **Expo SDK 54** (`expo` ~54), React Native 0.81.x; әдепкі entry: `expo/AppEntry.js` |
| `scripts/` | Импорт, FTS, платформа API, хадис синкі, healthcheck, backup, түнгі maintenance |
| `platform_api/db_reader.py` | `get_content_stats()` (SQLite файл), **`readiness_ping()`** — гибрид DSN үшін readiness |

---
