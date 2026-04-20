# RAQAT — толық платформа брифі (GPT / сыртқы талдау үшін)

Бұл құжатты басқа модельге немесе серіктеске **бірден жіберуге** болады: веб, мобильді, Telegram бот, `platform_api`, SQLite, скрипттер мен қауіпсіздік моделі. **`.env` құпиялары осы мәтінге енгізілмейді.**

**Соңғы жинақ (бір сессияда жеткілікті минимум):** **§22** (ops / API / мобильді UI принциптері) → **§23** (SQLite auth схемасы, миграция 012–014) → **§24** (барлық тақырып бойынша **толық сілтеме картасы**). Өндіріс шегі мен аудит жауаптары: **`docs/PRODUCTION_POSTURE.md`**. Ұзын мәтінді толық оқудың орнына: §22–§24 + `PRODUCTION_POSTURE` + қажет құжат (кесте §24).

---

## 25. Mobile update (2026-04-20) — Halal/Barcode/Qibla/UI + APK

Бұл бөлім соңғы мобильді өзгерістерді бір жерге жинайды. GPT/әзірлеушіге жаңа контекст керек болса, **осы §25 + §6 + §22** жеткілікті.

### 25.1 Halal: E-code база және AI prompt толықтыру

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/content/halalEcodeDb.ts` | Жаңа E-code анықтама базасы (`HALAL_ECODE_ENTRIES`), `findEcodesInText`, `formatEcodeAppendixForPrompt`, `halalEcodeEntriesSorted` |
| `mobile/src/content/halalAiPrompts.ts` | `buildHalalTextPrompt` ішінде мәтіннен табылған E-code-тарға қосымша анықтама блогы автоматты қосылады |
| `mobile/src/screens/HalalScreen.tsx` | E-code glossary UI (scroll + row styles), қолданушыға базаны экранда көрсету |

### 25.2 Barcode smart flow (Open Food Facts)

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/services/barcodeNormalize.ts` | QR/OFF URL-дан код алу; GTIN/UPC candidate генерациясы (`barcodeLookupCandidates`) |
| `mobile/src/services/openFoodFacts.ts` | `fetchProductByBarcodeSmart`: бірнеше candidate-пен іздеу; host fallback (`world.openfoodfacts.org` + `openfoodfacts.org`), retry/backoff |
| `mobile/src/components/HalalBarcodeScannerModal.tsx` | OFF product URL және цифрлық кодтарды smart қабылдау |
| `mobile/src/i18n/kk.ts` | Штрихкод hint мәтіні: UPC/EAN/GTIN және көп-нұсқалы lookup туралы түсіндірме |

### 25.3 Qibla жылдам/дәл қозғалыс тюнингі

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/context/QiblaSensorContext.tsx` | Магнитометр update интервалы `80ms -> 16ms`; emit фильтрі агрессивті; EMA alpha реакция үшін көтерілді |
| `mobile/src/components/QiblaArrowPointer.tsx` | Arrow spring параметрлері жылдамдатылды (`tension` өсірілді, `friction` азайды) |

Нәтиже: стрелка қозғалысы әлдеқайда жылдам және кідірісі аз.

### 25.4 UI өзгерістер (Dashboard / Tabs / Seerah)

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/navigation/MainTabBar.tsx` | Төменгі таб төмен түсірілді және ықшамдалды (icon/label/padding азайтылды) |
| `mobile/src/screens/DashboardScreen.tsx` | Header-дегі құбыла белгісі button емес, жай визуал; өлшемі `36x36`; үстіңгі `Halal/AI` қатар иконкалары кішірейтілді |
| `mobile/src/screens/SeerahScreen.tsx` | Сира ішіндегі lesson card суреттері алынды (мәтін-only карточкалар) |

### 25.5 Тесттер және build күйі

| Тексеру | Нәтиже |
|---------|--------|
| `npm run lint` (`mobile`) | OK (`tsc --noEmit`) |
| `npm run test:full` | OK, **5 suite / 20 test passed** |
| Қосылған unit tests | `src/services/__tests__/barcodeNormalize.test.ts`, `src/services/__tests__/openFoodFacts.test.ts`, `src/content/__tests__/halalEcodeDb.test.ts` |
| APK build | `npm run build:apk` — **BUILD SUCCESSFUL** |
| APK жолы | `mobile/android/app/build/outputs/apk/release/app-release.apk` |

### 25.6 Қысқа next steps

1. Реал құрылғыда Qibla sensor calibration UX (fast vs stable toggle) қосу.  
2. OFF rate-limit (`429`) үшін adaptive backoff + telemetry өрісін қосу.  
3. Halal E-code базасын JSON/remote config-ке шығарып, кодсыз жаңарту арнасын ашу.

## GPT-ге қалай жіберу (ChatGPT, Claude, Cursor, т.б.)

### Ең қарапайым жол

1. Осы файлды ашыңыз: **`docs/PLATFORM_GPT_HANDOFF.md`** (толық мәтінді көшіріп жіберіңіз **немесе** тіркеме ретінде беріңіз).
2. Өнім стратегиясы керек болса, қосымша: **`docs/RAQAT_PLATFORM.md`** (солтүстік жұлдыз, XI–XII).
3. Хабарламада мынаны жазыңыз: *«Контекст — төмендегі RAQAT брифі. Менің тапсырмам: …»* және нақты сұрақты қосыңыз.

### Тереңдету пакеті (қажетіне қарай)

| Деңгей | Файлдар |
|--------|---------|
| **Минимум** | `PLATFORM_GPT_HANDOFF.md` |
| **+ өнім** | `RAQAT_PLATFORM.md` |
| **+ Құран мазмұны** | `QURAN_GPT_HANDOFF.md` |
| **+ Auth / JWT / тарих** | `PLATFORM_ROADMAP_API_AI_USERS.md` |
| **+ PostgreSQL көшу** | `MIGRATION_SQLITE_TO_POSTGRES.md` |
| **+ локальды тексеру** | `DEV_LOCAL_CHECKLIST.md` |
| **+ экожүйе карта + 2M blueprint** | `ECOSYSTEM.md` (түбір), `PRODUCTION_BLUEPRINT_2M_USERS.md`, `apps/`, `packages/`, `infra/docker/` |
| **+ Alembic / PG audit DDL** | `ALEMBIC_BOOTSTRAP.md` |
| **+ өндіріс стегі (Redis, PG, Celery, DNS, metrics)** | `OPERATIONS_STACK_CHECKLIST.md`, `scripts/ops_stack_checklist.sh` |
| **+ өндіріс аудитіне жауап (SQLite жоқ, Redis міндетті, monitoring/cache/Celery)** | `PRODUCTION_POSTURE.md` |
| **+ толық сілтеме картасы (барлық тақырып бір кестеде)** | осы файл **§24** |

### Жібермеу керек

- `.env`, нақты **BOT_TOKEN**, **GEMINI_API_KEY**, **RAQAT_JWT_SECRET**, **RAQAT_AI_PROXY_SECRET**, пароль хэштері.
- Клиентке арналған **құпияны** өндірісте чатқа қоймаңыз; тек орын атауы (мысалы *«RAQAT_AI_PROXY_SECRET орнатылған»*) жеткілікті.

### Бір жолдық сұраныс үлгісі (көшіріп қолдану)

```text
Төменде RAQAT платформасының инженерлік брифі (docs/PLATFORM_GPT_HANDOFF.md) беріліп тұр.
Оны негізге алып, [мысалы: мобильді AI чатты JWT-ға көшіру / PostgreSQL cutover / endpoint қосу] үшін нақты қадамдар мен файл жолдарын ұсыныңдар.
Код құпияларын сұрама — тек айнымалы атауларын ата.
```

---

| Қосымша құжат | Мазмұны |
|-----------------|--------|
| `docs/RAQAT_PLATFORM.md` | **Солтүстік жұлдыз** (USER / VALUE / UX), стратегия, mermaid, **XI** қабаттар, **XII** тех. басымдықтар |
| `docs/QURAN_GPT_HANDOFF.md` | Құран `text_kk` / `translit`, импорт, аудит |
| `docs/HADITH_DATA_PROVENANCE.md` | Хадис: `source` дәл мәндері, кітап ↔ slug, JSON синк, KK аударма жолдары |
| `docs/PLATFORM_ROADMAP_API_AI_USERS.md` | Auth, profile, тарих, келесі фаза |
| `docs/MIGRATION_SQLITE_TO_POSTGRES.md` | SQLite → PostgreSQL дайындық (COPY, advisory lock, isolation, backup, audit) |
| `docs/DEV_LOCAL_CHECKLIST.md` | Локальды: `/ready`, `/health`, JWT, `dev_verify_platform_flow.py` |
| `scripts/audit_sql_placeholders.py` | `?` плейсхолдер аудиті (PG `%s` көшуіне дайындық) |
| `tests/test_auth_link.py` | `POST /auth/link/telegram` — бот құпиясы, uuid JWT, идемпотенттілік; **legacy access JWT** uuid емес `sub` → **400** `SUB_NOT_PLATFORM_UUID` (`conftest`: **`RAQAT_REDIS_REQUIRED=0`**) |
| `scripts/healthcheck_raqat.sh` | Дерекқор файлы + API `/ready` + `/health` (резерв) + бот процесі |
| `scripts/backup_sqlite.sh` | SQLite сақтық көшірмесі (`backups/`, соңғы 14 файл) |
| `scripts/nightly_maintenance.sh` | Түнгі: backup + healthcheck → `.logs/nightly_maintenance.log` |
| `scripts/copy_quran_hadith_full.sh` | Контентті PG/SQLite көшіру орамы (`MIGRATION_SQLITE_TO_POSTGRES.md`) |
| `platform_api/README.md` | API endpoint, `/ready`, орта айнымалылар |
| `ECOSYSTEM.md` | Репо құрылымы: `platform_api`, `mobile`, `apps/*` картасы, Docker Postgres/Redis |
| `docs/PRODUCTION_BLUEPRINT_2M_USERS.md` | 2M+ user modular monolith, Redis/Celery/PG HA build order |
| `docs/ALEMBIC_BOOTSTRAP.md` | PostgreSQL + Alembic бастау, `audit_events` PG DDL мысалы |
| `docs/OPERATIONS_RUNBOOK_5_TRACKS.md` | **PG cutover + JWT link + Redis/cache + mobile sync + app.main** бір runbook (командалар, rollback, скрипт жолдары) |
| `docs/OPERATIONS_STACK_CHECKLIST.md` | **Redis + `RAQAT_QUEUE_BACKEND=celery` + PG cutover (`run_pg_cutover.sh`) + DNS (`fix_dns_resolved.sh`) + API/worker + `/metrics`** — бір беттік ops чеклист |
| `docs/PRODUCTION_POSTURE.md` | **Өндіріс аудиті:** PG міндетті, Redis міндетті (`REQUIRED=0` — тек тест), `/metrics` + Prometheus/Grafana, семантикалық кэш, Celery retry/timeout vs DLQ жол картасы |
| `scripts/ops_stack_checklist.sh` | Терминалда жоғары чеклистті мәтін түрінде шығару |
| `platform_api/celery_tasks.py` | Celery: `raqat.ai.chat`, `analyze_image`, `tts`, `transcribe` — ауыр AI жұмысы фонда |
| `mobile/src/utils/uiDefer.ts` | `runWhenHeavyWorkAllowed` — Құран бандл сидингі UI қатырмасын азайту |
| `mobile/src/navigation/MainTabBar.tsx` | Төменгі таб: **дұға** және **тәсбих** (екі баған); 99 есім — басты экран промо карточкасынан |
| `mobile/src/screens/DashboardScreen.tsx` | Басты экран: 99 есім промо карточкасы (`asmaPromoRow`) |
| `mobile/src/screens/SettingsScreen.tsx` | Баптаулар: үстінде аккаунт (API қосылғанда), астында **жобаға үлес**; `getRaqatDonationUrl()` ← `EXPO_PUBLIC_RAQAT_DONATION_URL` / `app.json` extra |
| `mobile/src/config/raqatDonationUrl.ts` | Донат/қолдау URL (опция) |
| `data/hadith_kk_glossary.md` | Хадис KK терминдері — редакциялық глоссарий каркасы |
| `data/hadith_kk_editorial_batches.md` | Сахих id ауқымдары бойынша батчтар, SQL, чеклист |

