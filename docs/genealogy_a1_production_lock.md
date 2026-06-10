# Genealogy A1 — Production Lock (Graph Engine)

**Күй:** ✅ **LOCKED** (2026-05-24)  
**Sprint:** [genealogy-sprint-p0.md](roadmap/genealogy-sprint-p0.md)  
**P0 baseline:** [genealogy_schema.md](genealogy_schema.md) (migration v20 — adjacency list, slug PK)  
**Sources:** [sources/genealogy_sources.md](../sources/genealogy_sources.md)

---

## 1. Lock scope

A1 — **production-grade directed acyclic graph (DAG)** for Kazakh shezhire:

| Principle | Lock |
|-----------|------|
| **Truth separation** | `genealogy_edges` = authoritative parent→child; nodes = identity + display |
| **Primary store** | PostgreSQL + `ltree` + closure table |
| **IDs** | **UUIDv7** (time-sortable), `slug` — stable public key |
| **Cycle prevention** | Hot-subtree in-memory check on write; full check async |
| **Cache** | Redis tag-based invalidation (**no** `scan_iter`) |
| **Mobile read** | Bundled snapshot JSON (offline); API = PG source of truth |
| **SQLite (bot/local)** | Read-only mirror / export only — **no** LTREE on SQLite |

P0 `genealogy_clans` (v20) → **Day 2 seed OK**; A1 tables **parallel add** (v21 Alembic), migrate P0 slugs into `genealogy_nodes.slug`.

---

## 2. Schema (frozen DDL intent)

### `genealogy_nodes`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID` PK | `generate_uuidv7()` |
| `slug` | `TEXT` UNIQUE NOT NULL | `uly_zhuz`, `dulat` — API + mobile |
| `name_kk` | `TEXT` NOT NULL | |
| `name_kk_alt` | `TEXT` | |
| `name_lat` | `TEXT` | |
| `level` | `SMALLINT` | 1=жүз, 2=ру, 3=тармақ (denormalized) |
| `path` | `LTREE` | materialized path, e.g. `uly_zhuz.uisin.dulat` |
| `sort_order` | `INT` | |
| `is_published` | `BOOLEAN` | |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | |

**Indexes:** `GiST (path)`, `(slug)`, `(level, sort_order)`

### `genealogy_edges` (source of truth)

| Column | Type | Notes |
|--------|------|-------|
| `id` | `BIGSERIAL` PK | |
| `parent_id` | `UUID` FK → nodes | |
| `child_id` | `UUID` FK → nodes | |
| `source_key` | `TEXT` NOT NULL | → `sources/genealogy_sources.md` |
| `citation_note` | `TEXT` | |
| `created_at` | `TIMESTAMPTZ` | |

**UNIQUE:** `(parent_id, child_id)`  
**CHECK:** `parent_id <> child_id`

### `genealogy_closure`

| Column | Type |
|--------|------|
| `ancestor_id` | `UUID` |
| `descendant_id` | `UUID` |
| `depth` | `INT` |

**PK:** `(ancestor_id, descendant_id)`  
**Use:** LCA, subtree queries, async cycle detection

### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS ltree;
```

---

## 3. UUIDv7 generator (locked — pure Python)

```python
import os
import time
import uuid


def generate_uuidv7() -> uuid.UUID:
    """RFC 9562 UUIDv7 — time-ordered, no extra deps."""
    timestamp_ms = int(time.time() * 1000) & ((1 << 48) - 1)
    rand_a = int.from_bytes(os.urandom(2), "big") & 0x0FFF  # 12 bits
    rand_b = int.from_bytes(os.urandom(8), "big") & ((1 << 62) - 1)
    uuid_int = (timestamp_ms << 80) | (0x7 << 76) | (rand_a << 64) | (0b10 << 62) | rand_b
    return uuid.UUID(int=uuid_int)
