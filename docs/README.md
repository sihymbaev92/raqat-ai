# RAQAT — құжаттама (кіріс нүктесі)

Платформа брифі **бөліктерге бөлінді** (2026-05). Толық монолит — [archive/](archive/README.md).

**`.env` құпиялары құжаттарға енгізілмейді.**

---

## Жаңа сессия — минимум

1. [handoff/gpt-sre-summary.md](handoff/gpt-sre-summary.md)  
2. [operations/runbooks-index.md](operations/runbooks-index.md)  
3. [roadmap/priorities-p0-p2.md](roadmap/priorities-p0-p2.md)  
4. [mobile/changelog/2026-05-16.md](mobile/changelog/2026-05-16.md)  
5. [PRODUCTION_POSTURE.md](PRODUCTION_POSTURE.md)  

Тақырып іздеу: [handoff/topic-index.md](handoff/topic-index.md)

---

## Қалталар

| Қалта | Мазмұны |
|-------|---------|
| [architecture/](architecture/README.md) | Репо, конфиг, дерек, auth, security |
| [platform_api/](platform_api/README.md) | API endpoints, бот, Celery/Redis |
| [mobile/](mobile/README.md) | Expo, changelog, build |
| [product/](product/README.md) | Өнім ұстанымы |
| [roadmap/](roadmap/README.md) | Фазалар, P0/P1, tech debt |
| [operations/](operations/README.md) | Runbook, cutover, тесттер |
| [handoff/](handoff/README.md) | GPT/SRE жинақтау, § карта, topic-index |
| [archive/](archive/README.md) | Толық снапшот §1–§42 |

---

## GPT пакеттері

| Тапсырма | Файлдар |
|----------|---------|
| **Жаңа сессия (ең қысқа)** | `handoff/gpt-sre-summary.md` + `operations/runbooks-index.md` |
| Platform API / auth | `platform_api/overview.md` + `architecture/data-and-auth.md` |
| Ops / cutover | `operations/runbooks-index.md` + `PRODUCTION_POSTURE.md` |
| Мобильді UX | `mobile/README.md` + соңғы `changelog/` |
| AI + RAG | `platform_api/islamic-kb-rag.md` + `RAQAT_ISLAMIC_KNOWLEDGE_RAG.md` |
| Өнім жолы | `roadmap/phases-index.md` + `roadmap/phases-1-3.md` |
| Толық (ауыр) | `archive/PLATFORM_GPT_HANDOFF_2026-05.md` |

---

## Миграция күйі

| Кезең | Күй |
|-------|-----|
| **1** | README, архив, stub, 3 негізгі файл |
| **2** | changelog, roadmap, product/vision |
| **3** | §2–§24 → `architecture/`, `platform_api/`, `handoff/`, `operations/testing.md` |
| **4** | `gpt-sre-summary.md` жаңартылды; репо сілтемелері → жаңа жолдар; [MAINTAINING.md](MAINTAINING.md) |
| **5** | [handoff/section-map.md](handoff/section-map.md); README/индекстер; `scripts/polish_doc_banners.py` |

Көшіру: `python scripts/split_handoff_docs.py 3` (немесе аргументсіз — 2+3). Жаңарту ережелері: [MAINTAINING.md](MAINTAINING.md).

GPT кіру (толық): [PLATFORM_GPT_HANDOFF.md](PLATFORM_GPT_HANDOFF.md) · § картасы: [handoff/PLATFORM_GPT_HANDOFF.md](handoff/PLATFORM_GPT_HANDOFF.md)
