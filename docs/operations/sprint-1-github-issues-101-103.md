# Sprint 1 — GitHub Issues (#101–#103) copy-paste

**Board:** [sprint-1-project-board.md](../roadmap/sprint-1-project-board.md)  
**Deep Dive:** [sprint-1-architecture-deep-dive-v2.md](sprint-1-architecture-deep-dive-v2.md)  
**Milestone:** M1 Data Layer Lock (Day 5)

GitHub-қа issue ашу: төмендегі әр блокты **Title** + **Body** ретінде көшіріңіз. Labels: `sprint-1`, `P0`, `milestone:M1`.

---

## Issue #101 — Shadow PostgreSQL + staging parity

**Title:** `[Sprint 1][M1] #101 Shadow DB — staging PostgreSQL parity with SQLite snapshot`

**Labels:** `sprint-1`, `P0`, `infrastructure`, `milestone:M1`

**Depends on:** —

**Blocks:** #102, #103

### Description

Provision a **shadow PostgreSQL** environment that mirrors production SQLite schema and row counts. This is the safety net for Sprint 1 cutover: all migration scripts run here first; CI integration tests must pass before any production window.

**Architecture:** See `docs/operations/sprint-1-architecture-deep-dive-v2.md` §5.

### Tasks

- [ ] Create staging PG instance (Docker `postgres:16` or VPS staging DB)
- [ ] Document DSN in team vault (not in repo): `RAQAT_PG_TEST_DSN` / staging URL
- [ ] Run `bash scripts/backup_sqlite.sh` → use snapshot as source
- [ ] Execute `python scripts/migrate_sqlite_to_postgres.py --sqlite ./global_clean.db --pg-dsn "$PG_DSN" --bootstrap-ddl --with-quran-hadith --validate`
- [ ] Run `python scripts/validate_pg_copy.py --sqlite ./global_clean.db --pg-dsn "$PG_DSN"`
- [ ] Green: `pytest tests/test_pg_migrate_integration.py -m integration -v`
- [ ] Document refresh cadence (weekly / pre-cutover) in runbook
- [ ] Wire CI matrix `postgresql` job in `.github/workflows/refactor-smoke.yml` as gate reference

### Acceptance Criteria

- [ ] Row counts for `platform_identities`, `platform_ai_chat_messages`, `quran`, `hadith` match SQLite snapshot (validate script exit 0)
- [ ] `GET /ready` against API pointed at shadow PG returns `backend=postgresql`, `redis=ok` (staging)
- [ ] Integration pytest passes on clean checkout
- [ ] Runbook link added to `docs/operations/runbooks-index.md`

### Risks

| Risk | Mitigation |
|------|------------|
| Staging drift from prod | Refresh from latest `backup_sqlite.sh` before M1 gate |
| Partial quran/hadith in repo DB | Use prod snapshot or `import_content_pipeline.sh` on copy |

### References

- `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §13.1
- `docs/OPERATIONS_RUNBOOK_5_TRACKS.md` §1.4–1.6

---

## Issue #102 — Migration pipeline hardening + pre-cutover validation

**Title:** `[Sprint 1][M1] #102 PG migration pipeline — audit, validate-only gate, pool tuning`

**Labels:** `sprint-1`, `P0`, `backend`, `milestone:M1`

**Depends on:** #101

**Blocks:** #103

### Description

Harden the **SQLite → PostgreSQL migration pipeline** for production cutover: placeholder audit, validate-only dry-run as mandatory gate, connection pool defaults, and smoke scripts documented as one executable checklist.

Addresses failure modes **FM-01, FM-03, FM-04** in Deep Dive v2.

### Tasks

- [ ] Run `python scripts/audit_sql_placeholders.py` — triage `db/`, `platform_api/`, `handlers/` findings
- [ ] Fix or ticket any P0 `?` vs `%s` paths on hot auth/chat routes (`db/dialect_sql.py` pattern)
- [ ] Shadow DB: `bash scripts/run_pg_cutover.sh --validate-only` — document output in issue comment
- [ ] Shadow DB: `bash scripts/run_pg_cutover.sh --apply` — full migrate + validate
- [ ] Run `python scripts/smoke_cutover_validate.py --sqlite ./global_clean.db --pg-dsn "$PG_DSN" --api-base http://127.0.0.1:8787`
- [ ] Set staging pool env: `RAQAT_PG_USE_POOL=1`, `RAQAT_PG_POOL_MIN=1`, `RAQAT_PG_POOL_MAX=10` — load smoke
- [ ] Pre-cutover backup checklist: `backup_sqlite.sh` + `pg_dump -Fc` documented
- [ ] Add M1 gate section to `docs/operations/sprint-1-architecture-deep-dive-v2.md` if scripts change

