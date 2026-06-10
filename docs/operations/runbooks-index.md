# Operations — runbook индексі

Бір экраннан ops, cutover, CI және мамандандырылған құжаттарға сілтеме.

**Өндіріс шегі (міндетті):** [PRODUCTION_POSTURE.md](../PRODUCTION_POSTURE.md)

---

## Runbook және тексеру

| Сұрақ | Қайда |
|--------|--------|
| 5 track: PG + JWT + Redis + mobile + app.main | [OPERATIONS_RUNBOOK_5_TRACKS.md](../OPERATIONS_RUNBOOK_5_TRACKS.md) |
| Локальды тексеру | [DEV_LOCAL_CHECKLIST.md](../DEV_LOCAL_CHECKLIST.md) |
| Ops stack тізбегі | [OPERATIONS_STACK_CHECKLIST.md](../OPERATIONS_STACK_CHECKLIST.md), `scripts/ops_stack_checklist.sh` |
| 1 мин release | [RELEASE_1MIN_CHECKLIST.md](../RELEASE_1MIN_CHECKLIST.md) |
| PG баяу сұраулар | [PG_SLOW_QUERIES_RUNBOOK.md](../PG_SLOW_QUERIES_RUNBOOK.md) |
| Sprint smoke | [SPRINT_REFACTOR_SMOKE_CHECKLIST.md](../SPRINT_REFACTOR_SMOKE_CHECKLIST.md) |
| **Sprint 1 (PG cutover)** | [sprint-1-architecture-deep-dive-v2.md](sprint-1-architecture-deep-dive-v2.md) · [sprint-1-cutover-rollback-runbook.md](sprint-1-cutover-rollback-runbook.md) · [sprint-1-github-issues-101-103.md](sprint-1-github-issues-101-103.md) · [../roadmap/sprint-1-project-board.md](../roadmap/sprint-1-project-board.md) |
| **Веб-сайт (Expo web, басқа қаладан тест)** | [web-app-deploy.md](web-app-deploy.md) |

---

## PostgreSQL және дерекқор

| Сұрақ | Қайда |
|--------|--------|
| SQLite → PostgreSQL | [MIGRATION_SQLITE_TO_POSTGRES.md](../MIGRATION_SQLITE_TO_POSTGRES.md) |
| **Shadow PG (Sprint 1 #101, Windows)** | `scripts/sprint1_shadow_db.ps1` — Docker `raqat-pg-shadow` :5433; cutover gate: `scripts/sprint1_run_pg_cutover.ps1 -ValidateOnly`; smoke: `scripts/sprint1_smoke_cutover.ps1`; rollback: `scripts/sprint1_rollback_drill.ps1` (SIM-01) |
| **Redis AI cache (#106)** | `scripts/sprint1_redis_cache_drill.ps1` — flush `raqat:ai:exact:v1:*`; keys: `platform_api/ai_exact_cache.py` |
| **M3 incident pack (#107)** | `scripts/sprint1_incident_simulation.ps1` — SIM-01..04 + cache drill |
| **VPS prod cutover (#103)** | [sprint-1-vps-prod-cutover-checklist.md](sprint-1-vps-prod-cutover-checklist.md) · `scripts/sprint1_vps_prod_cutover.ps1` |
| **SIM-03 last read (device)** | `scripts/sprint1_sim03_last_read_device_qa.ps1` |
| Alembic bootstrap | [ALEMBIC_BOOTSTRAP.md](../ALEMBIC_BOOTSTRAP.md) |
| Өндірісте SQLite емес | [PRODUCTION_POSTURE.md](../PRODUCTION_POSTURE.md) |
| SQLite auth, миграция 012–014 | [architecture/data-and-auth.md](../architecture/data-and-auth.md), `db/migrations.py` |
| PG cutover тәуекелі (қысқа) | [postgres-cutover.md](postgres-cutover.md) |
| Техника қарызы (PG қабаты, hooks) | [../roadmap/tech-debt.md](../roadmap/tech-debt.md) |

---

## Islamic KB (Fatua / Muftyat)

| Сұрақ | Қайда |
|--------|--------|
| VPS-те бірінші sync | [islamic-kb-vps-sync.md](islamic-kb-vps-sync.md) |
| **Код deploy (rsync + restart)** | `bash scripts/vps_deploy.sh` немесе `.\scripts\vps_deploy.ps1` (`.env.deploy`) |
| Инженерлік карта | [../platform_api/islamic-kb-rag.md](../platform_api/islamic-kb-rag.md) |
| Скрипт | `scripts/sync_islamic_kb.py`, `scripts/run_islamic_kb_sync.sh` |

---

## Redis, Celery, AI, бақылау

| Сұрақ | Қайда |
|--------|--------|
| Redis міндетті / тест | [PRODUCTION_POSTURE.md](../PRODUCTION_POSTURE.md), `tests/conftest.py` |
| Кезек, retry, DLQ | [PRODUCTION_POSTURE.md](../PRODUCTION_POSTURE.md), `platform_api/celery_app.py` |
| Metrics / Prometheus | [PRODUCTION_POSTURE.md](../PRODUCTION_POSTURE.md) |
| AI exact + semantic cache | [PRODUCTION_POSTURE.md](../PRODUCTION_POSTURE.md), [platform_api/ai-ecosystem.md](../platform_api/ai-ecosystem.md) |

---

## VPS және API сыртқа шығару

| Сұрақ | Қайда |
|--------|--------|
| HTTPS, DNS, nginx, tunnel | [VPS_PRODUCTION_PLATFORM_API.md](../VPS_PRODUCTION_PLATFORM_API.md) |

---

## CI және Windows

| Сұрақ | Қайда |
|--------|--------|
| GitHub Actions | `.github/workflows/refactor-smoke.yml`, `content-release-smoke.yml` |
| PowerShell / жергілікті | [../roadmap/phases-index.md](../roadmap/phases-index.md) |

---

## Тесттер

| Көрсеткіш | Қайда |
|-----------|--------|
| `pytest tests` (түбір `.venv`) | [testing.md](testing.md) |
| `npm run test:full` (`mobile/`) | [mobile/README.md](../mobile/README.md) |

---

## GPT жіберу (ops)

1. Осы файл + `PRODUCTION_POSTURE.md`  
2. Нақты тапсырма: кестеден жол таңдау  
3. Басымдық: [roadmap/priorities-p0-p2.md](../roadmap/priorities-p0-p2.md)  
4. Өнім жолы: [roadmap/phases-index.md](../roadmap/phases-index.md)

**Толық тақырып картасы:** [handoff/topic-index.md](../handoff/topic-index.md) · § картасы: [handoff/section-map.md](../handoff/section-map.md)
