# Sprint 1 — Project Board (Constraint-Driven Kanban)

**Ұзақтығы:** 14 күн  
**Күй:** LAUNCHED  
**Deep Dive:** [sprint-1-architecture-deep-dive-v2.md](../operations/sprint-1-architecture-deep-dive-v2.md)  
**M1 issues:** [sprint-1-github-issues-101-103.md](../operations/sprint-1-github-issues-101-103.md)

---

## 1. WIP limits (бекітілді)

| Column | Limit | Ереже |
|--------|-------|-------|
| **Todo (Next in Queue)** | **2** | Dependency gatekeeper: blocked issue Todo-ға кірмейді |
| **In Progress** | **2** | Әр инженерге **1** active card |
| **Review / QA** | **3** | CI green + AC checklist |
| **Done** | ∞ | Milestone gate passed |

---

## 2. Milestones (phase freeze)

| ID | Атау | Күн | Gate |
|----|------|-----|------|
| **M1** | Data Layer Lock | **Day 5** | #101–103 Done; shadow PG + cutover/rollback drill |
| **M2** | Persistence & UI Lock | **Day 11** | #104–105 Done; last read + KB-Only negative suite |
| **M3** | Acceleration & Safety Gate | **Day 14** | #106–107 + SIM-01..04; freeze lift proposal |

**Phase freeze:** [feature-freeze-2026-06.md](feature-freeze-2026-06.md) — Sprint 1 scope-only PR-лар.

---

## 3. Issue backlog (7 cards)

