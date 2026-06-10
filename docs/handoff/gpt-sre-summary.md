# GPT / SRE — жинақтау нұсқауы

Жаңа сессияға арналған **қысқа кіру**. Толық тарих: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md).

---

## 1. Минимум пакет (көбіне жеткілікті)

| Рет | Құжат |
|-----|--------|
| 1 | [gpt-sre-summary.md](gpt-sre-summary.md) (осы файл) |
| 2 | [../operations/runbooks-index.md](../operations/runbooks-index.md) |
| 3 | [../roadmap/priorities-p0-p2.md](../roadmap/priorities-p0-p2.md) |
| 4 | [../mobile/changelog/2026-05-19.md](../mobile/changelog/2026-05-19.md) · [../roadmap/feature-freeze-2026-06.md](../roadmap/feature-freeze-2026-06.md) | Соңғы + **freeze sprint** |
| 5 | [../PRODUCTION_POSTURE.md](../PRODUCTION_POSTURE.md) |

Қосымша: [../README.md](../README.md) · тақырып: [topic-index.md](topic-index.md) · § карта: [section-map.md](section-map.md)

---

## 2. Өндіріс және ops

| Мақсат | Қайда |
|--------|--------|
| Өндіріс шегі | [PRODUCTION_POSTURE.md](../PRODUCTION_POSTURE.md) |
| Runbook тізбегі | [operations/runbooks-index.md](../operations/runbooks-index.md) |
| PG cutover тәуекелі | [operations/postgres-cutover.md](../operations/postgres-cutover.md) |
| Стек орнату | [OPERATIONS_STACK_CHECKLIST.md](../OPERATIONS_STACK_CHECKLIST.md) |
| 5 track | [OPERATIONS_RUNBOOK_5_TRACKS.md](../OPERATIONS_RUNBOOK_5_TRACKS.md) |
| Локальды тексеру | [DEV_LOCAL_CHECKLIST.md](../DEV_LOCAL_CHECKLIST.md) |

---

## 3. Platform API және auth

| Мақсат | Қайда |
|--------|--------|
| Endpoint карта | [platform_api/overview.md](../platform_api/overview.md) |
| Auth, SQLite, миграция 012–014 | [architecture/data-and-auth.md](../architecture/data-and-auth.md) |
| Redis, Celery, AI cache | [platform_api/ai-ecosystem.md](../platform_api/ai-ecosystem.md) |
| Бот ↔ API link | [platform_api/integration.md](../platform_api/integration.md) |
| `.env` айнымалылары | [architecture/configuration.md](../architecture/configuration.md) |

---

## 4. Мобильді

| Мақсат | Қайда |
|--------|--------|
| Changelog (соңғы) | [mobile/changelog/](../mobile/changelog/) |
| API клиент (тарихи) | [mobile/handoff-api-client.md](../mobile/handoff-api-client.md) |
| Мұсаф sprint жоспары | [roadmap/mushaf-sprints.md](../roadmap/mushaf-sprints.md) |
| Build / тест | [mobile/README.md](../mobile/README.md), [operations/testing.md](../operations/testing.md) |

---

## 5. Мазмұн және AI

| Мақсат | Қайда |
|--------|--------|
| Құран | [QURAN_GPT_HANDOFF.md](../QURAN_GPT_HANDOFF.md) |
| Хадис KK | [HADITH_DATA_PROVENANCE.md](../HADITH_DATA_PROVENANCE.md) |
| Ислам KB RAG | [platform_api/islamic-kb-rag.md](../platform_api/islamic-kb-rag.md), [RAQAT_ISLAMIC_KNOWLEDGE_RAG.md](../RAQAT_ISLAMIC_KNOWLEDGE_RAG.md) |
| Halal Damu (прокси + мобильді) | `platform_api/halal_damu_*.py`, `mobile/src/api/halalDamuWp.ts`, [operations/halaldamu-official-partnership-letter-kk.md](../operations/halaldamu-official-partnership-letter-kk.md) |
| Толық кіру (WIP күй) | [../PLATFORM_GPT_HANDOFF.md](../PLATFORM_GPT_HANDOFF.md) §4–§5 |

---

## 6. Өнім жолы

| Мақсат | Қайда |
|--------|--------|
| Фазалар индексі | [roadmap/phases-index.md](../roadmap/phases-index.md) |
| Фаза 1–3 мәтін | [roadmap/phases-1-3.md](../roadmap/phases-1-3.md) |
| P0/P1/P2 | [roadmap/priorities-p0-p2.md](../roadmap/priorities-p0-p2.md) |
| USER/VALUE/UX | [RAQAT_PLATFORM.md](../RAQAT_PLATFORM.md), [product/vision.md](../product/vision.md) |

---

## 7. Модельге не жіберу

| Кеңейтілген пакет | Файлдар |
|-------------------|---------|
| Platform + auth | `platform_api/overview.md` + `architecture/data-and-auth.md` |
| Ops толық | `operations/runbooks-index.md` + `PRODUCTION_POSTURE.md` |
| Мобильді UX | `mobile/README.md` + соңғы `mobile/changelog/*.md` |
| Толық архив (ауыр) | `archive/PLATFORM_GPT_HANDOFF_2026-05.md` |

**Ескерту:** `platform_api/app` (8788) — параллель entrypoint; негізгі өндіріс әлі `platform_api/main.py` (**8787**). [architecture/app-layer.md](../architecture/app-layer.md)

---

## 8. Тесттер (жергілікті)

```powershell
Set-Location d:\opt\raqat-ai\mobile; npm run test:full
Set-Location d:\opt\raqat-ai; .\.venv\Scripts\python.exe -m pytest tests -q
```

Толығы: [operations/testing.md](../operations/testing.md)

[← handoff/README.md](README.md) · [← docs/README.md](../README.md)
