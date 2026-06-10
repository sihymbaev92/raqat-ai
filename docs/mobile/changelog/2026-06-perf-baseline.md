# Perf baseline — feature freeze (2026-06)

**Мақсат:** freeze lift алдында өлшенген baseline + budget; регрессия тексеру.

Автомат (API/backend):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/perf_smoke_baseline.ps1
```

Preflight + Jest: `scripts/mobile_device_qa_preflight.ps1`

---

## API / backend (автомат)

| Check | Budget | Baseline (2026-05-24) | Pass |
|-------|--------|------------------------|------|
| `GET /ready` | <2 s | 688 ms | PASS |
| Halal `halal-damu/status` | <2 s | 207 ms | PASS |
| Halal companies `per_page=1` | <15 s | 13280 ms | PASS |
| Anonymous `POST /ai/chat` | 401 | 401 | PASS |
| Hatim `GET/PUT/GET` | <3 s | OK | PASS |
| Jest full (`mobile/`) | 375/375 | 375/375 | PASS |

---

## Mobile — device (manual, release APK)

APK: `mobile/apk-download/raqat-release-latest.apk`  
QA чеклист: [2026-05-24-device-qa.md](2026-05-24-device-qa.md)

| Сценарий | Budget | Baseline | Pass | Ескертпе |
|----------|--------|----------|------|----------|
| Widget boot (adb) | reboot OK | adb broadcast | SKIP | receiver OK; home widget + reboot — manual |
| Al-Baqara classic scroll | jank-free | crash-free open | PASS | auto_smoke deep link |
| Audio play → scroll + pulse | 1 scroll/ayat |  | SKIP | §1 |
| Mushaf page flip | <300 ms сезілетін |  | SKIP | |
| Halal first open (cold) | <15 s | | MANUAL | ~4 MB parse |
| Halal repeat open | <2 s | | MANUAL | cache |
| Offline: сүре + last-read | <3 s open | | MANUAL | §1.6 |
| Hatim sync 2 device | merge OK | | MANUAL | §4 |

---

## Freeze lift (≥80% PASS)

| Критерий | Статус |
|----------|--------|
| API таблица ≥80% PASS | **100%** (6/6 автомат) |
| Device §1–§4 ≥90% PASS | **partial** full_device_qa: **5 PASS / 19 SKIP** (R58R54KA0FE) |
| `npm run test:full` | |
| Security: CORS + anonymous AI | anonymous **401** done |
| P0 crash open | **PASS** deep links (Quran/Halal/Hadith/Hatim) |

[← feature-freeze-2026-06.md](../../roadmap/feature-freeze-2026-06.md)
