# Feature Freeze — RAQAT v1.1.0 soft launch

**Күні:** 2026-06-23  
**Мерзімі:** Play Internal Testing + P0 тұрақтылық жабылғанша  
**Git baseline:** `fead868` (v1.1.0)

## Ереже

**Жаңа модуль, тайл, экран, дизайн эксперименті, контент кітапханасы, видео hub — ТОҚТАТЫЛДЫ.**

12 dashboard тайлы жеткілікті (тіпті көп). Барлық инженерлік ресурс тек:

| Приоритет | Мақсат |
|-----------|--------|
| **P0** | Азан тұрақтылығы, crash, release blocker, діни/legal disclaimer |
| **P0** | Scholar review gate, Play Internal smoke |
| **P1** | APK өлшемі (asset pruning), Halal perf |
| **P2** | Тайл reorder, onboarding, жаңа фича — **кейін** |

## Рұқсат етілген өзгерістер

- **Автоматты орын (locked):** GPS/Wi‑Fi → қала, ауа райы, құбыла — `checkpoint/auto-location-v1`
- **Clean baseline (locked):** қолданылмайтын код + скрейп мәтін жойылды — `checkpoint/clean-baseline-v1`, `docs/operations/CLEAN_BASELINE.md`
- Bug fix (азан, crash, WebView, prayer times)
- Copy/disclaimer/permission guide (UI мәтін, баптау гиді)
- Test, CI, deploy, docs
- Asset pruning (APK көлемін азайту, функцияны бұзбай)
- Observability (`RAQAT_USAGE_STATS_SECRET`, usage stats)

## Тыйым салынған

- 13-ші dashboard тайл немесе жаңа «hub»
- Жаңа bundled JSON каталог (кітап, видео, курс)
- UI redesign / branding refresh (P2)
- QCF COLR / Sajda parity (P1+, freeze кезінде тек plan)
- Genealogy, supermarket, жаңа vertical

## Шығу шарты (freeze аяқталады)

1. Azan 3-күн locked-screen QA PASS (кемінде 3 OEM)
2. Scholar sign-off `namazContent.ts` (+ azan KK мәтіні)
3. Internal Testing 100 пайдаланушы, 7 күн crash-free baseline
4. APK ≤ 80 MB (аралық мақсат), содан кейін ≤ 70 MB

Толық жоспар: `docs/operations/RELEASE_5_STEP_STRATEGY.md`
