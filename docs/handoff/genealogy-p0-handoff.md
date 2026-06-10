# Genealogy P0/A1 — handoff (2026-05-25)

**Sprint:** [genealogy-sprint-p0.md](../roadmap/genealogy-sprint-p0.md) · **A1 lock:** [genealogy_a1_production_lock.md](../genealogy_a1_production_lock.md)

---

## Не дайын

| Қабат | Файл / endpoint | Күй |
|-------|-----------------|-----|
| P0 schema | `db/genealogy_schema.py`, migration v20 | ✅ |
| P0 seed | `scripts/seed_genealogy_p0.py`, `db/genealogy_seed.py` | ✅ |
| A1 PG engine | `db/genealogy/*`, Alembic `001_genealogy_ltree` | ✅ prod (36 nodes) |
| API | `GET /api/v1/genealogy/clans`, `.../clans/{slug}` | ✅ SQLite fallback |
| Mobile | `GenealogyClansScreen`, bundled JSON, «Дін мен дәстүр» кіру | ✅ |
| Tests | Python 11+, Jest bundled | ✅ |

---

## Deploy (prod PG)

```bash
pip install -r requirements-postgres.txt
export DATABASE_URL=postgresql://USER:PASS@HOST:5432/raqat
python -m alembic -c alembic.ini upgrade head
python scripts/seed_genealogy_a1.py
# VPS (Alembic + P0 + A1):
bash scripts/vps_genealogy_a1_seed.sh
```

Offline mobile refresh:

```bash
python scripts/seed_genealogy_p0.py --db global_clean.db
python scripts/export_genealogy_bundled.py
```

---

## Архитектура (қысқа)

- **Edges = truth** (`genealogy_edges`); nodes = identity + display
- **LTREE path** + **closure** — LCA, subtree, async cycle verify
- **UUIDv7** node IDs; **slug** — public API key
- **Redis** tag cache (no `scan_iter`)
- **SQLite** — P0 adjacency read-only mirror; A1 write PG-only

---

## Келесі sprint (P1+)

- User-generated tree — **scope тыйым**
- Celery: `genealogy.verify_dag_integrity`, `path_updater.rebuild_subtree`
- 10k synthetic perf gate on PG
- Rich source citations UI per clan

Device QA: [2026-05-25-genealogy-p0-qa.md](../mobile/changelog/2026-05-25-genealogy-p0-qa.md)

[← handoff/README.md](README.md)
