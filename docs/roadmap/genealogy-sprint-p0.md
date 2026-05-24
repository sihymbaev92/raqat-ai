# Sprint GENEALOGY-P0 (7 күн)

**Басталу:** 2026-05-24 · **Күй:** Execution Phase  
**Schema:** [genealogy_schema.md](../genealogy_schema.md) · **Sources:** [sources/genealogy_sources.md](../sources/genealogy_sources.md)

---

## Бекітілген шешімдер

1. **Дереккөздер** — `sources/genealogy_sources.md`; әр ру P0 citation кілтімен
2. **Mobile UI** — FlatList + Accordion + Breadcrumbs (nested ScrollView жоқ)
3. **Test dataset** — 14 node иерархия (3 жүз + 11 ру/тармақ)

---

## Күндік жоспар

| Күн | Deliverable | Статус |
|-----|-------------|--------|
| **1** | `docs/genealogy_schema.md`, migration v20, `db/genealogy_schema.py` | **done** |
| **2** | `seed_genealogy_p0.py` upsert + source refs | pending |
| **3** | `GET /api/v1/genealogy/clans` | pending |
| **4** | `GenealogyClansScreen` FlatList accordion | pending |
| **5** | Offline bundled snapshot | pending |
| **6** | Device QA + perf (FlatList 60 FPS) | pending |
| **7** | Docs handoff + freeze lift | pending |

---

## Scope тыйымы (P0)

- User-generated tree / social graph
- AI генерация без `source_key`
- WebView-heavy hierarchy UI

[← roadmap/README.md](README.md)
