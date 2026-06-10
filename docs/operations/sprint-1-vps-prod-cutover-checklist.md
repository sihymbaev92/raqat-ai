# Sprint 1 #103 — VPS production cutover (post-PG verification)

**Issue:** #103 · **Runbook:** [sprint-1-cutover-rollback-runbook.md](sprint-1-cutover-rollback-runbook.md)

---

## Current prod status (2026-05-25)

`GET https://api.rahatomir.com/ready` → **`backend=postgresql`**, **`redis=ok`**.

SQLite → PG cutover **prod-та орындалған** (немесе PG бастапқы режим). Жаңа cutover қажет емес — **post-cutover verification** жүргізіңіз.

---

## Quick gate (Windows)

```powershell
# .env.deploy: RAQAT_SMOKE_AUTH_PASSWORD, RAQAT_VPS_HOST
powershell -ExecutionPolicy Bypass -File scripts/sprint1_vps_prod_cutover.ps1
```

| Step | What |
|------|------|
| 1 | `/ready` → `backend=postgresql` |
| 2 | SSH env check (DATABASE_URL set, services active) |
| 3 | Prod smoke: auth + hatim + **quran-last-read** |
| 4 | Skip execute (already PG) |
| 5 | 2 min KPI monitor on prod |

---

## If prod ever shows `backend=sqlite`

Maintenance window + two-person rule:

1. `systemctl stop raqat-bot raqat-celery`
2. `bash scripts/backup_sqlite.sh`
3. `bash scripts/run_pg_cutover.sh --apply`
4. `.env.production`: `DATABASE_URL`, `RAQAT_PG_USE_POOL=1`; **keep** `RAQAT_DB_PATH` for rollback
5. `systemctl restart raqat-platform-api raqat-celery raqat-bot`
6. Re-run `sprint1_vps_prod_cutover.ps1`

Or: `sprint1_vps_prod_cutover.ps1 -ExecuteCutover` (SSH key required).

---

## Rollback (prod incident)

See runbook §5 — comment/remove `DATABASE_URL` lines, point `RAQAT_DB_PATH` to backup, restart.

Local drill: `scripts/sprint1_rollback_drill.ps1` (SIM-01, **5.2s**).

---

## SIM-03 device QA (last read)

```powershell
# USB phone + USB debugging
powershell -ExecutionPolicy Bypass -File scripts/sprint1_sim03_last_read_device_qa.ps1 -Interactive -AutoOpenSurah2
```

API gate (prod):

```powershell
python scripts/smoke_platform_api.py --api-base https://api.rahatomir.com --auth-login --quran-last-read
```

---

[← runbooks-index.md](runbooks-index.md)
