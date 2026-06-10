# Feature freeze — 2–3 апта (2026-06)



**Мерзім:** ~2026-05-20 — 2026-06-10  

**Мақсат:** жаңа feature **жоқ**; тек сапа, тұрақтылық, flagship Quran, KB-only AI, infra дайындығы, визуал бірлігі.



Басымдық: [priorities-p0-p2.md](priorities-p0-p2.md) · perf baseline: [../mobile/changelog/2026-06-perf-baseline.md](../mobile/changelog/2026-06-perf-baseline.md) · device QA: [../mobile/changelog/2026-05-24-device-qa.md](../mobile/changelog/2026-05-24-device-qa.md) · архив §44: [../archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md).



**Freeze gate (бір команда):**



```powershell

powershell -ExecutionPolicy Bypass -File scripts/run_freeze_gate.ps1

```



PR checklist: [.github/pull_request_template.md](../../.github/pull_request_template.md)



---



## 0. Freeze ережесі



| Рұқсат | Тыйым |

|--------|--------|

| Crash fix, perf, UX polish | Жаңа экран, жаңа интеграция |

| Offline reliability, APK stability | «GPT бәріне жауап береді» режимі |

| Quran / Hatim / audio / typography | Halal products (API бос), жаңа контент-бағыт |

| KB citation UX, security hardening | Хадис/Құран батч аударма |



**PR фильтрі:** «Freeze-қа кіре ме?» — тек иә болса merge.



---



## 1. Quran — flagship (wow)



### 1.1 Sprint deliverables



| # | Тапсырма | Статус |

|---|----------|--------|

| 1 | `useAyahPlaybackScroll` | **done** |

| 2 | `useAyahPlayback` + `useLastReadPersistence` | **done** (§44) |

| 3 | FlashList classic list + layout | **done** |

| 4 | Reanimated ayah pulse (classic row) | **done** |

| 5 | Offline bundled cache regression | device QA §1.6 |

| 6 | Hatim sync API + Jest | **done**; device §4 MANUAL |

| 7 | Typography / density polish | backlog |

| 8 | Қазақша reader copy audit | backlog |



**Келесі (freeze scope):** `useQuranReader`, `useMushafPager` — 1 hook = 1 PR.



### 1.2 Done criteria



- Аудио → scroll + pulse, pause қайталанбау (§1 device QA).

- Офлайн сүре + last-read.

- Release APK Quran path crash-free.



---



## 2. AI — тек KB



| # | Тапсырма | Статус |

|---|----------|--------|

| 1–4 | KB-only prod + mobile | **done** |

| 5 | `RAQAT_AI_ALLOW_ANONYMOUS=0` | **done** (401) |

| 6 | Halal камера — maintenance only | ongoing |



---



## 3. Stability & polish



| # | Тапсырма | Статус |

|---|----------|--------|

| 1–3 | Halal storage, loading, feed cache test | **done** |

| 4 | Widget boot / prayer refresh | regression QA |

| 5 | `npm run test:full` | **375/375 Jest** |



---



## 4. Production infra



| # | Тапсырма | Статус |

|---|----------|--------|

| VPS cron smoke (6h) | **done** |

| Prod hatim smoke auth (`raqat-smoke`) | **done** |

| PG cutover staging | plan only |

| KB sync cron | **done** |



---



## 5. Perf QA (P2)



| Қадам | Файл |

|-------|------|

| API автомат | `scripts/perf_smoke_baseline.ps1` |

| Device manual | [2026-06-perf-baseline.md](../mobile/changelog/2026-06-perf-baseline.md) |

| Lift ≥80% API + ≥90% device §1–§4 | perf baseline кесте |



---



## 6. Апталық кесте



### Апта 1 (2026-05-20 — 05-26) — **done**



- [x] Hook split, FlashList, Reanimated pulse, APK, VPS cron

- [x] Device QA doc + preflight scripts

- [ ] Manual §1–§3 on device (adb)



### Апта 2 (2026-05-27 — 06-02) — **in progress**



- [x] Prod smoke auth + hatim API PASS

- [x] Freeze gate scripts + PR template + perf baseline doc

- [x] Device QA §1–§4 partial → [2026-05-24-device-qa.md](../mobile/changelog/2026-05-24-device-qa.md) (auto_smoke R58R54KA0FE)

- [x] Perf baseline device rows partial (Baqara + widget boot adb)

- [x] Widget boot regression adb PASS (home widget pin + reboot — manual)

- [x] **GENEALOGY-P0** sprint complete → [genealogy-sprint-p0.md](genealogy-sprint-p0.md), [handoff](../handoff/genealogy-p0-handoff.md)

- [x] **Sprint 1 LAUNCHED** → [sprint-1-project-board.md](sprint-1-project-board.md), [Deep Dive v2](../operations/sprint-1-architecture-deep-dive-v2.md)



### Апта 3 (2026-06-03 — 06-10)



- [ ] Freeze-scope APK only

- [ ] CORS review

- [ ] Freeze retrospective → lift



---



## 7. Repo hygiene (P0)



- [x] `.gitignore`: sync logs, `.tmp-*`, release APK artifacts

- [ ] Untracked junk тазалау (local only, commit емес)

- [x] `.github/pull_request_template.md`



[← roadmap/README.md](README.md)


