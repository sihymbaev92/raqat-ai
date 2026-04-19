# SQLite → PostgreSQL көшуге дайындық

Бұл құжат **қазіргі** бот + `platform_api` SQLite (`DB_PATH` / `RAQAT_DB_PATH`) ағын сақтайды; PostgreSQL-ке **cutover** алдында және кейін қолданылатын инженерлік нұсқау.

---

## Архитектуралық ағым (Migration Flow)

Төмендегі схемалар **дерек көзі → дайындық → PostgreSQL → тексеру** және **cutover** кезіндегі логикалық ретті көрсетеді (басшылық мақсатында; нақты командалар §6, §13-те).

### Көшіру және индекстер (жоғары деңгей)

```mermaid
flowchart TB
  subgraph src [Дерек көзі]
    SQLITE[(SQLite global_clean.db)]
  end
  subgraph prep [Дайындық]
    MIG[db/migrations.py … 008 FK / UNIQUE]
    SAN[опция: --sanitize-sqlite-fk]
  end
  subgraph script [migrate_sqlite_to_postgres.py]
    BOOT[bootstrap DDL + кеңейтулер]
    ID[көшіру: platform_identities]
    SM[көшіру: revoked + api_usage_ledger]
    CH[көшіру: platform_ai_chat_messages]
    QH[опция: quran + hadith]
    IDX[Phase 6: updated_at индекстері]
    SETV[Phase 6.5: setval MAX id]
    VAL[--validate / --validate-only]
  end
  subgraph tgt [Мақсат]
    PG[(PostgreSQL)]
  end
  SQLITE --> MIG
  MIG --> SQLITE
  SQLITE -.->|көшірме ғана| SAN
  SAN --> SQLITE
  SQLITE --> BOOT
  BOOT --> PG
  ID --> PG
  SM --> PG
  CH --> PG
  QH --> PG
  IDX --> SETV
  SETV --> PG
  VAL --> PG
```

### Cutover (трафик ауыстыру — логикалық рет)

```mermaid
sequenceDiagram
  participant Clients as Клиенттер
  participant App as Бот / platform_api
  participant Old as SQLite
  participant New as PostgreSQL
  Note over Clients,New: Терезе: жазбалар тоқтатылады немесе тек оқу
  App->>Old: соңғы sync / delta көшіру скрипті
  App->>New: DSN қосу DATABASE_URL
  Clients->>App: health + auth + metadata
  App->>New: оқу/жазу
  Note over App,New: Validation §7, мониторинг §8.1
```

---

## 1. Конфигурация

| Айнымалы | Мақсаты |
|----------|---------|
| `DATABASE_URL` | PostgreSQL DSN (`postgresql://...`). Кесу алдында бос қалдыруға болады. |
| `DB_PATH` / `RAQAT_DB_PATH` | SQLite файлы (бот + API, қазіргі өндіріс). |
| `DATABASE_URL_READER` / `DATABASE_URL_WRITER` | **Келесі фаза**: оқу/жазу бөлінісі (`db/get_db.py` ішінде сипатталған). |
| `RAQAT_PG_USE_POOL` | `1` / `true` — `get_db()` үшін **psycopg_pool** (§4). |
| `RAQAT_PG_POOL_MIN`, `RAQAT_PG_POOL_MAX` | Пул min/max (әдепкі 1 / 10). |

`config/settings.py` ішінде `DATABASE_URL` оқылған.

---

## 2. UUID (`platform_user_id`) — PostgreSQL

- PostgreSQL-та `platform_user_id` мәнін **сервер деңгейінде** әдепкіге қою үшін: **`DEFAULT gen_random_uuid()`** (скрипт: `CREATE EXTENSION IF NOT EXISTS pgcrypto;` — ескі PG нұсқалары үшін; PG 13+ ядром да жұмыс істейді).
- **SQLite көшірісі**: sqlite-тегі uuid **мәтін** ретінде INSERT етіледі → PG `UUID` бағанына psycopg автоматты түрде түрлендіреді.
- **Жаңа жол** (кесуден кейін, тек PG): INSERT кезінде `platform_user_id` көрсетпеу → сервер uuid шығарады. Қазіргі Python коды (`db/platform_identity_chat.py`) әлі uuid-ті клиентте генерациялайды — PG-ға толық көшкенде INSERT-ті `RETURNING platform_user_id` арқылы біріктіруге болады.

