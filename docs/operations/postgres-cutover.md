# PostgreSQL cutover тәуекелі

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
