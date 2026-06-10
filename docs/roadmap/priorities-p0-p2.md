# Басымдық матрицасы (P0 / P1 / P2)

**2026-06 feature freeze:** жаңа feature жоқ — [feature-freeze-2026-06.md](feature-freeze-2026-06.md).

Тұрақты тәртіп: **P0** — масштаб және cutover негізі; **P1** — AI / әкімшілік; **P2** — ұзақ мерзім.

Тереңдік: [tech-debt.md](tech-debt.md) · PG: [operations/postgres-cutover.md](../operations/postgres-cutover.md) · мобильді sprint: [mushaf-sprints.md](mushaf-sprints.md), [feature-sliced-plan.md](feature-sliced-plan.md).

---

## P0 — қазіргі өткел (инфра + ядро UX)

| Домен | Тапсырмалар |
|--------|--------------|
| **Backend** | PostgreSQL migration layer; **Redis**; **JWT refresh**; **background jobs** |
| **Mobile** | `QuranSurahScreen` hook split; **FlashList**; **audio sync** |
| **Product** | offline Quran; push reminders; account sync; bookmark cloud sync |

---

## P1 — келесі толқын

| Бағыт | Тапсырмалар |
|--------|-------------|
| **AI & retrieval** | AI fatwa routing; Muftyat semantic retrieval; vector search |
| **Admin & analytics** | imam/admin panel; analytics pipeline |

**Ислам KB (FTS):** [platform_api/islamic-kb-rag.md](../platform_api/islamic-kb-rag.md).

---

## P2 — ұзақ мерзім

Voice assistant; Kazakh ASR/TTS; smartwatch; Android Auto; TV mode.

---

## Ескерту

P0-ды бір спринтке сыйдырмау — Backend (PG + Redis) мен Mobile (экран + FlashList) **параллель топтар**.

**Фазалар:** [phases-index.md](phases-index.md) · [phases-1-3.md](phases-1-3.md).

[← roadmap/README.md](README.md)