**Неге native `UUID`, тек `TEXT` емес:** 16 байт фиксацияланған ішкі көрініс индекс беттеріндегі орынды азайтады; салыстырмалы сұрауларда (JOIN, `=`, индексті range емес іздеу) жоспарлаушы үшін нақтырақ тип — нақты пайда орта мен схемаға байланысты, **көптеген жүктемелерде шамамен 15–20%** деңгейінде жауап уақытын жақсарту туралы есептер жиі келтіріледі (бұл кепілдік емес, профильдеу қажет).

---

## 3. Индекстер (`updated_at`) және `/metadata/changes`

Көлемді `quran` / `hadith` үшін **`updated_at` BTREE индексі** `/api/v1/metadata/changes?since=...` сұрауын жылдамдатады.

- SQLite: `db/migrations.py` (005) — `idx_quran_updated_at`, `idx_hadith_updated_at`.
- PostgreSQL: **`scripts/migrate_sqlite_to_postgres.py`** көшіргеннен кейін **Phase 6**-та `CREATE INDEX IF NOT EXISTS idx_quran_updated_at ON quran(updated_at)` (және hadith) орындалады.
- Келешекте: өте үлкен кестелер үшін **BRIN** (`updated_at`) немесе партициялау — бөлек талдау.

---

## 4. Connection abstraction (`db/get_db.py`)

**Практикалық ұсыныс:** дерекқорды **Singleton** ретінде ұстамаңыз (тесттер мен reload қиындатады). Оның орнына:

- **`with get_db() as conn:`** — бір **контекст менеджер**; сыртқы код әр уақытта бір транзакция шегін біледі.
- **PostgreSQL:** әдепкі бойынша әр кіріс үшін `psycopg.connect` (қарапайым); өнімде **пул** қажет болса `RAQAT_PG_USE_POOL=1` → ленивті **`psycopg_pool.ConnectionPool`** (процесс ішінде ортақ; `RAQAT_PG_POOL_MIN` / `RAQAT_PG_POOL_MAX`). Uvicorn lifespan немесе shutdown кезінде **`close_postgresql_pools()`** шақырыңыз.
- Бұл — толық **Abstract Factory** емес, бірақ бір кіру нүктесі + ортақ DSN шешімі; келешекте фабрика интерфейсіне шығару оңай.

Бір нүкте:

- **`get_db()`** — postgres DSN болса → **psycopg** (`dict_row`), опция бойынша **pool**; әйтпесе **SQLite**.
- **`get_db_reader()`** — `DATABASE_URL_READER` postgres болса ол; әйтпесе `get_db()` (әдетте SQLite).
- **`get_db_writer()`** — қазір `get_db()` алиасы.

PostgreSQL үшін: `pip install -r requirements-postgres.txt` (`psycopg[binary,pool]`). Пакет жоқ болса **`ImportError`**.

**Ескерту:** көп қолданыстағы SQL әлі SQLite `?` плейсхолдерімен; PG кезінде `%s` / psycopg — репозиторийлерді біртіндеп көшіру керек.

**Мақсат:** бот пен `platform_api` дерекқор таңдауын бір жерден басқару; оқу/жазу DSN бөлінісі осы модульге қосылады.

---

## 5. Read / write бөлінісі (архитектура)

| Жол | Мысал кестелер / сұраулар |
|-----|-----------------------------|
| **Read** | `quran`, `hadith`, `metadata/changes`, stats |
| **Write** | `platform_identities`, `platform_ai_chat_messages`, `api_usage_ledger`, `revoked_refresh_jti`, auth |

PostgreSQL-ке көшкенде: репликаға тек read DSN, мастерге write DSN — `get_db_reader()` / `get_db_writer()` арқылы қосу жеңіл болады.

---

## 6. Көшіру реті (migration order)

`scripts/migrate_sqlite_to_postgres.py` сәйкес (PG bootstrap-та **FK**: chat → identities, usage → identities):

1. **Schema bootstrap** — `CREATE EXTENSION`, кестелер (DDL), чат индекстері (`idx_platform_chat_user_created`, partial **UNIQUE** `(platform_user_id, client_id)`).
2. **Identities** — `platform_identities` (UUID PK; FK ата-анасы).
3. **Кіші кестелер** — `revoked_refresh_jti`, `api_usage_ledger`.
4. **Chat history** — `platform_ai_chat_messages`.
5. **Quran / hadith** — `--with-quran-hadith` опциясымен.
6. **Indexes** — `idx_quran_updated_at`, `idx_hadith_updated_at` (Phase 6).
7. **Sequences** — Phase 6.5: `setval` (`api_usage_ledger`, `platform_ai_chat_messages`, `quran`, `hadith`) — COPY ішінде `id` көрсетілген кестелер үшін.
8. **Validation** — `--validate` немесе `--validate-only`.

