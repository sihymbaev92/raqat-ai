# RAQAT Platform API

## Орнату

```bash
cd platform_api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Орта айнымалылар (міндетті емес)

| Айнымалы | Мән |
|----------|-----|
| `RAQAT_BOT_URL` | Telegram бот сілтемесі (әдепкі: t.me/my_islamic_ai_bot) |
| `CORS_ORIGINS` | Үтірмен бөлінген origin тізімі (әдепкі: `*`) |
| `GEMINI_API_KEY` | Орталық AI прокси үшін міндетті (`POST /api/v1/ai/chat`) |
| `RAQAT_AI_PROXY_SECRET` | Бот пен API арасындағы ортақ құпия (`X-Raqat-Ai-Secret` header) |
| `RAQAT_CONTENT_READ_SECRET` | Толтырылса, `/quran` / `/hadith` / `/metadata/changes` үшін `X-Raqat-Content-Secret` немесе JWT scope `content` |
| `RAQAT_JWT_SECRET` | Кемінде 32 таңба — JWT шығару (`POST /auth/login`) |
| `RAQAT_AUTH_USERNAME` | Bootstrap логин (әдепкі `admin`) |
| `RAQAT_AUTH_PASSWORD_BCRYPT` | Өндіріс: bcrypt hash; dev: `RAQAT_AUTH_PASSWORD` |
| `RAQAT_JWT_ACCESS_EXPIRE_MINUTES` | Access token TTL (әдепкі 30; legacy: `RAQAT_JWT_EXPIRE_MINUTES`) |
| `RAQAT_JWT_REFRESH_EXPIRE_DAYS` | Refresh token TTL (әдепкі 30) |
| `RAQAT_JWT_REFRESH_SECRET` | Refresh JWT құпиясы (бос болса `RAQAT_JWT_SECRET`) |
| `RAQAT_ENV` | `production` болса AI rate limit қатаң (30/терезе) |
| `RAQAT_AI_RL_MAX_PER_WINDOW` / `RAQAT_AI_RL_WINDOW_SECONDS` | AI шектеу |
| `RAQAT_AI_RL_DISABLED` | `1` болса шектеу өшігілі |
| `RAQAT_BOT_LINK_SECRET` | `POST /auth/link/telegram` + `X-Raqat-Bot-Link-Secret` — tg id үшін JWT (sub = platform uuid) |
| `AI_MODEL_CANDIDATES` | Үтірмен модель тізімі (әдепкі: `gemini-2.5-flash,gemini-2.5-flash-lite`) |

## Іске қосу

Репозиторий түбінен:

```bash
bash scripts/run_platform_api.sh
```

Немесе осы қалтадан:

```bash
uvicorn main:app --host 0.0.0.0 --port 8787
```

- Liveness: `http://127.0.0.1:8787/health`
- Readiness (дерекқор): `http://127.0.0.1:8787/ready` — **503** = DB қосылмаған
- Ақпарат: `http://127.0.0.1:8787/api/v1/info`
- Дерек сана (оқу): `http://127.0.0.1:8787/api/v1/stats/content`  
  (`RAQAT_DB_PATH` немесе `DB_PATH` — әйтпесе `../global_clean.db`)
- OpenAPI: `http://127.0.0.1:8787/docs`

## Орталық AI (`X-Raqat-Ai-Secret` **немесе** JWT scope `ai` + `GEMINI_API_KEY`)

| Жол | Дене (қысқа) |
|-----|----------------|
| `POST /api/v1/ai/chat` | `prompt`, опция `user_id` → `text` |
| `POST /api/v1/ai/analyze-image` | `image_b64`, `mime_type`, `lang` → `text` |
| `POST /api/v1/ai/transcribe-voice` | `audio_b64`, `mime_type`, `preferred_lang` → `text` |
| `POST /api/v1/ai/tts` | `text`, `lang` → `audio_b64`, `mime_type`, `filename` |

Бот: `RAQAT_PLATFORM_API_BASE` + `RAQAT_AI_PROXY_SECRET` — чат, halal, дауыс, TTS барлығы осы API арқылы.

## Оқу-only контент

| Жол | Сипат |
|-----|--------|
| `GET /api/v1/quran/surahs` | 114 сүре тізімі |
| `GET /api/v1/quran/{surah}` | `from_ayah`, `to_ayah` query, max 400 жол |
| `GET /api/v1/quran/{surah}/{ayah}` | бір аят |
| `GET /api/v1/hadith/{hadith_id}` | бір хадис |
| `GET /api/v1/metadata/changes` | `ETag`, `Last-Modified`; `If-None-Match` → **304**; `since` (ISO8601) — `updated_at` бар DB үшін `quran_changed` / `hadith_changed` |

`RAQAT_CONTENT_READ_SECRET` толтырылса, осы GET-терге `X-Raqat-Content-Secret` немесе `Authorization: Bearer` (JWT scope `content`) қосыңыз (Expo: `EXPO_PUBLIC_RAQAT_CONTENT_SECRET`).

## Auth (JWT bootstrap)

Құжат: `docs/PLATFORM_ROADMAP_API_AI_USERS.md`, PostgreSQL: `docs/MIGRATION_SQLITE_TO_POSTGRES.md`.

| Метод | Жол | Күй |
|-------|-----|-----|
| POST | `/api/v1/auth/login` | `access_token` + `refresh_token`, `expires_in` |
| POST | `/api/v1/auth/refresh` | `{ "refresh_token" }` → жаңа жұп (ескі refresh JTI revoke) |
| POST | `/api/v1/auth/link/telegram` | Бот: `X-Raqat-Bot-Link-Secret` + `{telegram_user_id}`. Клиент: Bearer (sub=uuid) + body — tg байланысы |
| GET | `/api/v1/usage/me` | JWT — `usage` агрегаты (`api_usage_ledger`) |
| GET | `/api/v1/billing/me` | Жоспар `free` + usage (төлем шлюзі кейін) |
| GET | `/api/v1/users/me` | `Authorization: Bearer` — `sub`, `platform_user_id`, `telegram_user_id`, `scopes` |
| GET | `/api/v1/users/me/history` | `limit`, `before_id`, `role` — соңғы чат жолдары (JSON ботпен бір кесте) |

## systemd мысалы

`/etc/systemd/system/raqat-platform-api.service` ішінде `WorkingDirectory` осы қалтаға, `ExecStart=.../uvicorn main:app --host 127.0.0.1 --port 8787`.
