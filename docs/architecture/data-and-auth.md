# SQLite, auth, миграциялар

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 23. SQLite схемасы, пароль логин және миграция жөндеуі (2026-04-18)

Бұл бөлім **GPT / SRE / жаңа әзірлеуші** үшін дерекқор шындығын бекітеді: платформа uuid, пароль арқылы кіру кестелері, ескі снапшоттарды қалпына келтіру.

### 23.1 Платформа identity және «пароль → uuid»

| Кесте / модуль | Мазмұны |
|----------------|--------|
| **`platform_identities`** | Тұрақты **`platform_user_id`** (uuid), опция **`telegram_user_id`**. Миграция **006** + `db/platform_identity_chat.py`. |
| **`platform_password_logins`** | `login_key` = `lower(strip(username))` → **`platform_user_id`**. Алғашқы кіруде uuid жасалады да, identity жолымен бірге жазылады. `db/password_login.py` → `ensure_platform_user_for_password_username`. |
| **`platform_hatim_read`** | Серверлік хатым прогресі (сурелер JSON). DDL екеуі де: **`db/user_data_schema.py`** → `ensure_user_data_tables(conn)`. |
| **PostgreSQL режимі** | `platform_api/main.py` lifespan: SQLite миграция өткізілмейді, бірақ **`ensure_user_data_tables`** (және community/oauth кестелері) `get_db()` арқылы шақырылады. |

### 23.2 Миграция нөмірлері (тізбек)

| Версия | Аты (қысқа) | Мазмұны |
|--------|-------------|---------|
| **012** | `user_hatim_and_password_login` | `ensure_user_data_tables` — пароль/хатым кестелері. |
| **013** | `oauth_and_phone_login` | OAuth/телефон кестелері (`db/oauth_phone_schema.py`). |
| **014** | `repair_user_data_tables_if_missing` | Егер **`platform_password_logins`** немесе **`platform_hatim_read`** жоқ болса қайта құрады (ескі снапшоттардағы сәйкессіздік үшін). |

Функция: `db/migrations.py` → `run_schema_migrations(db_path)`.

### 23.3 `POST /api/v1/auth/login` (bootstrap) нақты контракт

- Сәтті жауап: **`access_token` / `refresh_token`**, **`platform_user_id`** денеде; JWT ішінде **`sub` = uuid** (логин аты емес).
- Кесте жоқ / identity қатесі: **503** `IDENTITY_ISSUE_FAILED` (хабарлама қысқартылған).
- Swagger smoke: **§14.5**; `/users/me` үшін сол токенді Bearer ретінде қолдану.

### 23.4 `POST /api/v1/auth/link/telegram` (клиент Bearer тармағы)

- `jwt_auth.platform_user_id_from_payload`: алдымен **`platform_user_id`** claim (uuid), содан **`sub`** (uuid).
- Екеуі де uuid емес → **400** `SUB_NOT_PLATFORM_UUID` — ескі клиент токендері немесе қате шығарылған JWT үшін.
- Бот жолы (`X-Raqat-Bot-Link-Secret`) осы тексеруден бөлек: тікелей `ensure_platform_user_for_telegram` + жаңа жұп.

### 23.5 Тесттер және pytest ортасы

| Файл | Мазмұны |
|------|--------|
| `tests/conftest.py` | **`RAQAT_REDIS_REQUIRED=0`** — Redis міндетті startup API импортында өшіріледі (жергілікті pytest). |
| `tests/test_auth_link.py` | Бот құпиясы, идемпотенттілік, 401/503; **legacy JWT** (`sub` string) → **400** `SUB_NOT_PLATFORM_UUID`. |

### 23.6 Операторға: күмәнді SQLite файл

1. API іске қосу (SQLite) — lifespan **`run_schema_migrations`** орындайды.  
2. Немесе қолмен: `python -c "from db.migrations import run_schema_migrations; run_schema_migrations('/path/to/file.db')"`.  
3. **014** қолданылғаннан кейін `schema_migrations` кестесінде **14** жолы пайда болады; **`platform_password_logins`** бар екенін тексеруге болады.

Сілтеме: `docs/OPERATIONS_STACK_CHECKLIST.md` — Redis → API → Celery → Prometheus тізбегі; **§22.1**.

---
