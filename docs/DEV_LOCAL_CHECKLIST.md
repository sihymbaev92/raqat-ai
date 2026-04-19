# Локальды тексеру чеклисті (миграция + контент + бір user)

Қолмен `INSERT` жасамаңыз: дерек **скрипттер** және **API/бот механизмі** арқылы келуі керек.

## Платформа API + бот (басынан)

`bash scripts/dev_restart_platform.sh` — миграция + `8787` API (фон), журнал `.logs/platform_api.log`. Ботты қосу: `RAQAT_DEV_START_BOT=1` немесе жеке терминалда `python bot_main.py`. Толығырақ: `docs/PLATFORM_GPT_HANDOFF.md` §8.

Алдын ала: `.env`-те **`RAQAT_PLATFORM_API_BASE`**, **`RAQAT_BOT_LINK_SECRET`** (API серверімен бірдей), **`BOT_TOKEN`**, API үшін **`RAQAT_JWT_SECRET`**; AI үшін **`GEMINI_API_KEY`** (API немесе бот).

## Нақты тест: Telegram → DB → API

### 1) Telegram (қолмен)

1. Telegram-да ботты ашып **`/start`** басыңыз.
2. AI бөліміне кіріп **бір сұрақ жазыңыз** (жауап келгенше күтіңіз).

Күтілетіні: `/start` кейін identity + JWT (`auth/link/telegram`); AI кейін `platform_ai_chat_messages` ішінде user + assistant жолдары.

### 2) Дерекқорды тексеру

**SQLite** (`RAQAT_DB_PATH` / `global_clean.db`), `YOUR_TELEGRAM_ID` — өзіңіздің `user_id`:

```bash
sqlite3 ./global_clean.db "SELECT platform_user_id, telegram_user_id FROM platform_identities WHERE telegram_user_id = YOUR_TELEGRAM_ID;"
sqlite3 ./global_clean.db "SELECT COUNT(*) AS n FROM platform_ai_chat_messages m JOIN platform_identities i ON m.platform_user_id = i.platform_user_id WHERE i.telegram_user_id = YOUR_TELEGRAM_ID;"
```

**PostgreSQL** — сол кестелер; `psql` немесе GUI арқылы `platform_identities`, `platform_ai_chat_messages` бойынша сүзіңіз.

### 3) API тексеру (`GET /ready`, `/health`, `GET /users/me` …)

Алдымен дерекқор дайындығы:

```bash
export API=http://127.0.0.1:8787
curl -sS "$API/ready" | python -m json.tool
curl -sS "$API/health" | python -m json.tool
```

### 4) JWT (`GET /users/me`, `/users/me/history`)

**Bearer** керек: бот **`user_preferences.platform_token_bundle`** JSON-ына `access_token` жазады (немесе `POST /api/v1/auth/link/telegram` жауабынан алыңыз).

Мысал (SQLite-тен токен шығару + сұрау):

```bash
export API=http://127.0.0.1:8787
export TG_ID=YOUR_TELEGRAM_ID
export TOKEN=$(python -c "
import json, sqlite3, os
db = os.environ.get('RAQAT_DB_PATH', 'global_clean.db')
uid = int(os.environ['TG_ID'])
r = sqlite3.connect(db).execute(
  'SELECT platform_token_bundle FROM user_preferences WHERE user_id = ?', (uid,)
).fetchone()
print(json.loads(r[0])['access_token'] if r and r[0] else '')
")
curl -sS -H "Authorization: Bearer $TOKEN" "$API/api/v1/users/me" | python -m json.tool
curl -sS -H "Authorization: Bearer $TOKEN" "$API/api/v1/users/me/history?limit=20" | python -m json.tool
```

Егер `platform_token_bundle` бос болса: API жұмыс істеп тұрғанын `dev_verify_platform_flow.py` немесе қолмен `curl -X POST .../auth/link/telegram` арқылы тексеріңіз (`docs/PLATFORM_GPT_HANDOFF.md` §5.4).

## 1. Миграциялар

```bash
cd /path/to/raqat_bot
RAQAT_DB_PATH=./global_clean.db python -c "from db.migrations import run_schema_migrations; run_schema_migrations(__import__('os').environ['RAQAT_DB_PATH'])"
```

Немесе бот іске қосылғанда `bot_main.py` өзі `run_schema_migrations(DB_PATH)` шақырады.

## 2. Құран / хадис контенті

- **Құран** (транскрипция / kk т.б.): `scripts/import_quran_*.py` — `--json` немесе дереккөз файлы қажет (толық 6224 аят үшін `import_quran_translit_json.py --allow-partial` тестке).
- **Хадис `text_kk` жаңарту** (бар жолдарға): `scripts/hadith_corpus_sync.py import-json --db ... --input ...`
- **Бір скриптпен схема + мысал жолдар**: `bash scripts/import_content_pipeline.sh` (`RAQAT_DB_PATH` / `DB_PATH` орнатыңыз).

Толық контент репода әрдайым болмауы мүмкін — импорт **дереккөз файлынан** жүреді.

## 3. Бір user (Telegram сценарийінің эквиваленті)

Ботта: `/start` → AI чат. API эквиваленті (жергілікті, серверсіз):

```bash
RAQAT_DB_PATH=./global_clean.db python scripts/dev_verify_platform_flow.py
# опция: шағын hadith seed жаңарту
RAQAT_DB_PATH=./global_clean.db python scripts/dev_verify_platform_flow.py --hadith-seed
```

Скрипт: `run_schema_migrations` → `POST /api/v1/auth/link/telegram` → `POST /api/v1/ai/chat` (мок) → `GET /api/v1/users/me/history` → **тек оқу** SQL (`platform_identities`, `platform_ai_chat_messages`).

## 4. Тексеру сұрақтары

| Сұрақ | Тексеру |
|--------|---------|
| `platform_identities` толды ма? | `dev_verify_platform_flow.py` ішінде SELECT; немесе sqlite3 клиент |
| `platform_ai_chat_messages` жазылды ма? | сол скрипт `COUNT(*) … platform_user_id` |
| `/users/me/history` жұмыс істей ме? | скрипт `items` length == 2 (user + assistant) |

## 5. Плейсхолдер аудит (PG көшуіне дайындық)

```bash
python scripts/audit_sql_placeholders.py
```

---

*Қосымша: `docs/MIGRATION_SQLITE_TO_POSTGRES.md`, `db/dialect_sql.py`.*