SQLite көшірмесінде жетім жолдар болса, алдымен **`db/migrations.py` 008** іске қосылғанын тексеріңіз немесе скриптке **`--sanitize-sqlite-fk`** (файлды өзгертеді; көшірмеге қолданыңыз).

Көшіру сеансы: әдепкі **`pg_try_advisory_lock`** (қайталап жіберуден қорғаныс; сәтсіз болса **exit 4**). `--skip-advisory-lock` — тек ерекше жағдай. **`--copy-fetch-batch N`** — COPY кезінде SQLite `fetchmany` өлшемі.

---

## 7. Validation checklist

Көшіргеннен кейін (немесе `--validate-only`):

| Тексеру | Әдіс |
|---------|------|
| Жол саны сәйкестігі | `python ... --validate-only` — `platform_identities`, `platform_ai_chat_messages`, `api_usage_ledger`, `revoked_refresh_jti`, (опция) `quran`, `hadith` |
| `updated_at` бос емес | скрипт sqlite бойынша бос жол санын шығарады |
| Нақты жазбалар | SQL арқылы бірнеше `id` / `(surah, ayah)` салыстыру |
| `POST /auth/login` | API `RAQAT_DB_PATH` / DSN қайта қосылған соң |
| `GET /metadata/changes` | ETag + `since` + индекстер |
| `GET /users/me/history` | JWT + chat кестесі |

---

## 8. Cutover (қысқа жоспар)

1. **Тоқтату**: қысқа техникалық терезе (немесе көшірісті репликаға, соңғы DNS ауыстыру).
2. **Синхрон**: соңғы delta (қажет болса) қайта көшіру.
3. **Env**: `DATABASE_URL` қосу (немесе тек API-ға); ботқа да сәйкес DSN немесе уақытша SQLite fallback саясаты.
4. **Қосу**: health, auth, metadata, бірнеше тарих сұрауы.
5. **Бақылау**: usage ledger, latency, қате логтары.

### 8.1 Cutover кейін: `pg_stat_statements` және баяу сұраулар

Кесу алдында немесе жаңа кластерде **`pg_stat_statements`** кеңейтулін қосу тиімді: cutover-ден кейін бірден **ең көп CPU/уақыт алатын сұраулар** тізімін көріп, индекс немесе SQL түзету жоспарлауға болады.

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- postgresql.conf мысалы: shared_preload_libraries = 'pg_stat_statements'
```

Сұрауларды қарау (мысал): `SELECT query, calls, total_exec_time, mean_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;`

Толығырақ: **`docs/PG_SLOW_QUERIES_RUNBOOK.md`**.

Бұл **validation (§7)** пен **rollback жоспары (§9)** бірге нақты инженерлік пакет құрайды: алдымен дерек дұрыстығын тексеру, содан кейін өнімдегі сұрау профилі.

---

## 9. Rollback (қайтару жоспары)

Егер PostgreSQL-та ақау шықса:

1. **`DATABASE_URL` өшіру** (немесе бот/API `.env`-те SQLite жолына қайтару); пул қолданылса **`close_postgresql_pools()`** (restart барысында процесс өшкенде де жабылады).
2. **Қызметті қайта іске қосу** (systemd / docker restart).
3. **Postgres көшірмесі** сақталған күйде қалды — кейін талдау немесе қайта көшіру.
4. **Трафик** уақытша қайта **SQLite**-қа түседі (соңғы PG жазбаларымен айырмашылық болмауы үшін cutover терезесін қысқа ұстау маңызды).

---

## 10. SQL айырмашылықтары

- Плейсхолдерлер: SQLite `?` → psycopg `%s` немесе SQLAlchemy `text()` + `:name`.
- `PRAGMA table_info` → `information_schema.columns`.
- `sqlite_master` → `pg_catalog` / `information_schema.tables`.

---

## 11. `platform_api` оқу қабаты

`platform_api/content_reader.py` — **гибрид**: `DATABASE_URL` / `DATABASE_URL_READER` postgres болса `get_db_reader()` + `db/dialect_sql.execute` (`?` → `%s`), әйтпесе SQLite **тек оқу** URI. `metadata_diff_for_since` үшін `updated_at` салыстыруы PG-да `%s::timestamp`, SQLite-та `datetime(...)`.

`platform_api/db_reader.py` — әлі негізінен **жол шешуі** (`resolve_db_path`) және SQLite жолы; PG кезінде контент DSN `get_db_reader()` арқылы `content_reader` ішінде алынады.

---

## 12. Керек пакеттер

- Көшіру скрипті және `get_db()` PG: `pip install -r scripts/requirements-pg-migrate.txt` немесе түбіндегі **`requirements-postgres.txt`** (`psycopg[binary,pool]` — pool опциялық `RAQAT_PG_USE_POOL` үшін).
- Келешек: `sqlalchemy>=2` (опция).

---

## 13. Скрипт мысалдары

Бес бағытты бір орыннан қарау: **`docs/OPERATIONS_RUNBOOK_5_TRACKS.md`** (PG + JWT + Redis + mobile sync + `app.main` smoke).

```bash
pip install -r scripts/requirements-pg-migrate.txt
export PG_DSN=postgresql://user:pass@127.0.0.1:5432/raqat

