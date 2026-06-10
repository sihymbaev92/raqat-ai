# Конфигурация (.env)

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 4. Конфигурация (түбір `.env` + `config/settings.py`)

| Айнымалы | Қайда қолданылады |
|----------|-------------------|
| `BOT_TOKEN` | Telegram |
| `GEMINI_API_KEY` | Ботта тікелей Gemini **немесе** API серверінде орталық AI |
| `DB_PATH` / `RAQAT_DB_PATH` | SQLite жолы; `platform_api/db_reader.resolve_db_path()` = `db.get_db.sqlite_database_path()` |
| `DATABASE_URL` | Келешек PostgreSQL DSN (`config/settings.py`, құжат: `MIGRATION_SQLITE_TO_POSTGRES.md`) |
| `RAQAT_PLATFORM_API_BASE` | Мысалы `http://127.0.0.1:8787` — бот HTTP AI шақырулары |
| `RAQAT_AI_PROXY_SECRET` | Бот ↔ API: **`X-Raqat-Ai-Secret`** **немесе** JWT scope **`ai`** |
| `RAQAT_CONTENT_READ_SECRET` | Контент GET қорғалса: **`X-Raqat-Content-Secret`** **немесе** JWT scope **`content`** |
| `RAQAT_JWT_SECRET` | Кемінде 32 символ — JWT шығару/тексеру (`platform_api`) |
| `RAQAT_AUTH_USERNAME`, `RAQAT_AUTH_PASSWORD` / `RAQAT_AUTH_PASSWORD_BCRYPT` | Bootstrap `POST /auth/login` |
| `RAQAT_JWT_EXPIRE_MINUTES` | Access token TTL |
| `RAQAT_BOT_LINK_SECRET` | `POST /auth/link/telegram` + header **`X-Raqat-Bot-Link-Secret`** (Telegram id → JWT, `sub` = uuid) |
| `QURAN_TRANSLIT_STYLE` | `default` \| `pedagogical` |
| `AI_RATE_LIMIT_SECONDS`, `AI_MODEL_CANDIDATES`, `ADMIN_USER_IDS`, `CITY_NAME`, … | Бот логикасы |

Мысал: `.env.example`.

---
