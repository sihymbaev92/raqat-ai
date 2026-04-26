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
| `RAQAT_AI_PROXY_SECRET` | Сервер конфигі: `X-Raqat-Ai-Secret` header қабылдау үшін (өшіктелгенде тек JWT) |
| `RAQAT_ACCEPT_AI_PROXY_SECRET_HEADER` | `0` болса `X-Raqat-Ai-Secret` қабылданбайды — тек `Authorization: Bearer` (scope `ai`). Бот үшін: `RAQAT_PLATFORM_API_SERVICE_TOKEN` |
| `RAQAT_ACCEPT_CONTENT_READ_SECRET_HEADER` | `0` болса `X-Raqat-Content-Secret` қабылданбайды — тек JWT (scope `content`) |
| `RAQAT_PLATFORM_API_SERVICE_TOKEN` | (Опция) JWT-only режимінде бот/ішкі клиенттің API шақыруы үшін access token |
| `RAQAT_CONTENT_READ_SECRET` | Толтырылса, `/quran` / `/hadith` / `/metadata/changes` үшін құпия header немесе JWT scope `content` (header `RAQAT_ACCEPT_CONTENT_READ_SECRET_HEADER=0` кезінде тек JWT) |
| `RAQAT_BOT_SYNC_SECRET` | Telegram боттың орталық DB жазуы: `X-Raqat-Bot-Sync-Secret` — `/api/v1/bot/sync/*` (бос болса бұл жолдар өшігілі) |
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

**Тәртіп (SQLite бір файл — `global_clean.db`):**

1. **Redis** — `RAQAT_REDIS_URL` (өндіріс әдепкісі: Redis жоқ болса API стартуда тоқтайды). Жергілікті тест: `RAQAT_REDIS_REQUIRED=0`.
2. **platform_api** — бірінші іске қосыңыз: SQLite миграциялары осы жерде орындалады, контент пен `user_preferences` / `bookmarks` осы DB-да.
3. **Telegram бот** — `RAQAT_PLATFORM_URL` қосылған соң; `RAQAT_BOT_SYNC_SECRET` болса профиль/bookmark тек API арқылы. Өндірісте бір дерек көзі үшін бот `.env`: `RAQAT_BOT_API_ONLY=1` — құран/хадис тек API-дан, API құласа жергілікті SQLite fallback жоқ.

**Бір дерек файлы:** `platform_api` және бот (`RAQAT_BOT_API_ONLY` **жоқ** кезде fallback SQLite оқу үшін) **бірдей** `DB_PATH` немесе `RAQAT_DB_PATH` көрсету керек (әдепкі: репо түбіріндегі `global_clean.db`). **PostgreSQL** режимінде тек API `.env`-те `DATABASE_URL`; `RAQAT_BOT_API_ONLY=1` болса бот контентті тек HTTP арқылы алады.

Windows (бір терезеде бот, API екінші терезеде): `.\scripts\run_stack_dev.ps1` (`-BotOnly`, `-Dev`, `-SkipDockerRedis`, `-StopApiWhenBotStops`). Docker стек бір скриптпен: `.\scripts\run_stack_dev.ps1 -UseStackDocker` (`-BuildStack`, `-StopApiWhenBotStops` — `docker compose ... down`).

Docker (Redis + API контейнерлері, репо `../../` volume): `docker compose -f infra/docker/docker-compose.stack.yml up --build` немесе `scripts\stack_docker_up.ps1` (`-Detached`, `-Build`). Бот хостта `RAQAT_PLATFORM_URL=http://127.0.0.1:8787`. Стек Redis хостта **6380** (әдепкі): `RAQAT_REDIS_URL=redis://127.0.0.1:6380/0` — негізгі `docker-compose.yml` Redis (6379) қақтыспайды; өзгерту: `RAQAT_STACK_REDIS_PORT`.

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
  (`RAQAT_DB_PATH` немесе `DB_PATH` — әйтпесе `../global_clean.db`) — `tables.quran` / `tables.hadith`, опция `tables.hadith_fts`, `import_hint_kk`.