---

## Платформаның негізгі инженерлік шешімдері (қысқа бриф)

Жүйе қазіргі уақытта SQLite-тен PostgreSQL-ге **көшу фазасында**. Төмендегі құжаттың **§1** (өнім, дерекқор, identity, метадеректер) және **§5** (API) ішінде толық техникалық мәтін бар. Көшу жоспары: `docs/MIGRATION_SQLITE_TO_POSTGRES.md`.

### Өнім басымдықтары: acquisition → retention

| Басымдық | Мазмұны |
|----------|--------|
| **Acquisition (қазіргі ең басты олқылық)** | Активті пайдаланушы базасы әлі қалыптаспаған — сондықтан инженерлік жұмыс (DB cutover, JWT, linking, мобильді синхрон) **алдымен сенімді onboarding және тұрақты қолжетімділік** арқылы «алғашқы пайдаланушыны» қабылдауға бағытталуы тиіс. |
| **Retention** | Пайдаланушы келгеннен кейін **қайта оралу** және **күнде қолдану** — өнімдік ілмектер: басты экрандағы **үш тірек** (намаз · күнделікті аят · бір сұрақ AI), **хабарламалар** (намаз уақыты), бот пен мобильдіде **бір тұлға** (`platform_identities` + ортақ `platform_ai_chat_messages` тарихы). Толық стратегия: `docs/RAQAT_PLATFORM.md` (USER / VALUE / UX). |

Инженерлік шешімдер (төмен §1.1–1.3, инкременттік синхрон, ops) retention-ды **қолдайды**, бірақ олардың өзі пайдаланушы әкелмейді — маркетинг, контент және UX бірге жұмыс істеуі керек.

### 1.1 Дерекқор абстракциясы (Hybrid Storage)

`db/get_db.py` бұл процесті **жұмсақ** етеді:

| Тақырып | Сипат |
|---------|--------|
| **Context manager** | Барлық код **`with get_db() as conn:`** (немесе `get_db_reader()` / `get_db_writer()`) арқылы бір интерфейстен жұмыс істейді. |
| **Lazy pooling** | PostgreSQL қосылғанда ғана **`psycopg_pool`** іске қосылады (**`RAQAT_PG_USE_POOL=1`**); әйтпесе `psycopg.connect` сессиясы. |
| **Dialect awareness** | SQLite **`?`** пен PostgreSQL **`%s`**, уақыт, `INSERT OR IGNORE` / `ON CONFLICT` — **`db/dialect_sql.py`** және модульдік `_exec` үлгісі. |