# Толық цикл: bootstrap + truncate + контент + индекстер + валидация
python scripts/migrate_sqlite_to_postgres.py \
  --sqlite ./global_clean.db \
  --pg-dsn "$PG_DSN" \
  --bootstrap-ddl \
  --with-quran-hadith \
  --truncate \
  --validate

# Тек салыстыру (көшірусіз)
python scripts/migrate_sqlite_to_postgres.py \
  --sqlite ./global_clean.db \
  --pg-dsn "$PG_DSN" \
  --validate-only

# SQLite көшірмесінде жетім chat / usage сілтемелерін тазалау (қолданар алдында көшірме жасаңыз)
python scripts/migrate_sqlite_to_postgres.py \
  --sqlite ./global_clean.db \
  --pg-dsn "$PG_DSN" \
  --sanitize-sqlite-fk \
  --bootstrap-ddl --truncate --validate
```

`--truncate` **қауіпті** — өндірістік PG-да тек бос схема немесе тест ортасында қолданыңыз.

**`--resume`**: кестедегі жол саны SQLite-пен **толық сәйкес** болса, осы кестені қайта көшіру өткізіледі (скриптті қайта іске қосу). Жартылай COPY қалғанда сандар сәйкеспейді — алдымен `--truncate` немесе қолмен `TRUNCATE`.

**Контент (Құран/хадис) репода әрдайым толық болмауы мүмкін** — `bash scripts/import_content_pipeline.sh` схеманы жаңартады да, `hadith_corpus_sync.py` / `import_quran_*.py` үшін мысал командаларды шығарады (`docs/DEV_LOCAL_CHECKLIST.md`).

**Жылдам жол (құран + хадисті PG-ға бір скриптпен):** `bash scripts/copy_quran_hadith_full.sh` — ішінде жоғарыдағы `--bootstrap-ddl --with-quran-hadith --truncate --validate` шақырылады; `PG_DSN` немесе `DATABASE_URL`, SQLite үшін `RAQAT_DB_PATH` / `DB_PATH`.

### 13.1 Docker: локальды PostgreSQL + pytest

Контейнер (порт 5432 бос болуы керек):

```bash
docker run -d --name raqat-pg-test \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=raqat_test \
  -p 5432:5432 \
  postgres:16