### Acceptance Criteria

- [ ] `audit_sql_placeholders.py` — no unreviewed P0 files on auth/chat path
- [ ] `--validate-only` exit 0 on shadow DB
- [ ] `smoke_cutover_validate.py` exit 0 (health, ready, content smoke)
- [ ] `/metrics` p95 < 2000 ms under smoke window (≥20 requests) OR documented exception
- [ ] Engineer can execute §1.1–1.8 of OPERATIONS_RUNBOOK without ad-hoc steps

### Risks

| Risk | Mitigation |
|------|------------|
| `--truncate` on prod PG | **Forbidden** on prod; staging only with explicit label |
| Advisory lock exit 4 | Single migrator; document `--skip-advisory-lock` as break-glass only |

### References

- `scripts/run_pg_cutover.sh`, `scripts/migrate_sqlite_to_postgres.py`
- `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §14.3–14.8

---

## Issue #103 — Cutover window, rollback playbook, KPI monitoring

**Title:** `[Sprint 1][M1] #103 Production cutover gate — read-only window, rollback KPI, 2h monitoring`

**Labels:** `sprint-1`, `P0`, `ops`, `milestone:M1`

**Depends on:** #101, #102

**Blocks:** M2 issues (#104+)

### Description

Execute the **production cutover procedure** with a locked rollback playbook. Default pattern: **read-only maintenance window + final delta migrate** (not dual-write on prod). Automated rollback trigger uses Deep Dive v2 §3 KPI.

### Tasks

- [ ] Schedule maintenance window (announce; freeze scope check)
- [ ] Pre-cutover: `backup_sqlite.sh` + verify backup restorable
- [ ] Pre-cutover: `pg_dump` of target PG (if re-bootstrap)
- [ ] Enable read-only / stop writes (document exact mechanism: API maintenance flag or stop bot writes)
- [ ] Final delta migrate to PG (`run_pg_cutover.sh --apply` or delta-only if already synced)
- [ ] Switch env: `DATABASE_URL` → prod PG; restart API + Celery worker
- [ ] Smoke: `curl /health`, `/ready`, `smoke_platform_api.py`, `smoke_cutover_validate.py`
- [ ] **2-hour monitoring:** `/ready` success ≥95%, 5xx ≤5%, smoke cron every 15 min
- [ ] Document rollback execution (§4.1 Deep Dive) — assign incident commander
- [ ] Post-cutover: update `docs/PRODUCTION_POSTURE.md` snapshot if needed

### Acceptance Criteria

- [ ] Production `/ready` shows `backend=postgresql` for ≥2 hours without KPI breach
- [ ] Rollback drill executed **once on staging** (SIM-01 in Deep Dive §6) — timed < 15 min
- [ ] Runbook §4.1 steps verified by second engineer (two-person rule)
- [ ] No data loss: random sample 10 users `platform_identities` + chat count match pre-cutover
- [ ] M1 milestone **Done** on project board

### Rollback trigger (if any KPI breached)

1. Unset `DATABASE_URL`; restore `RAQAT_DB_PATH` from pre-cutover backup
2. Restart services; verify `/ready` → sqlite
3. Open incident issue; preserve PG DB for forensics

### Risks

| Risk | Mitigation |
|------|------------|
| Split-brain writes during window | Strict read-only; single migrator |
| Delayed rollback | KPI in §3 — no subjective “feels slow” |

### References

- `docs/operations/sprint-1-architecture-deep-dive-v2.md` §3–§4
- `docs/OPERATIONS_RUNBOOK_5_TRACKS.md` §1.7–1.9

---

## Quick create (GitHub CLI)

`gh` орнатылған машинада:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sprint1_create_github_issues.ps1 -DryRun
powershell -ExecutionPolicy Bypass -File scripts/sprint1_create_github_issues.ps1
```

[← Deep Dive v2](sprint-1-architecture-deep-dive-v2.md) · [Project board](../roadmap/sprint-1-project-board.md)