| # | Title | Milestone | Depends | GitHub |
|---|-------|-----------|---------|--------|
| **101** | Shadow DB — staging PG parity | M1 | — | [#3](https://github.com/sihymbaev92/raqat-ai/issues/3) |
| **102** | Migration pipeline hardening | M1 | 101 | [#4](https://github.com/sihymbaev92/raqat-ai/issues/4) |
| **103** | Cutover + rollback KPI | M1 | 101, 102 | [#5](https://github.com/sihymbaev92/raqat-ai/issues/5) |
| **104** | Last read remote sync (Hatim pattern) | M2 | 103 | [#6](https://github.com/sihymbaev92/raqat-ai/issues/6) |
| **105** | AI KB-Only negative test suite + middleware audit | M2 | 103 | [#7](https://github.com/sihymbaev92/raqat-ai/issues/7) |
| **106** | Redis write invalidation + cache drill | M3 | 102 | [#8](https://github.com/sihymbaev92/raqat-ai/issues/8) |
| **107** | Incident simulation Day 13–14 | M3 | 104, 105, 106 | [#9](https://github.com/sihymbaev92/raqat-ai/issues/9) |

**GitHub milestones:** [M1](https://github.com/sihymbaev92/raqat-ai/milestone/1) · [M2](https://github.com/sihymbaev92/raqat-ai/milestone/2) · [M3](https://github.com/sihymbaev92/raqat-ai/milestone/3)

**Project board:** [RAQAT Sprint 1](https://github.com/users/sihymbaev92/projects/1) — issues #3–#9 қосылған. Қайта құру: `scripts/sprint1_create_project_board.ps1`

**Integration pytest (shadow host):** `RAQAT_PG_TEST_DSN=postgresql://postgres:postgres@127.0.0.1:5433/raqat_test` — `raqat_shadow` емес (truncate collision).

### #101 local status (2026-05-24)

| Check | Result |
|-------|--------|
| Shadow container `raqat-pg-shadow` (:5433) | OK |
| `scripts/sprint1_shadow_db.ps1 -Apply` | OK — 6224 quran, 33738 hadith |
| `pytest tests/test_pg_migrate_integration.py -m integration` | 1 passed |
| Issue comment | [#3](https://github.com/sihymbaev92/raqat-ai/issues/3#issuecomment-4529277139) |

### #102 local status (2026-05-24)

| Check | Result |
|-------|--------|
| `sprint1_run_pg_cutover.ps1 -ValidateOnly` | OK |
| `sprint1_smoke_cutover.ps1` (pool + API) | OK — `/ready` postgresql + redis=ok, surahs=114 |
| `test_platform_identity_pg_integration.py` | 1 passed |
| M1 gate | [Deep Dive §9](../operations/sprint-1-architecture-deep-dive-v2.md#9-m1-gate-checklist-local--staging) |
| Issue comment | [#4](https://github.com/sihymbaev92/raqat-ai/issues/4#issuecomment-4529441656) |

### #103 local status (2026-05-25)

| Check | Result |
|-------|--------|
| `sprint1_cutover_precheck.ps1` | OK — backup + validate + sample parity |
| `sprint1_rollback_drill.ps1` (SIM-01) | **PASS** — rollback **5.2s** (< 15 min) |
| `sprint1_cutover_monitor.ps1` (2 min QA) | OK — ready 100% |
| Runbook | [sprint-1-cutover-rollback-runbook.md](../operations/sprint-1-cutover-rollback-runbook.md) |

Windows cutover gate: `scripts/sprint1_run_pg_cutover.ps1 -ValidateOnly`

### #104 local status (2026-05-25)

| Check | Result |
|-------|--------|
| API `GET/PUT /api/v1/me/quran-last-read` | OK |
| Mobile `syncQuranLastReadWithServerBidirectional` | Hatim pattern |
| Tests | `test_quran_last_read_api.py`, `quranLastReadSync.test.ts` |
| Sync triggers | Login (Settings), Quran list focus |
| Issue comment | [#6](https://github.com/sihymbaev92/raqat-ai/issues/6#issuecomment-4529730964) |

### #105 local status (2026-05-25)

| Check | Result |
|-------|--------|
| `tests/test_ai_kb_only_mode.py` | **9 passed** — adversarial prompts (SIM-02), pipeline skip, FAQ/quran block skip, sources-only fatua/muftyat, `_fast_llm_config` no search |
| `tests/test_ai_kb_status_api.py` | **2 passed** — `GET /api/v1/ai/kb/status` → `kb_only: true` |
| `tests/test_ai_reply_guards.py` | **2 passed** |
| Middleware audit | `ai_proxy.py` gates: `_google_search_enabled`, `_pipeline_stages_enabled`, `_prompt_with_retrieval`, `generate_ai_reply_meta` → single KB path only |
| Rollback env | Deep Dive [§4.2](../operations/sprint-1-architecture-deep-dive-v2.md#42-ai-safety-rollback) — `RAQAT_AI_KB_ONLY=0` + restart (ops approval) |
| Run | `python -m pytest tests/test_ai_kb_only_mode.py tests/test_ai_kb_status_api.py tests/test_ai_reply_guards.py -q` |

**#101–103** — толық body: [sprint-1-github-issues-101-103.md](../operations/sprint-1-github-issues-101-103.md)

### #106 local status (2026-05-25)

| Check | Result |
|-------|--------|
| Key prefix `raqat:ai:exact:v1:` + semantic key | `ai_exact_cache.py`, `ai_semantic_cache.py` |
| Write-through on chat insert | `append_ai_exchange` → `ai_cache_invalidation.on_ai_chat_exchange_persisted` |
| Flush API | `cache_flush_all_ai()`, `cache_flush_prefix()` |
| Tests | `tests/test_ai_exact_cache.py` — **5 passed** |
| Staging drill | `scripts/sprint1_redis_cache_drill.ps1` |
| Deep Dive | [§4.4](../operations/sprint-1-architecture-deep-dive-v2.md#44-redis-cache-rollback) |

### #103 VPS prod status (2026-05-25)

| Check | Result |
|-------|--------|
| Prod `/ready` | **backend=postgresql**, redis=ok |
| Cutover | **Already on PG** — migrate not required |
| Deploy | `vps_deploy.ps1` — quran-last-read route live |
| Prod smoke | auth + hatim + quran-last-read (`--skip-surahs`; PG quran table empty) |
| Runbook | [sprint-1-vps-prod-cutover-checklist.md](../operations/sprint-1-vps-prod-cutover-checklist.md) |
| Gate script | `scripts/sprint1_vps_prod_cutover.ps1` |

### SIM-03 device QA

| Check | Result |
|-------|--------|
| Jest `quranLastReadSync` | PASS |
| Prod API roundtrip | PASS (after deploy) |
| Android manual | **Pending** — USB + `scripts/sprint1_sim03_last_read_device_qa.ps1 -Interactive` |

---

| SIM | Scenario | Automation |
|-----|----------|------------|
| SIM-01 | PG rollback < 15 min | `scripts/sprint1_rollback_drill.ps1` |
| SIM-02 | KB-Only adversarial | `tests/test_ai_kb_only_mode.py` |
| SIM-03 | Last read background | Jest `quranLastReadSync` + Android manual |
| SIM-04 | 5xx rollback trigger | Dry-run in `scripts/sprint1_incident_simulation.ps1` |
| Pack | All + #106 drill | `scripts/sprint1_incident_simulation.ps1` |

---

## 4. Automation rules (бекітілді)

### 4.1 Dependency Gatekeeper

- Issue **In Progress**-ке өтпейді, пока **Depends on** issues **Done** емес.
- #103 блокталған → cutover PR merge **жоқ**.

### 4.2 PR triggers

| Event | Action |
|-------|--------|
| PR opened (Sprint 1 label) | Require `refactor-smoke` green |
| PG-touched PR | Require `test_pg_migrate_integration` or manual shadow note |
| Mobile persistence PR | Jest `quranLastRead` + device QA note |
| AI PR | `test_ai_kb_only_mode.py` + `test_ai_reply_guards.py` |

### 4.3 Phase freeze (PR filter)

Merge тек если:

- [ ] Freeze scope: infra / persistence / safety (не жаңа экран)
- [ ] Linked issue ID in PR title `[Sprint 1] #10x`
- [ ] AC checklist in PR body
- [ ] Rollback considered (PG PR → link Deep Dive §4)

---

## 5. Launch checklist (Day 0)

- [x] Deep Dive v2 written
- [x] Issues #101–103 copy-paste ready
- [x] Board + WIP + milestones documented
- [ ] GitHub Project **「RAQAT Sprint 1」** — `gh auth refresh -h github.com -s project,read:project` sonra `gh project create --owner sihymbaev92 --title "RAQAT Sprint 1"`
- [x] Issues #104–107 → [#6](https://github.com/sihymbaev92/raqat-ai/issues/6)–[#9](https://github.com/sihymbaev92/raqat-ai/issues/9)
- [x] Milestones M1–M3 on GitHub
- [ ] **#3 In Progress** — M1 Shadow DB (Day 1)
- [ ] Shadow PG DSN in team vault
- [ ] Kickoff: read Deep Dive §3 KPI as team

### GitHub Project create (manual)

1. GitHub → **Projects** → New board **「RAQAT Sprint 1」**
2. Columns: `Todo (max 2)` · `In Progress (max 2)` · `Review/QA (max 3)` · `Done`
3. Import issues #101–107
4. Milestones: M1 (Day 5), M2 (Day 11), M3 (Day 14)

### Script (requires `gh` CLI)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sprint1_create_github_issues.ps1
```

---

## 6. Daily standup template

1. WIP limit respected? (In Progress ≤ 2)
2. M1 gate on track for Day 5?
3. Any FM-01..08 signal from staging?
4. Blocked cards → dependency callout

---

## 7. Success criteria (Sprint 1 end)

| Criterion | Measure |
|-----------|---------|
| PG production or staged cutover | `/ready` postgresql 2h stable OR documented rollback drill |
| AI safety | KB-Only negative suite green |
| Persistence | Last read survives background (device QA) |
| Team | M3 simulation logged |

---

[← roadmap/README.md](README.md) · [runbooks-index](../operations/runbooks-index.md)
