# RAQAT позициялау

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 38. RAQAT болашағы (позициялау)

**Индекс:** **§24.0**.

**Мақсатты образ:** **қазақ / ТМД мусылмандары үшін ең ыңғайлы, бір орталық ислам companion** — әрқайсысы үшін **ең жеңіл**, **ең оңай**, **ең керек** тәжірибе (§1 ұстанымы). Muslim Pro-ның **ыңғайлылығы** (намаз, хабарлама, құбыла, күнделікті әдет) + Quran.com-ның **таза оқу тәжірибесі** + Tarteel-дің **AI-ы** (оқу, жаттау, уақыт бойынша синхрон) + RAQAT-тың **жергілікті мазмұны** (**KK** аударма, **Хафс 604**, **хатым**, хадис/дуа экожүйесі). Техникалық тірек: **§36**; алғашқы қадам: **§37** + **§33**; жол картасын шолу: **§24.0**.

## GPT-ге қалай жіберу (ChatGPT, Claude, Cursor, т.б.)

### Ең қарапайым жол

1. Осы файлды ашыңыз: **`docs/README.md`** + [gpt-sre-summary.md](../handoff/gpt-sre-summary.md) (толық архив: `docs/archive/PLATFORM_GPT_HANDOFF_2026-05.md`).
2. Өнім стратегиясы керек болса, қосымша: **`docs/RAQAT_PLATFORM.md`** (солтүстік жұлдыз, XI–XII).
3. Хабарламада мынаны жазыңыз: *«Контекст — төмендегі RAQAT брифі. Менің тапсырмам: …»* және нақты сұрақты қосыңыз.

### Тереңдету пакеті (қажетіне қарай)

| Деңгей | Файлдар |
|--------|---------|
| **Минимум** | `docs/README.md` + `handoff/gpt-sre-summary.md` |
| **+ мобильді Құран: мұсаф бет нөмірі, Хафс JSON, FlashList pin** | осы файл **§30** |
| **+ mobile/src Feature-Sliced рефактор жоспары** | осы файл **§31** |
| **+ өнім жол картасы (фазалар 1–3, MVP 2 апта, техника)** | осы файл **§24.0** (индекс), содан **§33**–**§38**; **§24.0.1** (Win/CI) |
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
Төменде RAQAT платформасының инженерлік брифі ([docs/README.md](../README.md)) беріліп тұр.
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