export RAQAT_PG_TEST_DSN="postgresql://postgres:postgres@127.0.0.1:5432/raqat_test"
pip install -r requirements-postgres.txt
pytest tests/test_pg_migrate_integration.py -v -m integration
```

Интеграциялық тест bootstrap + көшіру + `--validate` орындайды; `RAQAT_PG_TEST_DSN` жоқ болса тест **skip**.

---

## 14. Enterprise-тайығы: оқшаулау, сақтық көшірме, кілт, сұрау қабаты

### 14.1 Транзакция оқшаулауы (PostgreSQL)

PostgreSQL әдепкі жазба деңгейі — **READ COMMITTED**; көпшілік API/auth/чат сценарийлері үшін жеткілікті (әр сұрау жаңа тұрақты көрініс көреді).

- **REPEATABLE READ** немесе **SERIALIZABLE** — бір транзакция ішінде бірнеше рет оқу **бірдей снимок** керек болғанда (мысалы, есеп + тексеру бір уақытта); чат тарихын беттеу + жазу үшін әдетте RC жетеді, бірақ **фантом жолдар** сезілсе деңгейді көтеруге болады.
- Қолданба деңгейінде: `get_db()` қазір psycopg әдепкісін қолданады; арнайы деңгейді `BEGIN ISOLATION LEVEL REPEATABLE READ` сияқты explicit транзакцияларды **репозиторий ішінде** қысқа транзакциялармен шектеген дұрыс.

### 14.2 Сақтық көшірме (production)

| Әдіс | Мақсаты |
|------|---------|
| **`pg_dump` / `pg_dumpall`** | Логикалық сnapshot, схема + дерек; cutover алдында міндетті нүктелік сақтық көшірме. |
| **Негізгі физикалық (`pg_basebackup`) + WAL** | Үлкен инстанстар, RTO/RPO талабы. |
| **PITR** | `archive_mode` + WAL архив — уақытқа дейін қайтару. |

Cutover алдында: кем дегенде бір **толық `pg_dump`** (немесе Barman/pgBackRest саясаты) және сақтық көшірме сақталатын орынның тексерілген болуы.

### 14.3 Migration lock (қайталап жібермеу / соқтығыс)

- Скрипт әдепкі бойынша **`pg_try_advisory_lock(bigint)`** алады; екінші сеанс lock алмаса **exit code 4** және хабарлама (қайталап көшіруден туатын **duplicate / conflict** қаупін азайтады).
- Сеанс аяқталғанда (сәтті немесе қате) `pg_advisory_unlock` **finally** ішінде шақырылады; процесс «өлсе», сессия жабылып lock серверде босайды.
- Ерекше жағдай: `--skip-advisory-lock` (екі көшіруді әдейі қалағанда ғана; өндірісте сақтанды).

### 14.4 Query layer (`?` → `%s`) — келесі bottleneck

Кодта әлі SQLite **`?`** көп; PostgreSQL-ке толық көшкенде **`%s`** немесе **аталы параметрлер** (`%(name)s`) қажет.

- **Автоматты replace қауіпті** (f-string, динамикалық SQL). Ұсыныс: `python scripts/audit_sql_placeholders.py` — күдікті файл/жолдар тізімі, содан кейін қолмен ревью.
- **`db/dialect_sql.py`**: `execute(conn, sql, params)` — sqlite `?` сақталады; psycopg үшін **`?` → `%s`**, `datetime('now')` → **`CURRENT_TIMESTAMP`**; `platform_identity_chat` осы қабатты қолданады.
- `platform_api`, `db/`, `handlers/`, `services/` — қалған модульдерді біртіндеп осы үлгіге шығару + интеграциялық тест.

### 14.5 Sync vs async

**Әдепкі ұсыным (операциялық қарапайым):** **sync** `psycopg` + `get_db()` контексті, migrate скрипті, pool — FastAPI синхронды dependency үшін жеткілікті.

**Async** (`asyncpg`, SQLAlchemy async) — тек нақты async endpoint/көлемді параллель I/O артықшылығы өлшенгенде енгізуге тұрарлық; қосымша күрделілік (екі қабат, тест) бар.

### 14.6 Көлем бағамы (chunk / COPY таңдау)

Нақты сан ортаңыздағы `global_clean.db` бойынша өзгереді; жоспарлау үшін **шамамен**:

| Кесте | Типтік тәртіп | COPY / batch |
|--------|----------------|--------------|
| `quran` | ~6k жол (сүре×аят) | Скрипт: **COPY FROM STDIN**, SQLite `fetchmany` (әдепкі 10k, `--copy-fetch-batch`) |
| `hadith` | мыңнан миллионға дейін | COPY + chunked оқу |
| `platform_identities` | әдетте 10³…10⁵ | `executemany` жеткілікті |
| `platform_ai_chat_messages` | 10⁴…10⁶+ | қажет болса кейін COPY/`execute_batch`; қазір `executemany` |

### 14.7 FTS (мәтін іздеу)

- **Ішкі толық мәтін іздеу (сөз тәртібі, вебаналог):** `to_tsvector` / `to_tsquery` + **`tsvector` баған + GIN** — PostgreSQL built-in, көп сценарий үшін бастапқы нұсқа.
- **`pg_trgm`** — `%foo%`, үшграммалық ұқсастық, «мәтін ішінде ілеспе»; араб/көп тілді миксте конфигурацияны бөлек тестілеу керек.
- Құран/хадис араб мәтіні үшін тілдік конфиг (`text_search_config`) таңдау — бөлек инженерлік қадам.

### 14.8 Pool (қайталау)

- **`RAQAT_PG_USE_POOL` әдепкі: өшіқ** (`false`); қосқанда **`RAQAT_PG_POOL_MIN=1`**, **`RAQAT_PG_POOL_MAX=10`** — өнім жүктемесіне қарай тюнинг.

---

## 15. Нұсқа таңдауы — жауаптар (репо күйі, сұрақтарға)

| Сұрақ | Шешім (қазіргі репо) |
|--------|----------------------|
| **A / B / C** | **A-ға жақын** нұсқа: `get_db`, migrate (COPY, lock, sanitize, validate, **`--resume`** — жол саны сәйкес кестені өткізіп жіберу), requirements, Docker+pytest. Толық «жартылай COPY қалпына келтіру» үшін TRUNCATE + қайта көшіру қажет. |
| **Sync vs async** | **Sync psycopg** (қолданба + migrate). **asyncpg** — өлшенген пайда болмаса қоспаңыз. |
| **Дерек көлемі** | Нақты сан **ортаңыздағы DB** (`SELECT COUNT(*)`) бойынша; §14.6 кестесі — бағалау үшін. `chunk_size` = `--copy-fetch-batch` (әдепкі 10k). |
| **FTS** | **Бастапқы: `tsvector` + GIN**; `pg_trgm` — ұқсастық/%like% сценарийлері. Үлгі SQL: `scripts/bootstrap_pg_fts.sql` (қолмен қолдану). |
| **Пул** | **`RAQAT_PG_USE_POOL` әдепкі өшіқ**; қосқанда min=1, max=10. |

### 15.1 Cutover / rollback / smoke (қысқа runbook)

| Тақырып | Әрекет |
|---------|--------|
| **Терезе** | Жазуды тоқтату немесе қысқа maintenance; соңғы **delta** қайта migrate (қажет болса). |
| **ENV** | `DATABASE_URL` қосу (немесе `DATABASE_URL_WRITER`); бот/API бірдей саясат; **`close_postgresql_pools()`** restart. |
| **Валидация** | `--validate` / `--validate-only`; API: `scripts/dev_verify_platform_flow.py`; pytest: `tests/test_platform_api.py`. |
| **Мониторинг** | §8.1 `pg_stat_statements`. |
| **Rollback (quick)** | `DATABASE_URL` өшіру → SQLite `RAQAT_DB_PATH`; терезені қысқа ұстау. |

### 15.2 systemd / Docker env (мысал үзінді)

```ini
# /etc/systemd/system/raqat-platform-api.service.d/override.conf мысалы
[Service]
Environment=RAQAT_DB_PATH=/var/lib/raqat/global_clean.db
Environment=RAQAT_JWT_SECRET=…минимум32…
Environment=RAQAT_AI_PROXY_SECRET=…
Environment=RAQAT_BOT_LINK_SECRET=…
# cutover кейін:
# Environment=DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/raqat
```

Docker: §13.1 (`postgres:16`, `RAQAT_PG_TEST_DSN`).

---

## 16. Қысқа verdict

- Ой деңгейі: дұрыс (oқу/жазу, cutover, rollback, мониторинг, lock, COPY, **setval**).
- Архитектура: `db/get_db.py` (SQLite + psycopg + опция pool), скрипт (**advisory lock**, quran/hadith **COPY**, **sequence sync**), UUID, FK/UNIQUE, `updated_at` индекстері.
- Келесі bottleneck: **`?` → `%s`** репозиторийлер (`scripts/audit_sql_placeholders.py`), CONCURRENTLY индекстер (үлкен өндіріс), FTS бағанды нақты енгізу (`bootstrap_pg_fts.sql` үлгісі).

---

*Файлдар: `docs/MIGRATION_SQLITE_TO_POSTGRES.md`, `docs/PG_SLOW_QUERIES_RUNBOOK.md`. Код: `db/get_db.py`, `db/dialect_sql.py`, `scripts/migrate_sqlite_to_postgres.py`, `scripts/audit_sql_placeholders.py`, `scripts/bootstrap_pg_fts.sql`.*
