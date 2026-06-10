# Деректер мен скрипттер

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 8. Деректер мен скрипттер

- **Құран / транскрипция / импорт** — `docs/QURAN_GPT_HANDOFF.md`, `scripts/audit_quran_translit.py`, `import_quran_translit_json.py`, т.б.  
- **Хадис**, FTS — `create_hadith_fts.py`, `hadith_corpus_sync.py`.  
- **`quran_kk_provenance`** — қазақша мағына дереккөзі жолы.  
- **Миграциялар (`db/migrations.py`):** мысалы **005** — `quran`/`hadith` **`updated_at`** + индекстер; **006** — **`platform_identities`**, **`platform_ai_chat_messages`**; **012** — пароль логин және хатым: **`platform_password_logins`**, **`platform_hatim_read`** (`ensure_user_data_tables`); **013** — OAuth/телефон кестелері; **014** — **жөндеу**: кейбір `global_clean.db` снапшоттарында 012 «қолданылды» деп жазылғанымен кестелер жоқ болуы мүмкін — 014 кестелер жоқ болса қайта құрады (`CREATE IF NOT EXISTS`). API SQLite режимінде lifespan ішінде **`run_schema_migrations`** шақырылады; жаңа ортада барлық нұсқа тізбегі кідіртпей орындалады. Толығырақ: **§23**.
- **Локальды API + бот «басынан»:** `bash scripts/dev_restart_platform.sh` — 8787 портындағы процесті тоқтатады (`RAQAT_DEV_KILL_API_PORT=0` болса өшірмейді), миграцияны іске қосады, `uvicorn`-ды `.logs/platform_api.log`-қа жазады. Бот: екінші терминалда `python bot_main.py` немесе `RAQAT_DEV_START_BOT=1 bash scripts/dev_restart_platform.sh`.
- **Серверде сенімділік (SQLite файл сақталған орта):** `bash scripts/backup_sqlite.sh` — `RAQAT_BACKUP_DIR` (әдепкі `backups/`); `bash scripts/healthcheck_raqat.sh` — DB файлы + `/ready` + `/health` + `bot_main.py`; `bash scripts/nightly_maintenance.sh` — екеуін `.logs/nightly_maintenance.log`-қа жинақтайды. Репо: `backups/` `.gitignore`-да.
- **Контент импорты (SQLite ↔ PostgreSQL / толық көшіру):** `scripts/copy_quran_hadith_full.sh` — `migrate_sqlite_to_postgres.py` орамын қолданады (`--bootstrap-ddl`, `--with-quran-hadith`, т.б.); толығырақ `docs/MIGRATION_SQLITE_TO_POSTGRES.md`, `import_content_pipeline.sh`.
- **Нақты қолмен тест (Telegram → `platform_identities` / `platform_ai_chat_messages` → `GET /users/me`, `/history`):** `docs/DEV_LOCAL_CHECKLIST.md` — «Нақты тест: Telegram → DB → API».

---
