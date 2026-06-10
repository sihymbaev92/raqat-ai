# Genealogy P0 — device QA чеклист (2026-05-25)

**Экран:** «Дін мен дәстүр → Шежіре» · deep link `imamai://more/genealogy`  
**Offline:** `mobile/assets/bundled/genealogy-p0.json` (14 node)  
**API:** `GET /api/v1/genealogy/clans`, `GET /api/v1/genealogy/clans/{slug}`

---

## Автоматты (CI / preflight)

| Тексеру | Команда | Күтілетін |
|---------|---------|-----------|
| Python unit | `python -m pytest tests/test_genealogy_api.py tests/test_genealogy_repository.py tests/test_genealogy_uuid.py tests/test_genealogy_cycle_detector.py tests/test_genealogy_schema.py -q` | 11+ PASS |
| Bundled integrity | `cd mobile && npm test -- genealogyBundledP0 --ci` | PASS |
| Export refresh | `python scripts/export_genealogy_bundled.py` | 14 nodes |

---

## Құрылғыда §G1–§G4

| # | Сценарий | Критерий | Нәтиже |
|---|----------|----------|--------|
| G1 | «Дін мен дәстүр» → «Шежіре ашу» | 3 жүз тізімі (Ұлы / Орта / Кіші) | |
| G2 | Ұлы жүз → Ұйсін → Дулат | Breadcrumb + accordion; кері батырма | |
| G3 | Uçak режим | Offline bundled fallback; қате banner жоқ | |
| G4 | Deep link `imamai://more/genealogy` | Тікелей GenealogyClans экраны | |

**Perf (FlatList):** 14 node P0 — scroll stutter жоқ; accordion ашу/жабу ≤300ms сезілмелі кідіріс.

---

## Prod PG (ops)

```bash
export DATABASE_URL=postgresql://...
python -m alembic -c alembic.ini upgrade head
python scripts/seed_genealogy_a1.py
curl -sS "$API/api/v1/genealogy/clans" | python -m json.tool
```

A1 synthetic gate (opsional): `python scripts/seed_genealogy_a1.py --synthetic 10000`

[← genealogy-sprint-p0.md](../../roadmap/genealogy-sprint-p0.md) · [handoff](../../handoff/genealogy-p0-handoff.md)