Толығырақ: төмен **§1.1**, `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §4.

### 1.2 Identity & Linking (бірыңғай сәйкестендіру)

RAQAT-тың ең үлкен артықшылығы — пайдаланушыны барлық интерфейсте тану:

- **UUID жүйесі:** Telegram `user_id` платформалық UUID-ге байланады (**`platform_identities`**).
- **JWT `sub`:** авторизация кезіндегі токен ішінде осы UUID (**`sub`**) жүреді.
- **Автоматты linking:** **`/start`** кезінде бот **`POST /api/v1/auth/link/telegram`** арқылы платформалық токенді алады (`handlers/start.py` → **`ensure_telegram_linked_on_platform`**, `RAQAT_PLATFORM_API_BASE` + **`RAQAT_BOT_LINK_SECRET`** орнатылғанда; жауап **`user_preferences.platform_token_bundle`**). Осылайша пайдаланушы ботпен сөйлессе де, ертең мобильді қолданбаны (Expo) жүктесе де, оның бүкіл тарихы **`platform_ai_chat_messages`** кестесінен бірдей оқылады (`source=telegram` / `source=api`).

#### 1.2.1 Бір жүйе — деректердің бір көзі (мақсат)

Біз **барлық интерфейсті** (Telegram бот, мобильді, `platform_api`, кейінгі веб) **бір логикалық жүйе** ретінде байлаймыз: пайдаланушының «кім екені» және **AI/профиль тарихы** үшін **шындық көзі** — платформа дерекқоры (`platform_identities` + `platform_ai_chat_messages` + JWT; аудит/ledger §21). Боттағы **SQLite** — негізінен **күй** (тіл, onboarding, `platform_token_bundle` / `_paused`, ops-журнал); **контент пен орталық AI** мақсатты режимде **тек API** арқылы: `RAQAT_BOT_API_ONLY=1`, `RAQAT_SINGLE_SOURCE_MODE=1` (тікелей клиенттік Gemini fallback өшірілген). Пайдаланушы мәзірдегі **«Бір дене»** түймесімен платформа JWT қосады немесе үзеді (`handlers/unified_body.py`).

Толығырақ: төмен **§1.2**, «Telegram → AI чат → API» кестесі; cutover: `docs/API_ONLY_ECOSYSTEM_CUTOVER.md`.

### 1.3 Орталық AI Proxy

Қауіпсіздік пен шығынды бақылау үшін **Gemini API кілті тек серверде** (`platform_api`, `GEMINI_API_KEY`) сақталады; мақсатты режимде клиенттерде кілт жоқ.

- **Multimodal:** сурет талдау (**halal check**), дауыс → мәтін және **TTS** орталықтандырылған — `/api/v1/ai/*` (`ai_routes.py`, `ai_proxy.py`, `ai_multimodal.py`).
- **Auth scopes:** AI-ға сұраныс жіберу үшін JWT ішінде арнайы **`ai`** рұқсаты (scope) болуы тиіс; немесе **`X-Raqat-Ai-Secret`** (`jwt_auth.py`, `ai_security.py`).
- **Жылдамдық / шығын:** `ai_proxy` — thinking өшіру, `max_output_tokens`; **Redis exact cache** (`/ai/chat` жауабында `cached`) — §21.2–21.3.

Толығырақ: төмен **§1** өткел (`RAQAT_PLATFORM_API_BASE` / `RAQAT_AI_PROXY_SECRET`), **§5.2**, **§10**, **§21**.

### 2. Инкременттік синхрондау механизмі

Мобильді қолданбалар трафикті үнемдеп, жылдам жұмыс істеуі үшін **`GET /api/v1/metadata/changes`** қолданылады:

- **ETag тексеру:** клиент хэш жібереді (`If-None-Match`), өзгеріс жоқ болса — **`304 Not Modified`**.
- **Since diff:** дерекқорда **`updated_at`** (миграция **005**) болса, клиент тек соңғы синхроннан бері өзгерген **id** тізімдерін алады. **Бүкіл корпусты қайта жүктеу қажеттілігін жояды.**

Толығырақ: төмен **§1.3** (метадеректер), мобильді: `contentSync.ts`.

### 3. Келесі қадамдар және интеграция

Соңғы құжаттар бойынша келесі фазаға дайындық:

| Бағыт | Мазмұны |
|--------|--------|
| **PostgreSQL cutover** | `docs/MIGRATION_SQLITE_TO_POSTGRES.md` нұсқаулығы бойынша **DSN ауыстыру** және **пулдарды баптау**; §15, сақтық көшірме. |
| **Placeholder audit** | `python scripts/audit_sql_placeholders.py` — барлық сұраныстарды жаңа базаға үйлесімді ету (`?` → `%s`, SQLite-спецификалық DDL т.б.). |
| **Identity linking** | Бот пен API арасындағы **`RAQAT_BOT_LINK_SECRET`** арқылы **толыққанды JWT айналымын** қамтамасыз ету (ботта `/start` link; мобильді/клиент өз токенін сақтайды). |
| **Локальды даму** | `bash scripts/dev_restart_platform.sh` — бүкіл инфрақұрылымды бір командамен қайта іске қосу (API 8787 + миграция; бот опциямен). Толығырақ: `docs/DEV_LOCAL_CHECKLIST.md`. |
| **Өндіріс мониторингі** | **`GET /health`** — liveness (процесс тірі). **`GET /ready`** — readiness: `get_db_reader()` + `SELECT 1` (SQLite немесе PostgreSQL); **503** = DB қосылмаған. **`GET /metrics`** — `uptime_seconds`, `http_5xx_total`, latency терезесі (in-process). `scripts/healthcheck_raqat.sh` — `/ready`, `/health`, **`/metrics`**. Cron: `scripts/nightly_maintenance.sh` (backup + журнал). Толық стек қадамдары: **`docs/OPERATIONS_STACK_CHECKLIST.md`**. |

---

## 1. Өнім мақсаты

RAQAT — исламдық контент пен құралдар: **Құран**, **хадис**, **намаз уақыты**, **құбыла**, **тәсбих**, **halal** (сурет), **дауыс + AI чат + TTS**.

**Мақсатты архитектура:** клиенттерде Gemini кілті болмайды; сұраулар **орталық `platform_api`** арқылы.  
**Қазіргі өткел:** `.env`-те `RAQAT_PLATFORM_API_BASE` және `RAQAT_AI_PROXY_SECRET` толтырылса, боттағы **барлық AI** (чат, halal сурет, дауыс транскрипциясы, TTS) **API арқылы** жүреді; әйтпесе ботта **`GEMINI_API_KEY`** тікелей `google-genai` қолданылады.

**Платформа пайдаланушысы:** Telegram `user_id` ↔ тұрақты **`platform_user_id`** (uuid), JWT ішінде `sub` / `telegram_user_id`. AI чат тарихы **бір кестеде** (`platform_ai_chat_messages`) — SQLite немесе PostgreSQL DSN бойынша; бот (`source=telegram`) мен API (`source=api`) бір JSON схемасымен оқылады.

### 1.1 Дерекқор абстракциясы (`db/get_db.py`)

**Негізгі идея:** өтпелі кезеңде бір **`with get_db() as conn:`** контекст менеджері — қосымша код **бір интерфейстен** (`conn.execute`, `fetchone`, …) жұмыс істейді; артқы жағы SQLite немесе PostgreSQL.

Нақты код (жалпы скетчтен айырмашылықтар):

| Тақырып | Реализация |
|---------|------------|
| PG қашан қосылады | `DATABASE_URL` **немесе** `DATABASE_URL_WRITER` мәнінің **`postgresql://...`** префиксі (`is_postgresql_configured()`). |
| DSN | **`postgresql_dsn()`** — алдымен `DATABASE_URL_WRITER`, содан `DATABASE_URL`. |
| Пул | **Әдепкі өшіқ**; `RAQAT_PG_USE_POOL=1` болғанда ғана **ленивті** `psycopg_pool.ConnectionPool` (`threading.Lock`, `RAQAT_PG_POOL_MIN` / `MAX`). |
| PG қосылым | Пулсыз: `psycopg.connect(dsn, row_factory=dict_row)`; барлығы контекст ішінде commit/close. |
| SQLite | Тікелей `sqlite3.connect` емес — **`db.connection.db_conn(sqlite_database_path())`**: WAL, `foreign_keys=ON`, `busy_timeout`. |
| Оқу/жазу бөлінісі | **`get_db_reader()`** / **`get_db_writer()`** — келешекте `DATABASE_URL_READER` / writer; қазір writer = `get_db()`. |
| Shutdown | **`close_postgresql_pools()`** — uvicorn lifespan / тест соңы. |
| SQL диалектісі | **`db/dialect_sql.py`** — плейсхолдер (`?` ↔ `%s`), уақыт, `INSERT OR IGNORE` / `ON CONFLICT` үйлесімі (PG көшуі). |

```mermaid
flowchart TD
  G[get_db] --> P{postgres DSN?}
  P -->|иә| Q{RAQAT_PG_USE_POOL?}
  Q -->|иә| R[ConnectionPool + connection]
  Q -->|жоқ| S[psycopg.connect dict_row]
  P -->|жоқ| T[db_conn sqlite_database_path WAL FK]
```

Толығырақ: `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §4.

### 1.2 Сәйкестендіру және байлау (Identity & Linking)

**Экожүйенің тірегі:** Telegram `user_id` ↔ **`platform_user_id`** (uuid) ↔ JWT **`sub`** ↔ `platform_identities` / `platform_ai_chat_messages`.

| Қадам | Сипат |
|-------|--------|
| UUID құру/табу | `db/platform_identity_chat.ensure_platform_user_for_telegram` — кестеде жол жоқ болса uuid INSERT; қайталау race-інде unique constraint + қайта оқу. **PostgreSQL:** `DATABASE_URL` болса `_platform_db` → `get_db_writer()` (sqlite `db_path` елемейді); әйтпесе `db_conn(db_path)`. |
| JWT + tg бір уақытта | **`POST /api/v1/auth/link/telegram`**: дене `{ "telegram_user_id": int }`, header **`X-Raqat-Bot-Link-Secret`** = ортадағы `RAQAT_BOT_LINK_SECRET` — жауапта **access (+ refresh)**, `sub` = uuid, `telegram_user_id` claim. |
| Боттағы чат | `handlers/ai_chat.py` → **`append_telegram_ai_turn`** → сол uuid кеңістігінде хабарламалар (`source=telegram`). |
| API чат | `POST /api/v1/ai/chat` (JWT uuid `sub` болса) → **`append_ai_exchange`** (`source=api`). |

**Мақсатты сценарий (мобильді / бот интеграциясы):** `/start` кезінде бот **`RAQAT_PLATFORM_API_BASE`** + **`RAQAT_BOT_LINK_SECRET`** орнатылғанда **`POST /api/v1/auth/link/telegram`** шақырады (`services/platform_link_service.py`) — identity құрылады/табылады, **JWT** жауабы `user_preferences.platform_token_bundle`-да сақталады. Мобильді клиент өз JWT-сін алғанда **сол uuid** бойынша `/users/me/history` қолдана алады.

#### Telegram → AI чат → API (бір қолданушы ағыны)

| Қадам | Не болады |
|-------|-----------|
| 1. `/start` | `log_event` → **`ensure_telegram_linked_on_platform`** (опция): API **`ensure_platform_user_for_telegram`** + JWT; тіл таңдау / меню / onboarding. |
| 2. AI чатқа кіру + хабарлама | `handlers/ai_chat.py`: rate limit → `ask_genai` → **`append_telegram_ai_turn`**. |
| 3. Жүйе: identity | Егер §1 қадам link орындалған болса — uuid бұрыннан бар; әйтпесе **`append_telegram_ai_turn`** ішінде **`ensure_platform_user_for_telegram`**. |
| 4. Жүйе: тарих | `append_ai_exchange`: **`platform_ai_chat_messages`** — `user` және `assistant`, **`source=telegram`**. |
| 5. API: JWT | `/start` link сәтті болса — жауап сақталған **`access_token`** (немесе қолмен **`POST /auth/link/telegram`**). |
| 6. API: профиль | **`GET /api/v1/users/me`** (Bearer) — `platform_user_id`, `telegram_user_id`, scopes т.б. |
| 7. API: тарих | **`GET /api/v1/users/me/history`** — сол uuid бойынша хабарламалар (`items`, `next_before_id`). |

Ескертпе: **`RAQAT_PLATFORM_API_BASE` / `RAQAT_BOT_LINK_SECRET` бос болса**, link өтпейді — identity+тарих әлі де AI алғашқы айналымынан кейін пайда болады, JWT ботта сақталмайды. Синтетикалық тексеру: `scripts/dev_verify_platform_flow.py`.

Код: `platform_api/auth_routes.py`, `db/platform_identity_chat.py`, `db/dialect_sql.py`.

### 1.3 Метадеректер синхроны (`GET /api/v1/metadata/changes`)

Офлайн / инкременттік жаңарту үшін **incremental diff** (мобильді: `contentSync.ts`, `If-None-Match` + `since`).

| Параметр / тақырып | Сипат |
|--------------------|--------|
| **ETag** | Дерекқор күйінің қысқа хэші; клиент **`If-None-Match`** жіберсе, өзгеріс жоқ болса **`304 Not Modified`**. |
| **Last-Modified** | Соңғы өзгеріс уақыты (күй хэшімен бірге). |
| **`since` (query)** | ISO8601; DB-да `quran`/`hadith` **`updated_at`** болса, жауапта **`since_normalized_sqlite`**, **`incremental_diff_available`**, өзгерген id тізімдері: **`quran_changed`**, **`hadith_changed`**. |
| **Diff** | Толық мәтін емес — **өзгерген сүрелер/хадис id-лері** (желінің көлемін азайту). |

Код: `platform_api/content_routes.py`, `content_reader.py`.

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
| `mobile/` | **Expo SDK 52**, React Native |
| `scripts/` | Импорт, FTS, платформа API, хадис синкі, healthcheck, backup, түнгі maintenance |
| `platform_api/db_reader.py` | `get_content_stats()` (SQLite файл), **`readiness_ping()`** — гибрид DSN үшін readiness |

---

## 3. Telegram бот (`handlers/`)

| Модуль | Функция |
|--------|---------|
| `start.py` | /start, мәзір |
| `quran.py` | Сүре, мәтін, аудио, іздеу, тәжвид, хатм |
| `hadith.py` | Хадис, іздеу |
| `prayer.py`, `qibla.py`, `tasbih.py` | Намаз, құбыла, тәсбих |
| `halal.py` | Сурет → `analyze_halal_photo` (API немесе тікелей Gemini) |
| `voice.py` | Дауыс, `transcribe_voice_command`, `ask_genai` |
| `ai_chat.py` | RAQAT AI чат, `ask_genai`; жауаптан кейін **`append_telegram_ai_turn`** → `platform_ai_chat_messages` |
| `services/tts_reply.py` | `synthesize_speech` |
| `language.py`, `translation.py`, `onboarding.py` | Тіл, нұсқаулық |
| `feedback.py`, `admin.py` | Кері байланыс, әкімші |
| `services/genai_service.py` | Орталық API ↔ Gemini |

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

## 6. Мобильді (`mobile/`)

- **Негізгі стек:** Expo SDK **54**; намаз уақыты: **Aladhan**.  
- **Платформа API базасы:** **`EXPO_PUBLIC_RAQAT_API_BASE`** немесе `app.json` → `expo.extra.raqatApiBase` (`src/config/raqatApiBase.ts`). Бос болса — сыртқы fallback қалған күйде жұмыс істейді (мысалы Құран тізімі/сүре үшін).  
- **Контент құпиясы (опция):** **`EXPO_PUBLIC_RAQAT_CONTENT_SECRET`** немесе `extra.raqatContentSecret` — API **`RAQAT_CONTENT_READ_SECRET`** сәйкес (немесе JWT **`content`** scope). `src/config/raqatContentSecret.ts`.
- **AI чат (мобильді):** **`EXPO_PUBLIC_RAQAT_AI_SECRET`** немесе `extra.raqatAiSecret` — API **`RAQAT_AI_PROXY_SECRET`** сәйкес (`X-Raqat-Ai-Secret`). `src/config/raqatAiSecret.ts`. Өндірісте JWT (scope **`ai`**) қолдану ұсынылады.

### 6.0 Басты экран және «үш тірек» (UX)

- **`DashboardScreen`:** «Бүгінгі үш тірек» — **намаз уақыты** (карта → `PrayerTimes`), **күнделікті аят** (`DailyAyah`), **бір сұрақ AI** (`RaqatAI` → чат). Төменде құбыла, содан «Тағы мазмұн» (Құран тізімі, хадис, дұға, хатым, халал).
- **`DailyAyahScreen`:** күнге байланысты глобалды аят (6236 цикл); алдымен **`/api/v1/quran/{s}/{a}`**, резерв **alquran.cloud** `/v1/ayah/{global}`. Дерек: `src/data/quranAyahCounts.ts`.
- **`RaqatAIChatScreen`:** **`POST /api/v1/ai/chat`**, `fetchPlatformAiChat` — хабарламалар `AsyncStorage` (`raqat_ai_chat_messages_v1`).

### 6.1 HTTP клиент (`src/services/platformApiClient.ts`)

| Функция | Мақсаты |
|---------|---------|
| `fetchPlatformHealth` | `GET /health` |
| `fetchPlatformReadiness` | `GET /ready` — **503** денесін тастамайды; DB дайындығы + `backend` |
| `fetchContentStats` | `GET /api/v1/stats/content` |
| `fetchPlatformAiChat` | `POST /api/v1/ai/chat` — **`X-Raqat-Ai-Secret`** немесе Bearer JWT (**`ai`**) |
| `fetchQuranSurahs` | `GET /api/v1/quran/surahs` |
| `fetchPlatformQuranSurah` | `GET /api/v1/quran/{surah}` — толық сүре (`text_ar`, `text_kk`, `translit`) |
| `fetchPlatformQuranAyah` / `fetchPlatformHadith` | Бір аят / бір хадис |
| `fetchMetadataChanges` | **ETag** / **304** → `null`; query **`since`**; header **`authorizationBearer`** |

### 6.2 Құран экрандары (бір дерек көзі)

- **`QuranListScreen`**, **`QuranSurahScreen`:** егер **`raqatApiBase` орнатылған** болса, алдымен **platform_api** (`fetchQuranSurahs` / `fetchPlatformQuranSurah`); сәтсіздік немесе база бос болса — **`api.alquran.cloud`** резерві.  
- **Кэш:** `quranListCache.ts`, `quranSurahCache.ts` — `CachedAyah` ішінде араб **`text`**, бар болса **`textKk`** (қазақша екінші жол UI-да).  
- **Офлайн бандл сидинг:** `bundledQuranSeed.ts` — AsyncStorage-қа толық Құран; сидинг **алдымен** `InteractionManager` + `requestAnimationFrame` (`uiDefer.ts`) кейін іске қосылады; **кеш толық болса** сидинг фонда (`void`), желіні күтпей UI босатылады.  
- **Инкременттік жаңарту:** `contentSync.ts` — `applyIncrementalContentPatches` аятты **`cachedAyahFromRow`** арқылы сақтайды (араб негізгі, `text_kk` бөлек).

### 6.2.0 Күнделікті аят (офлайн)

- **`DailyAyahScreen`:** араб мәтіні кеште бар болса, ауыр бандл сидингі шақырылмайды (күнделікті экран қатып қалмасын).

### 6.2.1 Хадис (мобильді)

- **`HadithListScreen`**, **`HadithDetailScreen`:** офлайн корпус (`bundledHadithSeed.ts`, `hadith-from-db.json` → AsyncStorage); API орнатылғанда **`GET /api/v1/hadith/{id}`** мәтінді жаңарта алады (`fetchPlatformHadith`). Деталь экранда: **араб түпнұсқа**, **қазақша мағына** (`text_kk`), рауи, дәлел; **араб мәтінінің қазақ әрпімен автотранскрипциясы көрсетілмейді** (тек түпнұсқа + аударма).

### 6.3 Баптаулар

- **`SettingsScreen`:** платформа URL, **`/health` + `/ready` + stats** бір мезгілде тексеріледі; дерекқор дайын болса «SQLite / PostgreSQL (ready)»; DB қатесінде `/ready` хабарламасы.  
- **Офлайн/метадерек:** `contentSync.ts` — AsyncStorage **etag** + **`since_normalized_sqlite`**, `runContentMetadataSync` (`If-None-Match` + `since`).

### 6.4 Сілтемелер

- Бот: `TelegramInfoScreen.tsx` (`t.me/...`).  
- Толығырақ: `mobile/README.md`.

---

## 7. Веб (`web/`)

Статикалық бет; `web/README.md`.

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

## 9. Сыртқы сервистер

| Сервис | Қолдану |
|--------|---------|
| Telegram Bot API | Бот |
| Google Gemini | `platform_api` (орталық) және/немесе бот (fallback) |
| Aladhan | Намаз |
| koran.kz trnc | Транскрипция импорты (скрипт) |
| everyayah | `QURAN_AUDIO_BASE` — аудио URL |

---

## 10. Қауіпсіздік

- `.env` репоға **емес**.  
- AI: **`X-Raqat-Ai-Secret`** **немесе** JWT (**`RAQAT_JWT_SECRET`**, scope **`ai`**).  
- Оқу-only: опция **`X-Raqat-Content-Secret`** **немесе** JWT scope **`content`**.  
- **Telegram → JWT шығару:** **`RAQAT_BOT_LINK_SECRET`** тек серверде; `X-Raqat-Bot-Link-Secret` клиентке таратпау.  
- Bootstrap пароль: өндірісте **`RAQAT_AUTH_PASSWORD_BCRYPT`**; plaintext тек dev.  
- Діни мәтін + AI: фиқһтық үкім емес — disclaimer (`RAQAT_PLATFORM.md`).

Cutover / rollback / нұсқа жауаптар (A·sync·pool·FTS): `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §15.

---

## 11. Тесттер

- `tests/test_platform_api.py` — **health**, **`/ready`** (200 немесе 503), info, stats, AI (mock + JWT), metadata **ETag/304** және **since diff** (көшірілген DB + миграция), контент secret/JWT, **auth/login**, **auth/link/telegram**, **users/me/history**, AI чат тарихқа жазу.  
- `tests/test_migrations.py` — миграциялар тізбегі және кестелер (соның ішінде **006**).
- `tests/test_auth_link.py` — `POST /auth/link/telegram` (бот құпиясы, 401/503, идемпотенттілік); **uuid емес `sub`** бар қолдан жасалған access JWT → **400** `SUB_NOT_PLATFORM_UUID`. `tests/conftest.py`: **`RAQAT_REDIS_REQUIRED=0`** — Redis міндетті startup API импорты үшін өшіріледі.

---

## 12. GPT-ке тапсырма мысалы

> RAQAT: FastAPI `platform_api` (8787) — **`GET /health`**, **`GET /ready`**, **`GET /metrics`** (uptime, 5xx count). Орталық AI: `/api/v1/ai/*` (**X-Raqat-Ai-Secret** немесе JWT **`ai`**); опция **`async_mode`** + **`GET /api/v1/ai/task/{id}`** (Celery+Redis); опция semantic cache: **`RAQAT_AI_SEMANTIC_CACHE`**. Мобильді: **`EXPO_PUBLIC_RAQAT_API_BASE`**, контент **`EXPO_PUBLIC_RAQAT_CONTENT_SECRET`**, AI чат **`EXPO_PUBLIC_RAQAT_AI_SECRET`** (сервер `RAQAT_AI_PROXY_SECRET`); басты экран үш тірек + `DailyAyahScreen` + `RaqatAIChatScreen` (`fetchPlatformAiChat`). Оқу-only: Құран/хадис + `/metadata/changes` (**ETag**, **`since`**, миграция **005**). Auth: **`/auth/login`** → JWT **`sub` = platform uuid** (`platform_password_logins`); `/auth/link/telegram` (бот құпиясы немесе Bearer uuid); `/users/me`, `/users/me/history`. Кестелер: `platform_identities`, `platform_password_logins`, `platform_ai_chat_messages`; миграция **014** ескі снапшоттарды жөндейді. Ops: `OPERATIONS_STACK_CHECKLIST.md`, healthcheck, backup, nightly. Мен сенен: [конкретті өзгеріс].

---

## 13. Жылдам анықтама (жиі сұрақтар)

| Сұрақ | Жауап |
|--------|--------|
| Өнімнің бірінші шегі не? | **`docs/RAQAT_PLATFORM.md`** — «Солтүстік жұлдыз»: USER (proof/growth), күнделікті VALUE (намаз · аят · AI), SIMPLE UX (бір басу → нәтиже). Acquisition пен retention қысқаша: жоғарыдағы **«Өнім басымдықтары: acquisition → retention»** кестесі. |
| Пайдаланушы бот пен API арасында қалай бірікті? | `POST /auth/link/telegram` + `platform_identities`; JWT `sub` = uuid; ботта `platform_token_bundle`. |
| AI кілті клиентте бар ма? | Жоқ — мақсат **`platform_api`** + `GEMINI_API_KEY` серверде. |
| Мобильді Құран қайдан алынады? | Орнатылған **`raqatApiBase`** болса — **`/api/v1/quran/*`** (text_kk қоса); әйтпесе alquran.cloud. |
| Мобильді хадис экранында транскрипция бар ма? | **Жоқ** — `HadithDetailScreen` тек арабша + қазақша мағына; автотранскрипция алынып тасталған. |
| Мобильді AI чат қалай қосылады? | **`EXPO_PUBLIC_RAQAT_AI_SECRET`** + `fetchPlatformAiChat` → **`POST /api/v1/ai/chat`**; JWT жолы — `PLATFORM_ROADMAP_API_AI_USERS.md`. |
| Көшірме мен түнгі тексеру? | `backup_sqlite.sh`, `nightly_maintenance.sh`, журнал `.logs/`. |
| PostgreSQL қашан? | `DATABASE_URL` / `DATABASE_URL_WRITER` — `db/get_db.py`, нұсқау `MIGRATION_SQLITE_TO_POSTGRES.md`. |
| Redis + Celery + PG + DNS бірден? | `docs/OPERATIONS_STACK_CHECKLIST.md`, төмен **§22.1**. |
| Async AI (`task_id`)? | Денеде `async_mode: true`, **`GET /api/v1/ai/task/{id}`** — төмен §5.2, **§22.2**. |
| `POST /auth/login` ішінде `sub` не? | **Uuid (`platform_user_id`)** — логин аты тұрақты кілтке (`platform_password_logins.login_key`) байланысты; ескі «username = sub» емес. |
| `global_clean.db` кестелері толық па? | Миграция **014** ескі снапшоттарды жөндейді; күмән болса **`run_schema_migrations`** немесе API іске қосу (SQLite lifespan). **§23**. |
| Semantic AI cache? | **`RAQAT_AI_SEMANTIC_CACHE=1`** өндірісте ұсынылады (`ai_semantic_cache.py`, worker ішінде де); шығын: embedding. Толығы: **`PRODUCTION_POSTURE.md` §4**, **§21.2**. |
| Өндірісте SQLite бола ма? | **Жоқ** — тек PostgreSQL; SQLite әзірлеу/тест. **`PRODUCTION_POSTURE.md` §1**. |
| Redis өндірісте optional па? | **Жоқ** — міндетті; `RAQAT_REDIS_REQUIRED=0` **тек pytest**. **`PRODUCTION_POSTURE.md` §2**. |

---

*Файл жолы: `docs/PLATFORM_GPT_HANDOFF.md`. Құран тереңдігі: `docs/QURAN_GPT_HANDOFF.md`. Өнім жол картасы: `docs/RAQAT_PLATFORM.md` (XI–XII). Жинақтау: **§22** (ops) · **§23** (auth/DB) · **§24** (карта); өндіріс шегі: **`PRODUCTION_POSTURE.md`**.*

---

## 14. Ағымдағы статус-отчет (2026-04-14)

Төмендегі бөлім — осы күнгі нақты операциялық күй мен жасалған өзгерістердің толық есебі.

### 14.1 Орындалған жұмыстар (Done)

| Бағыт | Нәтиже |
|------|--------|
| **Платформаны басынан іске қосу** | API қайта көтерілді (`platform_api`, port `8787`), бот процесі қайта іске қосылды (`bot_main.py`). |
| **API тексерісі (телефон)** | Телефон браузерінде `http://<server-ip>:8787/docs` ашылды; OpenAPI тізімі толық жүктелді (auth, ai, content, usage, roadmap). |
| **Health/readiness** | `/health` жауап берді: `{"status":"ok","service":"RAQAT Platform API","version":"0.1.0"}`; `/ready` бұған дейін 200 қайтарған. |
| **Expo Go тест ортасы** | `mobile` ішінде Metro көтерілді (`npm run start:vps`), хост: `5.75.162.140`, Expo URL: `exp://5.75.162.140:8081`. |
| **UI өзгерісі (сұралған)** | Басты экрандағы Құбыла блогы кішірейтілді (`mobile/src/screens/DashboardScreen.tsx`): компас `68 -> 56`, мәтін және аралықтар азайтылды. |
| **Expo қайта жаңарту** | UI өзгерісінен кейін Metro қайта старт жасалды, телефоннан reload арқылы жаңа көрініс тексеруге дайын. |

### 14.2 Сервер/желілік нақты күй

| Тексеру | Нәтиже |
|--------|--------|
| `ss -ltnp` port `8787` | Тыңдап тұр (`0.0.0.0:8787`, uvicorn процесі бар). |
| Firewall (`ufw`) | `Status: inactive` (локаль блок көрінбейді). |
| `iptables` INPUT саясаты | `ACCEPT` (порт firewall-де тікелей жабылып тұрған белгі жоқ). |
| Сервер IPv4 | `5.75.162.140` |
| API docs (телефон) | Ашылды, endpoint тізімі көрінді. |

### 14.3 Табылған мәселе / тәуекел

| Мәселе | Әсері | Ұсыныс |
|-------|------|--------|
| **Telegram DNS тұрақсыздығы** (`api.telegram.org` resolve уақытша қате) | Бот кейде polling кезінде үзіліп қалуы мүмкін (`Temporary failure in name resolution`). | DNS серверлерін тұрақтандыру (`/etc/resolv.conf`, `systemd-resolved`, провайдер DNS); мониторингпен қайта тексеру. |
| Expo offline warning (well-known versions endpoint) | Dev режимде dependency валидациясы ескерту бере алады, бірақ Metro жұмысын тоқтатпайды. | Интернет/DNS тұрақтанған соң Expo толық online режимде қайта тексеру. |

### 14.4 Мобильді/Expo үшін практикалық нұсқаулық (операторға)

1. Телефондағы Expo Go ашу.
2. URL арқылы кіру: `exp://5.75.162.140:8081`.
3. Қосымша ашылғаннан кейін Home-да Құбыла блогының ықшам нұсқасын тексеру.
4. Егер ескі UI тұрса: Expo Go ішінде `Reload`.
5. Егер қосылмаса: `timeout`/`connection refused` типін белгілеу (желілік диагностика үшін).

### 14.5 Auth smoke-test (Swagger)

`POST /api/v1/auth/login` үшін минимал дене:

```json
{
  "username": "admin",
  "password": "YOUR_PASSWORD"
}
```

Ескерту:
- `username` — `RAQAT_AUTH_USERNAME` (әдепкіде `admin` болуы мүмкін).
- `password` — `RAQAT_AUTH_PASSWORD` (немесе `RAQAT_AUTH_PASSWORD_BCRYPT`-ке сәйкес нақты пароль).
- Токен алған соң `Authorize` арқылы `GET /api/v1/users/me` тексеріледі.

### 14.6 Өзгертілген файлдар (осы сессия)

- `mobile/src/screens/DashboardScreen.tsx` — Құбыла блогын визуалды кішірейту.
- `docs/PLATFORM_GPT_HANDOFF.md` — осы толық статус-отчет бөлімі қосылды.

### 14.7 Келесі қадамдар (ұсыныс)

1. DNS мәселесін түбегейлі түзету (бот тұрақтылығы үшін міндетті).
2. Expo Go арқылы нақты user flow smoke test: Home → Prayer Times → Qibla → AI Chat.
3. Swagger арқылы auth + protected endpoint (`/users/me`) бекіту.
4. Қажет болса осы өзгерістерді бір commit-пен бекіту.

### 14.8 Схема жөндеу (2026-04-18) — миграция 014 + auth тесті

| Тақырып | Мазмұны |
|---------|--------|
| **Мәселе** | Кейбір SQLite снапшоттарда `schema_migrations` ішінде **12** нұсқа қолданылған деп тұрғанымен **`platform_password_logins`** / **`platform_hatim_read`** кестелері жоқ болды — `POST /auth/login` **`IDENTITY_ISSUE_FAILED`** немесе «no such table» беруі мүмкін еді. |
| **Шешім** | Миграция **014** (`repair_user_data_tables_if_missing`): кестелердің біреуі жоқ болса `ensure_user_data_tables()` қайта шақырылады. Репо **`global_clean.db`** жаңартылды. |
| **Документтелген мінез** | Bootstrap **`/auth/login`** JWT **`sub` = uuid** (`platform_user_id`); `/auth/link/telegram` клиент тармағында uuid табылмаса — **400** `SUB_NOT_PLATFORM_UUID`. |
| **Тест** | `tests/test_auth_link.py` — legacy access JWT (uuid емес `sub`) арқылы осы 400 кодын тексереді. |

Толығырақ: **§23**.

---

## 15. Орындау пакеті (A / Ә / Б / В)

Бұл бөлім — бірден орындауға дайын командалар мен конфигурациялар.

### A) DNS мәселесін шешу (бот тұрақтылығы)

Қауіпсіз dry-run:

```bash
bash scripts/fix_dns_resolved.sh
```

Нақты apply:

```bash
sudo bash scripts/fix_dns_resolved.sh --apply
```

Скрипт не істейді:
- `systemd-resolved` үшін override жазады: `DNS=1.1.1.1 8.8.8.8`, `FallbackDNS=9.9.9.9 1.0.0.1`;
- `systemctl restart systemd-resolved`;
- `api.telegram.org` DNS resolve + HTTPS reachability smoke-test.

### Ә) Auth/JWT интеграциясы (Identity Linking end-to-end)

Flow тексеру:

```bash
bash scripts/verify_identity_linking.sh
```

Басқа тест Telegram id-мен:

```bash
TG_TEST_USER_ID=777000001 bash scripts/verify_identity_linking.sh
```

Тексерілетін толық тізбек:
1. `POST /api/v1/auth/link/telegram`
2. `POST /api/v1/ai/chat` (dev verify ішінде mock)
3. `GET /api/v1/users/me/history`
4. DB кестелерінде сәйкестік (`platform_identities`, `platform_ai_chat_messages`)

### Б) PostgreSQL Cutover (audit + migrate)

Аудит нәтижесі (`scripts/audit_sql_placeholders.py`):
- **12 файлда** SQL `?`/f-string review нүктелері табылды.
- Негізгі аймақтар: `db/*`, `platform_api/content_reader.py`, `services/*`, `handlers/*`.
- Бұл күтілетін нәтиже (SQLite-үйлесімді код). Cutover кезінде `db/dialect_sql.py` және migrate қабаты арқылы кезең-кезеңімен көшу керек.

Толық cutover wrapper (`docs/OPERATIONS_RUNBOOK_5_TRACKS.md`):

```bash
export PG_DSN='postgresql://user:pass@host:5432/dbname'
bash scripts/run_pg_cutover.sh --validate-only   # тек аудит + жол саны (көшірмесіз)
bash scripts/run_pg_cutover.sh                    # немесе --apply: backup + migrate
```

Скрипт реттілігі (`--apply`):
1. placeholder audit
2. SQLite backup
3. `migrate_sqlite_to_postgres.py --bootstrap-ddl --with-quran-hadith --validate`
4. `--validate-only` қайталап тексеру

Лог файлы: `.logs/pg_cutover_YYYYmmdd_HHMMSS.log`

### В) UI/UX жақсарту (Expo)

Осы пакеттің ішінде Home экраны жақсартылды:
- «Басты модульдер» (`focusTitle`) тақырыбы қосылды;
- «Бүгінгі аят» CTA картасы Home-ға қосылды (Prayer + Daily Ayah + AI үштігі айқынырақ болды);
- Құбыла hero блогы алдыңғы сұраныс бойынша ықшам күйде қалдырылды.

Файл:
- `mobile/src/screens/DashboardScreen.tsx`

Expo жаңарту:

```bash
cd mobile
npm run start:vps
```

Телефон: `exp://<server-ip>:8081` → Reload.

### Экожүйе релизі (жаңа артефакттар)

- `scripts/release_content_pipeline.sh` — import → API validate → mobile sync smoke.
- `scripts/validate_content_release.py` — health/ready/content + metadata ETag/304 + incremental fetch smoke.
- `docs/API_ONLY_ECOSYSTEM_CUTOVER.md` — bot/app/web үшін API-only cutover runbook.

### Bot API-first hardening (handlers/hadith.py, handlers/quran.py)

`RAQAT_BOT_API_ONLY=1` режимі үшін боттың контент read-path-тары күшейтілді:

- `handlers/hadith.py`:
  - random hadith және hadith search логикасы API-first (`platform_api`) жолына көшірілді;
  - API сәтсіздігінде DB fallback қолданылмайды;
  - пайдаланушыға "табылмады" орнына API қолжетімсіздігі туралы анық хабар беріледі.

- `handlers/quran.py`:
  - Quran search және surah read-path API-first режимде API-дан оқиды;
  - API сәтсіз болған жағдайда user-friendly alert/мәтін қайтарылады;
  - API-only кезінде DB fallback read-path енді пайдаланылмайды.

Қолдау үшін API-да жаңа endpoint-тер қосылды:

- `GET /api/v1/hadith/random`
- `GET /api/v1/hadith/search`
- `GET /api/v1/quran/search`

Ескерту:
- dynamic route қақтығысын болдырмау үшін `content_routes.py` ішінде route order түзетілді
  (`/hadith/random`, `/hadith/search`, `/quran/search` жолдары parameterized route-тардан бұрын жарияланды).

### Bot API-only smoke automation (жаңартылды)

Bot handler-лердің API-only read-path-тарын тұрақты тексеру үшін жаңа smoke script қосылды:

- `scripts/smoke_bot_api_only_content.py`
  - `/ready`
  - `/api/v1/hadith/random`
  - `/api/v1/hadith/search`
  - `/api/v1/quran/search`
  - `/api/v1/quran/{surah}`

Қолмен іске қосу:

```bash
set -a; source .env; set +a
.venv/bin/python scripts/smoke_bot_api_only_content.py \
  --api-base "${RAQAT_PLATFORM_API_BASE:-http://127.0.0.1:8787}" \
  --content-secret "${RAQAT_CONTENT_READ_SECRET:-}"
```

Қосымша hardening:

- `services/platform_content_service.py` ішінде API қателері екіге бөлінді:
  - `not_found` (контент шын мәнінде жоқ),
  - `unavailable` (API/желілік мәселе).
- Осы статустар `handlers/hadith.py` және `handlers/quran.py` ішінде бөлек өңделеді:
  - `not_found` → табиғи “табылмады” жауабы,
  - `unavailable` → user-friendly “API уақытша қолжетімсіз” хабарламасы.

### Nightly maintenance интеграциясы (жаңартылды)

`scripts/nightly_maintenance.sh` енді келесі реттілікпен жүреді:

1. `backup_sqlite.sh`
2. `healthcheck_raqat.sh`
3. `validate_content_release.py`
4. `smoke_bot_api_only_content.py`

Лог:
- `.logs/nightly_maintenance.log`

Соңғы run нәтижесі:
- бот API-only smoke endpoint-тері `200 OK` арқылы өтті.

---

## 16. Архитектура update (2026-04-16) — жаңа `platform_api/app` қабаты

Бұл бөлім соңғы енгізілген өзгерістерді (қазіргі сәттегі актуал күйді) бекітеді.

### 16.1 Не қосылды

`platform_api` ішінде жаңа модульдік қабат құрылды:

- `platform_api/app/main.py` — жаңа FastAPI entrypoint
- `platform_api/app/core/config.py` — env-конфигурация (`RAQAT_API_PREFIX`, `CORS_ORIGINS`, `RAQAT_DB_PATH`)
- `platform_api/app/core/response.py` — unified success/error envelope
- `platform_api/app/infrastructure/db.py` — readiness ping
- `platform_api/app/api/v1/router.py` — домендік роутер композициясы
- `platform_api/app/api/v1/endpoints/*` — auth/users/quran/hadith/ai/worship/halal

Қосымша құжат:

- `docs/RAQAT_V1_TECHNICAL_ARCHITECTURE.md` — layered архитектура, AI contract, security/reliability ережелері, next steps.

### 16.2 Үйлесімділік саясаты (compatibility)

Қазіргі production-модель бұзылған жоқ:

- `platform_api/main.py` (ескі MVP entrypoint) сақталды;
- жаңа архитектура параллель енгізілді (`platform_api/app/*`);
- көшу стратегиясы: endpoint-терді кезең-кезеңімен `app/` қабатына тасымалдау.

### 16.3 Жаңа v1 endpoint-тер (қазір жұмыс істейді)

Base: `http://<host>:8788/api/v1` (жаңа entrypoint қолданғанда)

| Метод | Жол | Күйі |
|--------|-----|------|
| POST | `/auth/login` | Жұмыс істейді (bootstrap credentials + JWT pair) |
| POST | `/auth/refresh` | Жұмыс істейді (refresh decode + jti revocation check + rotate) |
| GET | `/users/me` | Жұмыс істейді (Bearer access token claims) |
| GET | `/quran/surahs` | Жұмыс істейді |
| GET | `/quran/search` | Жұмыс істейді |
| GET | `/quran/surahs/{surah}/ayahs` | Жұмыс істейді |
| GET | `/quran/surahs/{surah}/ayahs/{ayah}` | Жұмыс істейді |
| GET | `/hadith/collections` | Placeholder list (v1 scaffold) |
| GET | `/hadith/search` | Жұмыс істейді |
| GET | `/hadith/{hadith_id}` | Жұмыс істейді |

Сервис health/readiness:

- `GET /health`
- `GET /ready`

### 16.4 Auth/identity техникалық деталь

Жаңа `app` auth endpoint-тері бар ортақ механизмдермен жұмыс істейді:

- `auth_credentials.py` — bootstrap credential verify
- `jwt_auth.py` — access/refresh issue/decode
- `db/governance_store.py` — refresh JTI revoke/prune
- `db_reader.resolve_db_path()` — DB орналасуын біріздендіру

Яғни жаңа қабат existing security/data механизмін қайта қолданады (duplicate logic жасалмаған).

### 16.5 Іске қосу командалары (жаңа қабат)

Репо түбінен:

```bash
cd platform_api
uvicorn app.main:app --host 0.0.0.0 --port 8788
```

Тексеру:

- `GET http://127.0.0.1:8788/health`
- `GET http://127.0.0.1:8788/ready`
- `GET http://127.0.0.1:8788/docs`

Ескерту:

- `8787` — legacy `main.py`;
- `8788` — жаңа modular `app.main`.

### 16.6 Қай файлдар нақты қосылды (2026-04-16)

- `docs/RAQAT_V1_TECHNICAL_ARCHITECTURE.md`
- `platform_api/app/__init__.py`
- `platform_api/app/main.py`
- `platform_api/app/core/config.py`
- `platform_api/app/core/response.py`
- `platform_api/app/infrastructure/db.py`
- `platform_api/app/api/v1/router.py`
- `platform_api/app/api/v1/endpoints/auth.py`
- `platform_api/app/api/v1/endpoints/users.py`
- `platform_api/app/api/v1/endpoints/quran.py`
- `platform_api/app/api/v1/endpoints/hadith.py`
- `platform_api/app/api/v1/endpoints/ai.py`
- `platform_api/app/api/v1/endpoints/worship.py`
- `platform_api/app/api/v1/endpoints/halal.py`

### 16.7 Келесі міндетті қадамдар (implementation backlog)

1. `app` қабатына толық JWT deps/policies қосу (scope-level guards).
2. `/ai/chat` — retrieval-grounded pipeline (`ai_proxy.py`) кеңейту, semantic cache (кейін).
3. SQLAlchemy + Alembic (PostgreSQL-first schema) — `docs/ALEMBIC_BOOTSTRAP.md`.
4. `platform_users / sessions / refresh_tokens` толық домен модельдері; **audit:** SQLite миграциясы **010** `audit_events` + `append_audit_event` (`db/governance_store.py`) іске қосылды.
5. **Redis:** AI rate limit multi-worker (`platform_api/ai_rate_limit.py`, `RAQAT_AI_RL_USE_REDIS`), `/ready` ішінде `redis` күйі (`db_reader.readiness_ping`, `app/infrastructure/db.py`); **exact AI cache** (`platform_api/ai_exact_cache.py`, `ai_routes` → `cached` өрісі).
6. **Celery:** `celery_tasks.py` (AI chat / сурет / TTS / transcribe), `ai_routes` **`async_mode`** + **`GET /ai/task/{id}`** — төмен **§21.5**, **§22.2**. Скелет `raqat.ping` + нақты тапсырмалар.
7. `platform_api/main.py` → `app.main` cutover runbook (zero-downtime) — әлі backlog.

Толығырақ жаңа өзгерістер: төмен **§21**, жинақ **§22**.

---

## 17. Scale Hardening Mandates (2026-04-16)

Төмендегі 4 принцип RAQAT үшін **міндетті архитектуралық талап** ретінде бекітілсін.

### 17.1 Stateless API (ең маңызды)

API instance жадысында (in-memory/local state) бизнес-күй сақталмайды.

Міндетті:

- session/auth күйі — token + DB/Redis
- rate-limit counters — Redis
- қысқа AI жад/кэш — Redis
- фондық task күйі — queue backend

Нәтиже: горизонталь масштаб (`N` instance) кезінде consistency сақталады.

### 17.2 Redis (mandatory infrastructure)

Redis енді v1 target stack-тың міндетті бөлігі:

- AI rate limiting (**ZSET**, multi-worker — `ai_rate_limit.py`, §21.2)
- session/cache layer
- prayer/halal/AI short cache
- **AI exact chat cache** (`ai_exact_cache.py`, §21.2)
- queue coordination (broker/backend; Celery скелеті §21.5)

Критерий:

- Redis жоқ болса, сервис degraded деп белгіленуі тиіс;
- critical path DB-only режимінде қалмауы керек.

Толық env және файл жолдары: **§21.2–21.5**.

### 17.3 Queue System (async-first for heavy work)

Heavy процестер synchronous request жолынан шығарылады:

- AI heavy inference
- image analysis
- TTS generation
- notifications
- analytics aggregation

Ұсынылған стек:

- Celery + Redis (қазіргі baseline)
- болашақта қажет болса RabbitMQ/Kafka

### 17.4 Failover / Fallback policy

Бір сервистің ақауы бүкіл экожүйені құлатпауға тиіс:

- AI down -> Qur'an/Hadith read API жалғасады
- queue down -> sync fallback немесе graceful "accepted/degraded" жауап
- Redis down -> қысқа мерзім degraded mode (alert), critical flows continue
- API down -> bot limited fallback mode (read-only/basic)

SLO-ға әсер ететін барлық деградация audit/monitoring арқылы тіркелуі тиіс.

### 17.5 Қазіргі код базасына енгізілген минимал база

`platform_api/app` ішінде бастапқы hardening scaffold қосылған:

- `app/infrastructure/redis_client.py`
- `app/infrastructure/cache.py`
- `app/infrastructure/queue.py`
- `app/api/v1/endpoints/ai.py` (`async_mode`, queue attempt, graceful fallback, short cache)
- `app/core/config.py` (`RAQAT_REDIS_URL`, `RAQAT_QUEUE_BACKEND`, `RAQAT_FAILOVER_MODE`)

Ескерту: бұл — foundation layer; нақты **`ai_routes`** (`async_mode`, Celery) және **`/metrics`** production жолында; `app/api/v1/endpoints/ai.py` — scaffold/queue үлгісі. Толық hardening: policy guards, circuit breaker, retries, Sentry — келесі фаза. Толығырақ: **§22**.

---

## 18. Hadith KK Translation — Resume Runbook (2026-04-16)

Сахих хадистерді (Bukhari + Muslim) аударуды тоқтаған жерінен қауіпсіз жалғастыру үшін осы бөлім бекітілді.

### 18.1 Ағымдағы статус (операциялық)

- DB: `global_clean.db`
- Hadith total: `33,738`
- `text_kk` filled: `6,581` (~`19.5%`)
- Missing: `27,157`

Ескерту: алдыңғы тоқтау себептері:

- `403 PERMISSION_DENIED` (project/model access)
- `404 NOT_FOUND` (ескі модель `gemini-1.5-flash`)
- кейде `503 UNAVAILABLE` (model high demand, retry қажет)

### 18.2 Safe resume скрипті

Жаңа скрипт:

- `scripts/run_hadith_kk_safe_resume.sh`

Не істейді:

- `.env` жүктейді
- `AI_MODEL_CANDIDATES` дефолтын modern модельдерге қояды:
  - `gemini-2.5-flash,gemini-2.5-flash-lite`
- `translate_hadith_kk_batch.py`-ды conservative retry/sleep параметрлерімен іске қосады
- `FROM_ID` арқылы resume қолдайды
- backup жасайды

### 18.3 Іске қосу командалары

Қысқа smoke:

```bash
LIMIT=20 SLEEP_SEC=4 MAX_ERRORS=5 bash scripts/run_hadith_kk_safe_resume.sh
```

Ұзақ run (resume):

```bash
FROM_ID=107803 LIMIT=0 SLEEP_SEC=4 MAX_ERRORS=20 bash scripts/run_hadith_kk_safe_resume.sh
```

Background режим:

```bash
nohup bash scripts/run_hadith_kk_safe_resume.sh > hadith_kk.log 2>&1 &
```

### 18.4 Прогресс тексеру

```bash
python3 -c "from platform_api.db_reader import get_content_stats; import json; print(json.dumps(get_content_stats(), ensure_ascii=False, indent=2))"
```

### 18.5 Міндетті ескертулер (SRE)

- `503 UNAVAILABLE` — уақытша, retry арқылы жалғасады.
- `403 PERMISSION_DENIED` тұрақты болса, бұл код қатесі емес; Gemini project access/quotas түзету керек.
- Әр run алдында backup жасалғанына көз жеткізу керек.
- FTS қолданылса, толықтырудан кейін: `python create_hadith_fts.py`.

---

## 19. Integration Completed — Bot + Mobile = One Platform (2026-04-16)

Бұл бөлімде экожүйені бір орталыққа біріктіру статусы бекітіледі.

### 19.1 Негізгі принцип

RAQAT-та бот пен мобильді клиенттің барлық негізгі дерегі мен AI логикасы бір көзден келуі керек:

- **Single source of truth:** `platform_api`
- Клиенттер: Telegram bot + Mobile app + Web
- Бір identity кеңістігі: `platform_user_id` / JWT

### 19.2 Іске асқан өзгерістер

Код деңгейінде бір орталық режим қосылды:

- `config/settings.py`
  - `RAQAT_BOT_API_ONLY` дефолты -> `1`
  - жаңа `RAQAT_SINGLE_SOURCE_MODE` дефолты -> `1`
- `services/genai_service.py`
  - AI/TTS/voice/image үшін боттағы тікелей Gemini fallback single-source режимде өшірілді
  - жол: Bot -> Platform API -> Gemini/provider
- `.env.example`
  - `RAQAT_SINGLE_SOURCE_MODE=1` құжаты қосылды

### 19.3 Smoke валидация (өткен)

API-only bot content smoke нәтижесі:

- `GET /ready` -> 200
- `GET /api/v1/hadith/random` -> 200
- `GET /api/v1/hadith/search` -> 200
- `GET /api/v1/quran/search` -> 200
- `GET /api/v1/quran/{surah}` -> 200

### 19.4 Known operational risk

- Telegram Bot API жағына DNS тұрақсыздығы байқалған:
  - `api.telegram.org` resolution intermittent failure
- Бұл архитектура қатесі емес, infra/network reliability мәселесі.

---

## 20. Production Checklist — Unified Platform Mode

Бұл чеклист біріккен режимді production-ға қауіпсіз шығару үшін.

### 20.1 Required env (must-have)

- `RAQAT_PLATFORM_API_BASE`
- `RAQAT_AI_PROXY_SECRET`
- `RAQAT_BOT_API_ONLY=1`
- `RAQAT_SINGLE_SOURCE_MODE=1`
- `RAQAT_JWT_SECRET` (>=32)
- `DATABASE_URL` (production DSN)

### 20.2 Service baseline

- Platform API (`8787`) up
- PostgreSQL healthy
- Redis healthy (cache/rate-limit/queue)
- Worker queue healthy (Celery/RQ)
- Bot process healthy and polling

### 20.3 Health gates (release blocker)

Release тек мына шарттар орындалса ғана:

1. `/health` -> 200
2. `/ready` -> 200
3. API-only smoke endpoints -> 200
4. `auth/login` және `users/me` smoke -> OK
5. Bot -> AI -> response flow -> OK

### 20.4 Reliability controls

- Structured logs + request_id
- Error tracking (Sentry немесе ұқсас)
- Alerting:
  - `/ready` fail
  - queue backlog high
  - AI 5xx rate high
  - Telegram DNS/connect failures

### 20.5 Security controls

- Secrets rotation policy
- `RAQAT_AI_PROXY_SECRET` тек серверде
- RBAC + audit logs enabled
- Admin әрекеттері толық журналданады

### 20.6 Backup / recovery

- Nightly backup (`scripts/backup_sqlite.sh` немесе PG backup policy)
- Restore drill аптасына кемінде 1 рет
- `scripts/nightly_maintenance.sh` cron арқылы қосулы

### 20.7 Go-live command set (reference)

```bash
set -a; source .env; set +a
export RAQAT_BOT_API_ONLY=1
export RAQAT_SINGLE_SOURCE_MODE=1
bash scripts/dev_restart_platform.sh
.venv/bin/python scripts/smoke_bot_api_only_content.py --api-base "${RAQAT_PLATFORM_API_BASE:-http://127.0.0.1:8787}" --content-secret "${RAQAT_CONTENT_READ_SECRET:-}"
```

Ескерту: production-та `dev_restart_platform.sh` орнына systemd/docker orchestration ұсынылады.

---

## 21. Экожүйе, Redis, AI cache, audit, Celery, Telegram күту (2026-04-16 жаңарту)

Бұл бөлім GPT/инженер үшін **соңғы код күйін** бекітеді: репо құрылымы, орталық API оптимизациясы, боттың сынбауы мен ұзақ күтпеуі.

### 21.1 Репозиторий картасы (modular monolithқа дайындық)

| Элемент | Сипат |
|---------|--------|
| `ECOSYSTEM.md` | Түбірде: қалталар кестесі, Docker, build order сілтемесі |
| `apps/` | Blueprint карта: `apps/api/README.md` → нақты `platform_api/`, `apps/bot`, `apps/mobile` → `mobile/`, т.б. |
| `packages/` | Келешек Python домен пакеттері (қазір `.gitkeep` + `README.md`) |
| `infra/docker/docker-compose.yml` | PostgreSQL 16 + Redis 7; **Celery** `celery-worker` сервисі профиль **`workers`** |
| `docs/PRODUCTION_BLUEPRINT_2M_USERS.md` | 2M+ user архитектуралық карта |
| `docs/ALEMBIC_BOOTSTRAP.md` | Alembic бастау, PG үшін `audit_events` DDL |

### 21.2 Redis (platform_api)

| Айнымалы / файл | Мазмұны |
|------------------|---------|
| `RAQAT_REDIS_URL` | Әдепкі `redis://127.0.0.1:6379/0`; `app/core/config.py` → `settings.redis_url` |
| `platform_api/app/infrastructure/redis_client.py` | `get_redis_client()`, ping сәтті болса клиент кэште |
| `platform_api/ai_rate_limit.py` | Redis **ZSET** sliding window (`raqat:ai_rl:v1:…`); `RAQAT_AI_RL_USE_REDIS=0` → in-memory fallback |
| `platform_api/db_reader.py` → `/ready` | Жауапқа **`redis`** блогы (`ok` / `unavailable`); `RAQAT_READINESS_REQUIRE_REDIS=1` болса Redis жоқта **`ok: false`** |
| `platform_api/ai_exact_cache.py` | L1 **exact** prompt→жауап кэші; `RAQAT_AI_EXACT_CACHE`, `RAQAT_AI_CACHE_TTL_SECONDS`, `RAQAT_AI_CACHE_MAX_CHARS` |
| `platform_api/ai_routes.py` | `/ai/chat` алдымен кеш, содан `generate_ai_reply`; жауапта **`cached`: bool** |

### 21.3 AI proxy жылдамдығы (Gemini)

| Файл | Өзгеріс |
|------|---------|
| `platform_api/ai_proxy.py` | `thinking_budget=0`, `RAQAT_AI_MAX_OUTPUT_TOKENS`, Google Search өшік кезде де `GenerateContentConfig`; қысқартылған structure rules |
| `services/genai_service.py` | Тікелей Gemini шақыруда да сол thinking + max_output; `RAQAT_AI_MAX_OUTPUT_TOKENS` |

### 21.4 Audit (SQLite миграция 010)

| Элемент | Сипат |
|---------|--------|
| `db/migrations.py` | `_migration_010_audit_events` — кесте `audit_events` + индекстер |
| `db/governance_store.py` | `append_audit_event(...)` — AI чат соңында шақырылады |
| PostgreSQL | Кестені қолмен/Alembic қосу: `docs/ALEMBIC_BOOTSTRAP.md` ішіндегі DDL мысалы |

### 21.5 Celery

| Элемент | Сипат |
|---------|--------|
| `platform_api/celery_app.py` | `Celery("raqat")`, broker=`RAQAT_CELERY_BROKER_URL` \| `RAQAT_REDIS_URL`, result backend, task **`raqat.ping`** (smoke), `task_track_started`, уақыт шектеулері |
| `platform_api/celery_tasks.py` | **`raqat.ai.chat`**, **`raqat.ai.analyze_image`**, **`raqat.ai.tts`**, **`raqat.ai.transcribe`** — Gemini/кэш/audit worker ішінде |
| `platform_api/app/infrastructure/queue.py` | Бір ортақ `celery_app.send_task` (бұрынғы жаңа `Celery()` дубликаты жойылған) |
| `ai_routes.py` | Денеде **`async_mode`: true** → `task_id`; **`GET /api/v1/ai/task/{task_id}`** — нәтиже |
| `infra/docker/docker-compose.yml` | `celery-worker` профиль **`workers`**, `RAQAT_QUEUE_BACKEND=celery` |
| `.env.example` | `RAQAT_QUEUE_BACKEND`, `RAQAT_CELERY_BROKER_URL`, `RAQAT_CELERY_RESULT_BACKEND` |
| `docs/OPERATIONS_STACK_CHECKLIST.md` | Worker іске қосу, GEMINI/DB ортасының worker-де де болуы |

### 21.6 Telegram бот — сынбау және ұзақ күтпеу

| Файл | Мазмұны |
|------|---------|
| `services/telegram_ai.py` | `ask_genai_telegram` — `asyncio.wait_for` + timeout/exception жұмсақ жауап |
| `config/settings.py` | `RAQAT_PLATFORM_AI_HTTP_TIMEOUT` (httpx оқу, әдепкі ~52 с), `RAQAT_BOT_AI_WAIT_TOTAL` (бот, әдепкі ~68 с) |
| `services/genai_service.py` | Platform `/ai/chat` шақыруы осы HTTP timeout-пен шектеледі |
| `handlers/ai_chat.py`, `handlers/halal.py`, `handlers/voice.py` | Барлығы `ask_genai_telegram` пайдаланады; күту хабарламасы: **«Жауап дайындалуда…»** |
| `handlers/ai_chat.py` | `append_telegram_ai_turn` және жауап жіберу бөлек try/except |

### 21.7 Expo / мобильді (қысқа)

| Тақырып | Файл |
|---------|------|
| Вебте браузер «артқа» | `mobile/App.tsx` → `linking={raqatLinking}`, `mobile/src/navigation/linking.ts` |
| Құран сүре атауы KK | `mobile/src/constants/surahTitleKk.ts`, `surahBundledMeta.ts` |
| `QuranSurah` deep link | `route.params.englishName` / `arabicName` опциялы; `useLayoutEffect` title |
| Офлайн Құран + UI жауаптығы | `bundledQuranSeed.ts` (`runWhenHeavyWorkAllowed` → `utils/uiDefer.ts`), тізім/сүре: кеш барда фондық сидинг |
| Күнделікті аят | `DailyAyahScreen` — араб кеште болса сидингсіз |

### 21.8 Тазалау (репо)

- Логтар (`*.log`, `.logs/`, `logs/`), `__pycache__` жойылды; `.gitignore` → `logs/`.
- **`reset_working_bot.sh`**, **`setup_raqat.sh`** жойылды (ескі scaffold, нақты файлдарды үстінен жазатын болған).

### 21.9 Келесі инженерлік басымдық (қысқа)

1. Semantic AI cache — **опциялық қосылған**: `RAQAT_AI_SEMANTIC_CACHE`, embedding/Gemini ортасы; `ai_semantic_cache.py`, `OPERATIONS_STACK_CHECKLIST.md`.  
2. PostgreSQL толық cutover + Alembic ревизиялары (`run_pg_cutover.sh`, `OPERATIONS_STACK_CHECKLIST.md`).  
3. `platform_api/main.py` → `app.main` өндіріс cutover runbook.  
4. Бот/мобильді клиенттерде **`async_mode`** + poll (`/ai/task/...`) — қажет болса өндіріс UX-ге қосу (API дайын).

---

## 22. Жинақтау нұсқауы (2026-04-18) — GPT / SRE үшін бір сурет

Бұл бөлім жоғарыдағы **§1–§21** мен тыс құжаттарды **бір экранға** жинайды; SQLite auth/схема нақтылығы үшін **§23**; барлық тақырып бойынша **толық сілтеме картасы** — **§24**. Жаңа сессияда **§22 + §23 + §24** (және қажет болса **`PRODUCTION_POSTURE.md`**) жеткілікті.

### 22.1 Бір бетте не бар

| Мақсат | Қайда |
|--------|--------|
| **Өндіріс позициясы (SQLite жоқ, Redis міндетті, Grafana жол картасы)** | `docs/PRODUCTION_POSTURE.md` |
| **Ops стек (Redis, PG, Celery, DNS, тексеру)** | `docs/OPERATIONS_STACK_CHECKLIST.md`, `scripts/ops_stack_checklist.sh` |
| **PG cutover** | `scripts/run_pg_cutover.sh` — аяқтағаннан кейін `.env` → `DATABASE_URL` / `DATABASE_URL_WRITER` = `PG_DSN` |
| **DNS** | `scripts/fix_dns_resolved.sh --apply` |
| **Сервистер** | `infra/docker/docker-compose.yml` — Postgres 16, Redis 7, `celery-worker` (`--profile workers`) |
| **Мониторинг (минимум)** | `GET /metrics` (`uptime_seconds`, `http_5xx_total`, latency), `GET /health`, `GET /ready`, `scripts/healthcheck_raqat.sh`; Prometheus scrape мысалы — `OPERATIONS_STACK_CHECKLIST.md` §5 |

### 22.2 API жағы (орталық AI + async)

| Тақырып | Мазмұны |
|---------|---------|
| Синхрон AI | `POST /api/v1/ai/chat` және т.б. — бұрынғыдай |
| Async | Денеде **`async_mode`: true** → `task_id`; **`GET /api/v1/ai/task/{task_id}`** |
| Код | `ai_routes.py`, `celery_tasks.py`, `celery_app.py`, `queue.py` |
| Орта | `RAQAT_REDIS_URL`, `RAQAT_QUEUE_BACKEND=celery`, worker ішінде де `GEMINI_API_KEY` + DB |

### 22.3 Мобильді жағы (офлайн + UI жауаптығы)

| Тақырып | Мазмұны |
|---------|---------|
| Құран бандлы | `seedBundledQuranCachesIfNeeded` — mutex + `runWhenHeavyWorkAllowed` (`utils/uiDefer.ts`) |
| Тізім/сүре | Кеш толық болса сидинг **фонда**; бос кеште офлайн үшін күту сақталады |
| Күнделікті аят | Кеште араб бар болса ауыр сидинг **шақырылмайды** |

### 22.4 Модельге жіберу тәртібі

1. **Минимум:** осы `PLATFORM_GPT_HANDOFF.md` (**§22** жинақтау, **§23** DB/auth, **§24** карта).  
2. **+ өндіріс шегі / аудит:** `PRODUCTION_POSTURE.md` (PG міндетті, Redis міндетті, monitoring, semantic cache, Celery).  
3. **+ өндіріс орнату:** `OPERATIONS_STACK_CHECKLIST.md`.  
4. **+ Құран мазмұны:** `QURAN_GPT_HANDOFF.md`.  
5. **+ PG:** `MIGRATION_SQLITE_TO_POSTGRES.md`.  
6. **+ хадис KK редакциясы:** `HADITH_DATA_PROVENANCE.md` §9, `data/hadith_kk_glossary.md`, `data/hadith_kk_editorial_batches.md`.

### 22.5 Ескерту

- **§16** жаңа `platform_api/app` қабаты (8788) **параллель** entrypoint; **негізгі өндіріс** әлі **`main.py` (8787)** — `ai_routes`, `auth_routes` т.б.  
- **§17–§21** принциптер мен Redis/Celery/audit сипаттамалары **§22**-мен толықтырылады, қайталау керек емес — қайта сұрақта **§22.1–22.3** жеткілікті.
- SQLite **`global_clean.db`** / көшірме файлдар: миграция **014** және bootstrap auth нақты күйі — **§23**.
- **Толық сілтеме кестесі (барлық тақырып):** **§24**.

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

## 24. Жинақ картасы — тақырып бойынша барлық негізгі сілтемелер (2026)

Бұл бөлім **бір кестеде** жинақтайды: қай сұраққа қай құжат немесе жол; GPT / SRE / жаңа әзірлеуші **§24**-ті скринхоттап немесе көшіріп алса, репо бойынша навигация жасай алады.

### 24.1 Өнім және стратегия

| Сұрақ | Қайда |
|--------|--------|
| Солтүстік жұлдыз, USER/VALUE/UX, XI–XII | `docs/RAQAT_PLATFORM.md` |
| Экожүйе карта, Docker, build order | `ECOSYSTEM.md`, `docs/PRODUCTION_BLUEPRINT_2M_USERS.md`, `infra/docker/docker-compose.yml` |

### 24.2 Дерекқор және көшу

| Сұрақ | Қайда |
|--------|--------|
| SQLite → PostgreSQL, DSN, пул, placeholder | `docs/MIGRATION_SQLITE_TO_POSTGRES.md`, `db/get_db.py`, `db/dialect_sql.py` |
| Өндірісте SQLite емес | **`docs/PRODUCTION_POSTURE.md` §1**, `OPERATIONS_STACK_CHECKLIST.md` §2 |
| Alembic, PG DDL мысалдары | `docs/ALEMBIC_BOOTSTRAP.md` |
| SQLite миграция 012–014, bootstrap login | **§23**, `db/migrations.py` |

### 24.3 Redis, Celery, AI, бақылау

| Сұрақ | Қайда |
|--------|--------|
| Redis міндетті / тест `REQUIRED=0` | **`PRODUCTION_POSTURE.md` §2**, `tests/conftest.py` |
| Кезек, retry, timeout, DLQ жол картасы | **`PRODUCTION_POSTURE.md` §5**, `platform_api/celery_app.py`, `celery_tasks.py` |
| Орнату тізбегі | `OPERATIONS_STACK_CHECKLIST.md`, `scripts/ops_stack_checklist.sh` |
| `/metrics`, Prometheus, Grafana идеясы | **`PRODUCTION_POSTURE.md` §3**, `OPERATIONS_STACK_CHECKLIST.md` §5 |
| Exact + семантикалық AI кэш | **`PRODUCTION_POSTURE.md` §4**, `ai_exact_cache.py`, `ai_semantic_cache.py`, `RAQAT_AI_SEMANTIC_CACHE` |

### 24.4 Auth, JWT, Telegram link

| Сұрақ | Қайда |
|--------|--------|
| `/auth/login`, `/auth/link/telegram`, uuid `sub` | **§5.4**, **§23**, `platform_api/auth_routes.py`, `jwt_auth.py` |
| Тесттер | `tests/test_auth_link.py`, **§11** |

### 24.5 Құран / хадис мазмұны

| Сұрақ | Қайда |
|--------|--------|
| Құран импорт, транслит | `docs/QURAN_GPT_HANDOFF.md` |
| Хадис `source`, KK аударма, редакция | `docs/HADITH_DATA_PROVENANCE.md` (§9 редакция), `data/hadith_kk_glossary.md`, `data/hadith_kk_editorial_batches.md` |

### 24.6 Мобильді (Expo)

| Сұрақ | Қайда |
|--------|--------|
| API base, құпиялар | `mobile/src/config/raqatApiBase.ts`, `app.config.js`, `PLATFORM_GPT_HANDOFF` §6 |
| 99 есім UI (басты промо + экран) | `DashboardScreen.tsx` (промо), `AsmaAlHusnaScreen.tsx`; таб ортасы жоқ |
| Баптаулар, логин, донат URL | `SettingsScreen.tsx`, `raqatDonationUrl.ts`, `app.json` extra |
| Офлайн Құран, UI defer | **§22.3**, `utils/uiDefer.ts` |

### 24.7 Runbook және ops біріктірілген

| Сұрақ | Қайда |
|--------|--------|
| 5 track: PG + JWT + Redis + mobile + app.main | `docs/OPERATIONS_RUNBOOK_5_TRACKS.md` |
| Локальды тексеру | `docs/DEV_LOCAL_CHECKLIST.md` |

### 24.8 Жинақты модельге қалай жіберу

1. Осы файлдың **§22–§24** + `PRODUCTION_POSTURE.md` (немесе толық `PLATFORM_GPT_HANDOFF.md`).  
2. Нақты тапсырма: мысалы «PG cutover», «хадис батч B-01», «мобильді донат URL» — **§24.1–24.7** кестесінен жол таңдау.  
3. Терең мәтін қажет болса: кестедегі файлды толық оқу.

---
