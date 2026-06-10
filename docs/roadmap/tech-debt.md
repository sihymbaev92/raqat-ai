# Техника қарызы және тәуекел

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 27. Production тәуекелдері (2026-05) — PostgreSQL cutover, Redis, мобильді orientation

### 27.1 PostgreSQL cutover

`db/get_db.py` және dialect абстракциясы **джанк қабылдауға жарайды**, бірақ нақты cutover **ең үлкен тәуекел** болып қалады.

**Неге SQLite «тез бітіп» кету қаупі жоғары:** mobile growth (DAU / сессия), **AI completion** сұраныстары (`platform_api`), **Hatim** және болашақтағы **bookmark / reading sync**, **аудио** күйі, **виджет** жақтан туындайтын жиі жазу, **analytics / events** — бәрі бір уақытта single-file SQLite үшін **жазу конкуренциясы**, диск I/O, backup/HA тұрғысынан **табалдырыққа** әкелуі мүмкін. Cutover тек «басқа СУБД қосу» емес, **жүктеме профилінің** өзгеруі.

Cutover-ден кейін **міндетті** тексеру: **индекстер** (EXPLAIN, slow query логы), **VACUUM / ANALYZE** саясаты, **connection pool** (`pool_size`, `max_overflow`, timeout, recycle), оқу-жазу latency бойынша **репрезентативті жүктеме** (staging → canary).

**Cutover алдында кодта басталатын қабат (ұсыныс, толығы §40.1):** **SQLAlchemy async** (`asyncpg` + pool), **Alembic** — қатаң версияланған миграциялар (review + CI), **repository layer** (HTTP handler ↔ SQL емес, домен ↔ репозиторий), **read/write separation abstraction** (оқу репликасы / writer pool — нақты топология инфрамен бекітіледі).

Қолда бар runbook: **`docs/PG_SLOW_QUERIES_RUNBOOK.md`**.

### 27.2 Redis (өндіріс)

**Redis-тты өндірісте міндетті ету** — rate limit, short-lived cache және queue үшін дұрыс шешім: API қорғалуы, жүктемеге төзімділік, фондық жұмыстарды бөлісу.

### 27.3 Мобильді: `expo-screen-orientation`

`unlockAsync` / `lockAsync` **нәзік** (OEM-ге тәуелді). `QuranSurahScreen.tsx` ішінде: focus кезінде orientation **тек** `InteractionManager.runAfterInteractions` кейін; blur-да pending callback **бас тартылады**; Android cleanup-інде **қосарланған** портрет құлыбы. Толығырақ — **§26.2** кестесі.

---

## 40. Стратегиялық техника қарызы (2026-05) — PostgreSQL алдындағы платформа қабаты, `QuranSurahScreen` hook-декомпозиция, локалды state масштабы

Бұл бөлім **өнім жолынан бөлек**, бірақ cutover және мобильді өсу кезінде **құлау тәуекелін төмендетуге** бағытталған **міндеттемелер мен ұсынымдарды** бекітеді. Нақты код PR-лармен кезең-кезеңмен шығады; §27, §28–§29, §31-пен үйлеседі.

### 40.1 SQLite → PostgreSQL: тәуекелдің түбі мен қазірден басталатын қабат

| Тақырып | Мазмұны |
|---------|---------|
| **Жүктеме көздері** | Mobile growth, **AI** (`platform_api` completion / rate), **Hatim sync**, **bookmarks**, **audio** күйі, **widgets** (жиі жаңарту), **analytics** — бір уақытта single-node SQLite үшін **жазу конкуренциясы**, файл өлшемі, backup/HA тұрғысынан **шегіне тез жету** қаупі. Бұл **§27.1**-дегі cutover тәуекелінің практикалық түсіндірмесі. |
| **Қазірден басталатын инфра (ұсыныс)** | **SQLAlchemy async** (`asyncpg`, pool sizing, statement timeout), **Alembic** — қатаң версияланған миграциялар (CI-да `alembic upgrade head` сынағы, review checklist), **repository layer** (handler-ларда шикі SQL емес; домен операциялары репозиторий арқылы), **read/write separation abstraction** (оқу жолы / жазу жолы — replica URL немесе кем дегенде интерфейс + кейін replica қосу). |
| **Cutover сәтіне дейін** | Индекстер, pool, VACUUM, staging жүктеме — **§27.1**; **`docs/PG_SLOW_QUERIES_RUNBOOK.md`**. |

### 40.2 `QuranSurahScreen.tsx` — technical debt орталығы; міндетті hook-декомпозиция

| Элемент | Мазмұны |
|---------|---------|
| **Мәселе** | Бір экранда шоғырланған: scroll, audio, orientation, paging, mushaf, modal, bookmarks, translation, tajweed, last read — §28–§29 және **§31.0 A** бұрыннан осы бағытты айтады. |
| **Міндетті бөлу (ұсынылатын hook шектері)** | **`useQuranReader`** — linear vs mushaf layout, тізім refs, scroll оркестрациясы; **`useAyahPlayback`** — ойнату күйі, highlight, аудио→скролл (**§26.7.1**); **`useMushafPager`** — горизонталь бет ені, snap, RNGH pager (**§26.8.4**); **`useLastReadPersistence`** — debounce, blur flush (`quranLastRead.ts`); **`useQuranNavigation`** — `ScreenOrientation`, focus/blur cleanup (**§26.2**, **§27.3**). Қосымша: **`useQuranReaderPrefs`** — density, nav mode, translation toggles (`quranReaderPrefs.ts`) — AsyncStorage шақыруларын осыдан оқшаңдау (**§40.3**-пен үйлеседі). |
| **Файл орны** | `mobile/src/quran/hooks/` немесе `mobile/src/features/quran/hooks/` — **§31.1** мақсаттық ағашпен келісімді. |
| **Deliverable тәртібі** | Экранда тек **композиция + JSX**; PR-ларды **бір hook = бір PR** (немесе кіші топ) деп бөлу — регрессияны шектеу. |

### 40.3 AsyncStorage — critical state шоғырлануы; масштаб кезіндегі траектория

| Элемент | Мазмұны |
|---------|---------|
| **Мәселе** | last read, reader prefs, density, nav mode, markers — көп критикалық күй **AsyncStorage** арқылы: JS thread I/O, JSON serialize, кілт саны өскен сайын **латенттілік** және жазу сәтсіздігі тәуекелі. |
| **Eventually (траектория)** | **MMKV** (жылдам key-value, native), немесе **Zustand + persist** (subset state, миграция нұсқалары), немесе **SQLite жергілікті кэш** (bookmark / hatim офлайн + sync queue үшін ыңғайлы). **Таңдау шешімі:** сервермен синхрондалатын домен көп болса — жергілікті **SQLite** + кезек; тек preferences / жеңіл күй болса — **MMKV** жеткілікті. |
| **Уақытша тәртіп** | Жаңа pref кілттерін PR сипаттамасында тізімдеу; ауыр JSON-ды AsyncStorage-та ұзақ ұстамау; cutover кезінде **бір кілт = бір мәнділік** ережесін сақтау. |

---
