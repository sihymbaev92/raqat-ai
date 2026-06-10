# Sprint 1 #103 — Production cutover & rollback runbook

**Issue:** #103 · **Deep Dive:** [sprint-1-architecture-deep-dive-v2.md](sprint-1-architecture-deep-dive-v2.md) §3–§4  
**Depends:** #101 shadow DB, #102 migration pipeline  
**Windows scripts:** `scripts/sprint1_cutover_*.ps1`, `scripts/sprint1_rollback_drill.ps1`

---

## 1. Read-only maintenance window (production)

**Мақсат:** cutover кезінде split-brain жазбаларын болдырмау.

| Комponent | Әрекет |
|-----------|--------|
| Telegram bot | `systemctl stop raqat-bot` (немесе deploy freeze) |
| Celery worker | `systemctl stop raqat-celery` |
| Platform API | қысқа maintenance — тек `/health`, `/ready`, read routes |
| Migrator | **бір** инженер, `run_pg_cutover.sh --apply` |

API-level maintenance flag Sprint 1-де **жоқ** — ops stop-writes паттерні (бот + worker тоқтату).

---

## 2. Pre-cutover gate (T-24h / T-1h)

```powershell
# Windows (shadow/staging parity)
powershell -ExecutionPolicy Bypass -File scripts/sprint1_cutover_precheck.ps1

# Git Bash
bash scripts/backup_sqlite.sh
export PG_DSN='postgresql://...'
bash scripts/run_pg_cutover.sh --validate-only
python scripts/sprint1_cutover_sample_validate.py --sqlite ./global_clean.db --pg-dsn "$PG_DSN"
```

**PG bootstrap backup (prod PG бар болса):**

```bash
pg_dump "$PG_DSN" -Fc -f "backups/raqat_pg_pre_cutover_$(date +%Y%m%d%H%M).dump"
```

---

## 3. Cutover execute (T0)

1. Read-only window (§1).
2. Соңғы SQLite backup: `bash scripts/backup_sqlite.sh`
3. Delta/full migrate:

```powershell
$env:PG_DSN = "postgresql://USER:PASS@HOST:5432/raqat_prod"
powershell -ExecutionPolicy Bypass -File scripts/sprint1_run_pg_cutover.ps1 -Apply
```

4. `.env.production`:
   - `DATABASE_URL` = prod PG DSN
   - `RAQAT_PG_USE_POOL=1`, `RAQAT_PG_POOL_MIN=1`, `RAQAT_PG_POOL_MAX=10`
   - `RAQAT_DB_PATH` **алмастырмау** (rollback fallback)
5. Restart API + Celery.
6. Smoke:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sprint1_smoke_cutover.ps1 -SkipApiStart
```

---

## 4. Post-cutover monitoring (2 hours — §3 KPI)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sprint1_cutover_monitor.ps1
# QA short window:
powershell -ExecutionPolicy Bypass -File scripts/sprint1_cutover_monitor.ps1 -DurationMinutes 10 -IntervalMinutes 1
```

| Primary trigger | Threshold | Action |
|-----------------|-------------|--------|
| `/ready` success | < 95% (2h window) | **Rollback §5** |
| HTTP 5xx rate | > 5% (min 100 req) | **Rollback §5** |
| Smoke consecutive fails | ≥ 3 | **Rollback §5** |

---

## 5. Rollback (< 15 min target)

1. `.env.production`: `DATABASE_URL` / `DATABASE_URL_WRITER` **жолдарын comment/remove** (бос string жеткіліксіз — `get_db` WRITER-ге fallback жасайды; `.env` dotenv reload)
2. `RAQAT_DB_PATH` → pre-cutover backup (`backups/global_clean_*.db`)
3. Restart API + bot + Celery
4. Verify: `curl …/ready` → `backend=sqlite`
5. `python scripts/smoke_platform_api.py --api-base …`
6. PG DB сақтау (forensics); incident issue ашу

**Staging drill (SIM-01):**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sprint1_rollback_drill.ps1
```

---

## 6. Two-person rule

| Role | Responsibility |
|------|----------------|
| **Cutover lead** | migrate, env switch, smoke |
| **Incident commander** | KPI monitor, rollback decision |
| **Second engineer** | §5 rollback steps верификация (staging drill witness) |

---

## 7. M1 Done criteria (#103)

- [ ] Staging rollback drill < 15 min (`sprint1_rollback_drill.ps1`)
- [ ] Pre-cutover + smoke scripts green on shadow
- [ ] Production cutover OR documented maintenance window schedule
- [ ] 2h KPI monitor clean OR rollback executed per §5
- [ ] `docs/PRODUCTION_POSTURE.md` PG snapshot updated post-cutover

---

[← runbooks-index.md](runbooks-index.md) · [Project board](../roadmap/sprint-1-project-board.md)
