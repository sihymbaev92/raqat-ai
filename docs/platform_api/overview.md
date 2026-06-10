# Platform API — endpoint карта

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 5. Платформа API (`platform_api/`)

Дерекқор: `RAQAT_DB_PATH` немесе `DB_PATH`, әйтпесе `../global_clean.db`. Жазу: миграциялар, `platform_identities`, `platform_ai_chat_messages`, AI чат логы.

### 5.1 Жалпы

| Метод | Жол |
|--------|------|
| GET | `/health` — **liveness**: `{ status, service, version }` (дерекқорсыз да 200) |
| GET | `/ready` — **readiness**: `readiness_ping()` → `backend`: `sqlite` \| `postgresql`; қатеде **503** + `error`. Kubernetes: liveness=`/health`, readiness=`/ready` |
| GET | `/metrics` — **in-process мониторинг**: `uptime_seconds`, `uptime_human`, **`http_5xx_total`**, соңғы сұраныстар терезесінің latency (p50/p95/p99), slow count; логтар middleware `http_request` арқылы |
| GET | `/api/v1/info` — уақыт, сілтемелер, `note_kk` (қысқа нұсқау) |
| GET | `/api/v1/stats/content` — қатарлар саны, `text_kk` толықтығы (**тек SQLite файл** арқылы; PG-only ортада бұл жол статистика үшін бөлек келешекте үйлестірілуі мүмкін) |

### 5.2 Орталық AI (`X-Raqat-Ai-Secret` **немесе** JWT scope `ai`; серверде `GEMINI_API_KEY`)

| Метод | Жол | Дене (қысқа) |
|--------|-----|----------------|
| POST | `/api/v1/ai/chat` | `prompt`, опция `user_id` → `text`. **`async_mode`: true** болса — жауапта `task_id`, `poll_path` (Celery кезегі; Redis broker). Bearer-да uuid `sub` болса, синхронда жауап **тарихқа** жазылады (`source=api`); async тапсырма worker ішінде жазады. |
| GET | `/api/v1/ai/task/{task_id}` | Celery **`AsyncResult`** күйі: `state`, `ready`, `result` (сәтті болса). Auth: сол AI rate limit / JWT немесе `X-Raqat-Ai-Secret`. |
| POST | `/api/v1/ai/analyze-image` | `image_b64`, `mime_type`, `lang`; опция **`async_mode`** (фонда `raqat.ai.analyze_image`) |
| POST | `/api/v1/ai/transcribe-voice` | `audio_b64`, `mime_type`, `preferred_lang`; опция **`async_mode`** (`raqat.ai.transcribe`) |
| POST | `/api/v1/ai/tts` | `text`, `lang` → `audio_b64`, `mime_type`, `filename`; опция **`async_mode`** (`raqat.ai.tts`) |

Код: `ai_routes.py`, `ai_proxy.py`, `ai_multimodal.py`, `celery_tasks.py`, `celery_app.py`, `ai_security.py`, `jwt_auth.py`. Кезек: `app/infrastructure/queue.py` → `celery_app.send_task`. Орта: **`RAQAT_QUEUE_BACKEND=celery`**, **`RAQAT_REDIS_URL`**, worker: `celery -A celery_app worker`.

### 5.3 Оқу-only контент (құпия толтырылса: header **немесе** JWT scope `content`)

| Метод | Жол | Ескертпе |
|--------|-----|----------|
| GET | `/api/v1/quran/surahs` | 114 сүре |
| GET | `/api/v1/quran/{surah}` | Query: `from_ayah`, `to_ayah`; max **400** жол |
| GET | `/api/v1/quran/{surah}/{ayah}` | Бір аят |
| GET | `/api/v1/hadith/{hadith_id}` | Бір хадис |
| GET | `/api/v1/metadata/changes` | **`ETag`**, **`Last-Modified`**, **`If-None-Match`** → **304**; query **`since`** (ISO8601) — DB-да `updated_at` бар болса **`incremental_diff_available`**, **`quran_changed`**, **`hadith_changed`**, **`since_normalized_sqlite`**; fingerprint-те max `updated_at` |

Код: `content_routes.py`, `content_reader.py`.

### 5.4 Auth, байлау, профиль, тарих

| Метод | Жол | Сипат |
|--------|-----|--------|
| POST | `/api/v1/auth/login` | Bootstrap: `username` / `password` → **`access_token`**; JWT ішінде **`sub` = тұрақты `platform_user_id` (uuid)** — `ensure_platform_user_for_password_username` → `platform_identities` + **`platform_password_logins`** (`db/password_login.py`; DDL: **`db/user_data_schema.py`**, миграция **012**, жөндеу **014**). |
| POST | `/api/v1/auth/link/telegram` | **Бот:** `X-Raqat-Bot-Link-Secret` + `{ "telegram_user_id": int }` → JWT, `sub` = **`platform_user_id`**, кестеде жол жасалады. **Клиент:** Bearer access — `jwt_auth.platform_user_id_from_payload()` uuid алады (**`sub`** немесе claim **`platform_user_id`**); uuid табылмаса → **400** `SUB_NOT_PLATFORM_UUID`. Сәтті болса tg бекітіледі, жаңа JWT жұбы қайтарылады. |
| GET | `/api/v1/users/me` | `sub`, `platform_user_id`, `telegram_user_id`, `scopes`, опция `apple_sub` / `google_sub` (JWT claim) |
| GET | `/api/v1/users/me/history` | `limit` (1–200), `before_id`, `role` — `items[]`: `id`, `role`, `body`, `source`, `client_id`, `created_at`; `next_before_id` |

Код: `auth_routes.py`, `jwt_deps.py`, `roadmap_routes.py`, `db/platform_identity_chat.py`.

OpenAPI: **`/docs`**.

---