- OpenAPI: `http://127.0.0.1:8787/docs`

## Орталық AI (`X-Raqat-Ai-Secret` **немесе** JWT scope `ai` + `GEMINI_API_KEY`)

| Жол | Дене (қысқа) |
|-----|----------------|
| `POST /api/v1/ai/chat` | `prompt`, опция `user_id` → `text` |
| `POST /api/v1/ai/analyze-image` | `image_b64`, `mime_type`, `lang` → `text` |
| `POST /api/v1/ai/transcribe-voice` | `audio_b64`, `mime_type`, `preferred_lang` → `text` |
| `POST /api/v1/ai/tts` | `text`, `lang` → `audio_b64`, `mime_type`, `filename` |

Бот: `RAQAT_PLATFORM_API_BASE` + (`RAQAT_AI_PROXY_SECRET` арқылы `X-Raqat-Ai-Secret` **немесе** JWT-only режимінде `RAQAT_PLATFORM_API_SERVICE_TOKEN`) — чат, halal, дауыс, TTS осы API арқылы.

## Оқу-only контент

| Жол | Сипат |
|-----|--------|
| `GET /api/v1/quran/surahs` | 114 сүре тізімі |
| `GET /api/v1/quran/{surah}` | `from_ayah`, `to_ayah` query, max 400 жол |
| `GET /api/v1/quran/{surah}/{ayah}` | бір аят |
| `GET /api/v1/hadith/{hadith_id}` | бір хадис |
| `GET /api/v1/hadith/random` | `source` query опциялы; бос болса барлық кітаптан кездейсоқ |
| `GET /api/v1/metadata/changes` | `ETag`, `Last-Modified`; `If-None-Match` → **304**; `since` (ISO8601) — `updated_at` бар DB үшін `quran_changed` / `hadith_changed` |

Ескі SQLite `quran` кестесінде `surah_name` / `translit` жоқ болса: миграция **17** (`run_schema_migrations`) немесе репо түбірінен `python scripts/upgrade_quran_api_columns_sqlite.py --db global_clean.db`.

## Telegram бот синхроны (`RAQAT_BOT_SYNC_SECRET`)

Бот `.env`-те `RAQAT_PLATFORM_URL` + `RAQAT_BOT_SYNC_SECRET` (сервермен бір мән) қосқанда: `user_preferences`, `bookmarks`, `/stats` / `/broadcast` тізімі осы API арқылы.

| Жол | Сипат |
|-----|--------|
| `POST /api/v1/bot/sync/user` | `{ user_id, lang, username?, full_name? }` |
| `GET /api/v1/bot/sync/user/{id}/lang` | |
| `POST /api/v1/bot/sync/bookmark` | `{ user_id, surah, ayah, text_ar, text_lang }` |
| `GET /api/v1/bot/sync/bookmarks/{user_id}` | |
| `GET /api/v1/bot/sync/stats` | users / bookmarks санағы |
| `GET /api/v1/bot/sync/user-ids` | broadcast үшін |

`RAQAT_CONTENT_READ_SECRET` толтырылса, осы GET-терге `X-Raqat-Content-Secret` немесе `Authorization: Bearer` (JWT scope `content`) қосыңыз. Мобильді клиентте құпия емес — тек кіру JWT.

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

## Pytest (түбірдегі `tests/`)

Дәл осы venv: `pip install -r requirements.txt -r ../scripts/requirements-dev.txt`. Portable жинақ (бот пакеттері жоқ): PowerShell `..\scripts\run_pytest_portable.ps1`. Толық репо: `pytest tests` (түбірден, `PYTHONPATH=platform_api` немесе `pytest.ini` көмегімен).

## systemd / VPS өндіріс (бір орын)

Толық сценарий (firewall, тексеру, мобильді URL): **`docs/VPS_PRODUCTION_PLATFORM_API.md`**.

Үлгі: `scripts/systemd/raqat-platform-api.service.example` — сырттан `8787` пен тіке кіру үшін **`--host 0.0.0.0`**; Nginx/HTTPS прокси алдында ғана `127.0.0.1` қолданыңыз.