```

**Module:** `db/genealogy_uuid.py` (Day 1 B)

---

## 4. Cycle detection (locked — two-tier)

### Tier 1 — write path (sync, &lt;5 ms target)

`HotSubtreeCycleDetector`:

- Scope: **ancestor chain of parent + descendants of child, max depth 4**
- In-memory adjacency for **hot subtree only** (~O(100) nodes)
- Reject insert if `child` reachable from `parent` in hot window

### Tier 2 — full graph (async)

- Celery job `genealogy.verify_dag_integrity`
- Uses `genealogy_closure` — cycle ⟺ ∃ row where `ancestor_id = descendant_id AND depth > 0`
- On violation: mark edge `quarantine`, alert ops, **no silent fix**

**Forbidden:** full adjacency map per worker at 100k+ scale.

---

## 5. Cache invalidation (locked — no scan_iter)

**Pattern:** tag-based + pub/sub

| Key pattern | Tag |
|-------------|-----|
| `genealogy:subtree:{slug}` | `tag:genealogy:path:{ltree_prefix}` |
| `genealogy:ancestors:{slug}` | same tag family |
| `genealogy:lca:{a}:{b}` | both path tags |

**On edge write:**

1. Compute affected `ltree` prefixes (old + new path)
2. `SADD genealogy:invalidated_paths {prefix}` + `EXPIRE` 300s
3. `PUBLISH genealogy:invalidate {prefix}` — API workers drop local LRU
4. Optional: Redis 7.4+ client-side caching with explicit tag bust

**Forbidden:** `scan_iter("genealogy:*")` in request path or sync invalidation.

---

## 6. Path / closure updates (locked)

| Strategy | When |
|----------|------|
| **Sync** | Insert node — set `path` from parent + slug segment |
| **Async job** | Reparent / bulk import — `path_updater.rebuild_subtree(root_id)` + closure rebuild |
| **Trigger** | **Not in v1** — avoid lock contention on deep trees |

Job: `genealogy.rebuild_paths_and_closure(root_slug)`

---

## 7. Services map (Option A — Days 2–5)

| Module | Responsibility |
|--------|----------------|
| `db/genealogy_uuid.py` | UUIDv7 |
| `db/models/genealogy.py` | SQLAlchemy 2.0 models |
| `db/genealogy/cycle_detector.py` | HotSubtree + async verify |
| `db/genealogy/cache_manager.py` | Tag invalidation |
| `db/genealogy/lca_engine.py` | Closure-based LCA |
| `db/genealogy/path_updater.py` | LTREE + closure rebuild |
| `platform_api/genealogy_routes.py` | Read API (Day 3) |

---

## 8. Build order (locked)

| Day | Deliverable | Option |
|-----|-------------|--------|
| **1B** | A1 lock doc + Alembic `001_genealogy_ltree` + GiST + UUID helper | **B** |
| **2** | P0 seed → A1 node import; closure bootstrap | B→A |
| **3** | `cycle_detector`, `cache_manager` skeleton + read API | A |
| **4** | `path_updater` async + `lca_engine` | A |
| **5** | 10k synthetic DAG test + perf gate | A |
| **6–7** | Mobile FlatList + offline snapshot | P0 UI |

---

## 9. Remaining risks (accepted, mitigated)

| Risk | Mitigation |
|------|------------|
| Hot subtree miss rare long-range cycle | Tier 2 nightly + post-import verify |
| Closure rebuild latency | Batch job; read from stale cache max 60s TTL |
| LTREE label charset | Slug `[a-z0-9_]+` only; no dots in slug (path separator `.`) |

---

## 10. Decision log

| ID | Decision | Status |
|----|----------|--------|
| A1-01 | UUIDv7 not v4 | ✅ Locked |
| A1-02 | HotSubtree cycle only on write | ✅ Locked |
| A1-03 | Tag cache, no scan_iter | ✅ Locked |
| A1-04 | Edges = source of truth | ✅ Locked |
| A1-05 | Async path rebuild (no triggers v1) | ✅ Locked |

[← genealogy_schema.md](genealogy_schema.md) · [ALEMBIC_BOOTSTRAP.md](ALEMBIC_BOOTSTRAP.md)
