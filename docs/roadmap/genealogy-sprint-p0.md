# Sprint GENEALOGY-P0 (7 күн)

**Басталу:** 2026-05-24 · **Күй:** ✅ **P0 complete** (2026-05-25)  
**Schema:** [genealogy_a1_production_lock.md](../genealogy_a1_production_lock.md) (A1 lock) · [genealogy_schema.md](../genealogy_schema.md) (P0 v20)

---

## Бекітілген шешімдер

1. **Дереккөздер** — `sources/genealogy_sources.md`; әр ру P0 citation кілтімен
2. **Mobile UI** — FlatList + Accordion + Breadcrumbs (nested ScrollView жоқ)
3. **Test dataset** — 26 node иерархия (3 жүз + 23 ру/тармақ)

---

## Күндік жоспар

| Күн | Deliverable | Статус |
|-----|-------------|--------|
| **1** | P0 `genealogy_schema.md`, migration v20 | **done** |
| **1B** | A1 lock + Alembic LTREE + UUIDv7 + services + API | **done** |
| **2** | `seed_genealogy_a1.py` + bundled export | **done** (script) |
| **3** | `GET /api/v1/genealogy/clans` | **done** |
| **4** | `GenealogyClansScreen` FlatList accordion + «Дін мен дәстүр» кіру | **done** |
| **5** | Offline bundled snapshot | **done** (`genealogy-p0.json`) |
| **6** | Device QA + perf (FlatList 60 FPS) | **done** (авто + [QA чеклист](../mobile/changelog/2026-05-25-genealogy-p0-qa.md)) |
| **7** | Docs handoff + freeze lift | **done** ([handoff](../handoff/genealogy-p0-handoff.md)) |

---

## Scope тыйымы (P0)

- User-generated tree / social graph
- AI генерация без `source_key`
- WebView-heavy hierarchy UI

[← roadmap/README.md](README.md)
