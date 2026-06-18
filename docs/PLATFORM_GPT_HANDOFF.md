# RAQAT Platform Handoff және толық сапа есебі

**Күйі:** 2026-06-12  
**Мақсаты:** бұл құжат RAQAT мобильді/web платформасын сыртқы GPT/SRE/mobile/religious-content reviewer тексерісіне беруге арналған толық handoff. Ол жаңа агентке немесе тексерушіге жобаның не екенін, қай жері күшті, қай жері сақтық сұрайтынын және келесі даму перспективасын жылдам түсіндіреді.

**Құпия қауіпсіздік ережесі:** бұл файлға `.env`, API key, keystore, service token, пароль, private endpoint credential енгізілмейді. Тек архитектура, public behavior, файл жолдары, командалар және release/QA фактілері жазылады.

---

## 1. Executive Summary

RAQAT / RAHAT OMIR — қазақ тіліндегі исламдық mobile/web платформа. Негізгі миссиясы: Қазақстандағы мұсылман қолданушыға намаз, Құран, хатым, дұға, тәспі, құбыла, халал іздеу, ҚМДБ/Муфтият білім базасы, хадис, дін мен дәстүр, шежіре, қажылық және AI көмекші құралдарын бір жинақы, сенімді, әдепті қолданбада беру.

Қазіргі техникалық база:

- **Mobile:** Expo SDK 54, React Native 0.81.5, React 19.1.0.
- **Android native:** Kotlin modules for prayer widgets, full-screen azan alarms, qibla/widget services.
- **Web:** Expo web export, `rahatomir.com` deploy flow, stale bundle health checks.
- **Backend:** FastAPI Platform API, Islamic KB/RAG, auth, halal proxy, content endpoints, client error reporting.
- **Data:** SQLite-first local/global data, bundled offline JSON catalogs, PostgreSQL migration posture documented.
- **AI:** KB-only client posture, source-grounded Islamic helper, Kazakhstan/Hanafi-Maturidi compliance guardrails.

2026-06-09..12 аралығында major hardening жасалды:

- Android azan flow notification-first емес, native full-screen azan alarm + direct audio focus-қа ауыстырылды.
- Қолданба логотиптері, Kaaba live fallback, Talbiyah/azan visuals, safe-area modals, Quran/Hatim clipping fixes енгізілді.
- Religious compliance: Қазақстан заңы, ҚМДБ бағыты, Ханафи мәзһабы, Матуриди ақидасы және anti-extremism/takfir guardrails күшейтілді.
- Hadith policy: unapproved bundled Kazakh hadith translations source-only режиміне ауыстырылды.
- Offline auto-translation sanitizer енгізілді: corrupt/generated code fragments UI-ға шықпайды.
- Production crash screen raw technical error көрсетпейді.
- Halal photo AI machine protocol leakage жабылды.
- Dashboard halal rotator 80ms JS loop-тен жеңіл auto-advance режиміне ауыстырылды.

Соңғы verification snapshot:

- `npm run lint` passed.
- `npm test -- --ci` passed: **138 suites, 566 tests**.
- `npm run build:apk` passed: **BUILD SUCCESSFUL**.
- APK artifact: `mobile/android/app/build/outputs/apk/release/app-release.apk`.
- Latest optimized APK size: about `114.46 MB`.
- Latest APK SHA256: `87b6c8d4a5bb4324ec372370f4d0c927e3cd8ffc550454a499fd76498d486090`.

---

## 2. Бірінші оқылатын файлдар

| Рет | Файл | Неге керек |
|-----|------|------------|
| 1 | `docs/PLATFORM_GPT_HANDOFF.md` | Осы толық platform report |
| 2 | `docs/QURAN_GPT_HANDOFF.md` | Quran/Hatim/Mushaf rendering deep handoff |
| 3 | `docs/handoff/gpt-sre-summary.md` | Ops/API/mobile қысқа индекс |
| 4 | `docs/operations/runbooks-index.md` | VPS, deploy, healthcheck runbook |
| 5 | `docs/PRODUCTION_POSTURE.md` | Redis/PG/cache/production posture |
| 6 | `docs/RAQAT_ISLAMIC_KNOWLEDGE_RAG.md` | Islamic KB/RAG source policy |
| 7 | `docs/HADITH_DATA_PROVENANCE.md` | Hadith data provenance және source notes |
| 8 | `mobile/package.json` | Нақты mobile scripts/dependencies |

Қосымша: `docs/README.md`, `docs/MAINTAINING.md`, `docs/PLATFORM_ROADMAP_API_AI_USERS.md`, `docs/product/vision.md`.

---

## 3. Репозиторий картасы

| Қалта / файл | Рөлі |
|--------------|------|
| `mobile/` | Expo React Native mobile/web client |
| `mobile/src/screens/` | Dashboard, Prayer, Quran, Hadith, Halal, AI, Tradition, Genealogy screens |
| `mobile/src/components/` | Reusable UI, Quran renderer, dashboard cards, modals |
| `mobile/src/navigation/` | Root/Main/More stacks, deep links, Android back policy |
| `mobile/src/services/` | Notifications, AI helpers, bootstrap, bundled services |
| `mobile/src/api/` | Platform API, Halal Damu, prayer/content API clients |
| `mobile/src/storage/` | AsyncStorage prefs/cache/history |
| `mobile/src/quran/` | Mushaf layout, typography, audio, translation, page fit |
| `mobile/src/i18n/` | Kazakh baseline strings and offline runtime locale |
| `mobile/assets/bundled/` | Offline Quran/hadith/dhikr/catalog/product JSON |
| `mobile/android/app/src/main/java/kz/raqat/app/` | Native Kotlin alarms/widgets/qibla modules |
| `platform_api/` | FastAPI Platform API and Islamic KB/RAG |
| `bot_main.py`, `handlers/`, `services/` | Telegram bot layer |
| `db/`, `global_clean.db` | SQLite data/migrations and seed builders |
| `scripts/` | VPS deploy, data sync, export/import, web health |
| `tests/` | Python/API regression tests |
| `docs/` | Handoff, operations, roadmap, release/content docs |

---

## 4. Product Surface: қолданушы көретін негізгі мүмкіндіктер

### 4.1 Dashboard

`DashboardScreen.tsx` — app home hub:

- next prayer hero/card, compact prayer row;
- prayer tracker;
- qibla entry and sensor context;
- 12 service launcher: Quran, Hadith, Namaz, Tajweed, Seerah, Hajj, Tasbih, Duas, Asma, AI, Halal, Tradition;
- Quran continue reading;
- Halal Damu product rotator;
- daily AI prompts/news/tradition/hadith/hajj promos.

Quality note: home halal rotator battery/jank risk reduced by replacing continuous `80ms` scroll loop with lower-frequency auto-advance and AppState pause.

### 4.2 Намаз, азан, widget

Core files:

- `mobile/src/api/prayerTimes.ts`
- `mobile/src/services/prayerNotifications.ts`
- `mobile/src/services/prayerFullScreenAzan.ts`
- `mobile/src/screens/PrayerAzanScreen.tsx`
- `mobile/android/app/src/main/java/kz/raqat/app/PrayerAzanAlarmScheduler.kt`
- `PrayerAzanAlarmReceiver.kt`, `PrayerWidgetModule.kt`, `PrayerWidgetBootReceiver.kt`

Current behavior:

- Android salat alarm uses native exact/full-screen alarm where possible.
- Expo notification fallback is intentionally minimized for Android azan; azan screen and native audio are the primary flow.
- Legacy stale notification cleanup exists to remove old channels/notifications.
- Android widget sync reads prayer cache and native payload.

Reviewer focus:

- exact alarm permission and OEM battery behavior;
- full-screen intent behavior on Android 13/14/15/16;
- reboot restore;
- no duplicate azan audio/notification sound.

### 4.3 Quran, Hatim, Mushaf

Core files:

- `QuranListScreen.tsx`, `QuranSurahScreen.tsx`, `QuranMushafBookScreen.tsx`, `HatimScreen.tsx`
- `mobile/src/components/quran/*`
- `mobile/src/quran/*`
- `mobile/assets/bundled/quran-*`

Recent hardening:

- QCF4 page clipping reduced with safe vertical padding and glyph sizing.
- Book/page fit policy tests added.
- Last-read persistence and continue reading components exist.
- Safe-area policy improved across several modals, but Quran/Hatim sheets remain a high-value follow-up area.

Reviewer focus:

- Baqarah long pages on physical Android phones;
- ayah context menu bottom safe-area;
- audio scroll/focus behavior;
- translation attribution clarity.

### 4.4 Halal Damu, halal scan, products

Core files:

- `mobile/src/screens/HalalScreen.tsx`
- `mobile/src/api/halalDamuWp.ts`
- `mobile/src/components/halal/*`
- `mobile/src/components/HalalNearbyBlock.tsx`
- `mobile/src/components/HalalCompaniesMapModal.tsx`
- `mobile/assets/bundled/halal-products-seed-kz.json`

Current behavior:

- Halal Damu official registry search, nearby/map, product/additive lookup.
- Product seed fills gaps when official product endpoint is empty.
- Barcode/photo flows can trigger registry lookup.
- Photo AI protocol leakage is now blocked by `mobile/src/utils/halalVisionMachineLines.ts`.
- `halalPhotoVisionDisclaimer` is shown below photo analysis results.

Reviewer focus:

- long-list rendering in `HalalScreen` and `HalalNearbyBlock`;
- map WebView marker load performance;
- official vs seed/proxy source labeling;
- photo AI never producing a religious ruling.

### 4.5 AI және ҚМДБ/Муфтият knowledge

Mobile surfaces:

- `RaqatAIChatScreen.tsx`
- `IslamicKbSearchScreen.tsx`
- `OfficialKnowledgePortalScreen.tsx`
- `RaqatKbStatusBar.tsx`
- `RaqatAiExampleChips.tsx`

Backend files:

- `platform_api/ai_routes.py`
- `platform_api/ai_proxy.py`
- `platform_api/islamic_kb/rag.py`
- `platform_api/ai_reply_guards.py`
- `platform_api/ai_qa_sources.py`

Current guardrail stance:

- Client has KB-only posture.
- Prompt guardrail includes Kazakhstan law, public harmony, QMDB/Fatua/Muftyat sources, Hanafi madhhab, Maturidi aqida, no takfir/extremism/violence/sectarian agitation.
- UI copy repeatedly states AI is not a fatwa source and users should confirm with official sources/qualified imam.

Remaining reviewer concern:

- backend should add explicit lightweight moderation/classifier for extremist/takfir/anti-state/sectarian prompts before generation;
- cache hits should preserve/return source metadata for KB answers.

### 4.6 Hadith, Quran translation, religious content

Hadith files:

- `mobile/assets/bundled/hadith-sahih-seed.json`
- `mobile/assets/bundled/hadith-from-db.json`
- `mobile/assets/bundled/extracted-hadith-muftyat.json`
- `mobile/assets/bundled/external-hadith-kk.json`
- `mobile/src/storage/hadithCorpus.ts`
- `HadithHubScreen.tsx`, `HadithDetailScreen.tsx`

Current policy:

- Compact Sahih seed is source-only; unapproved Kazakh translations are not bundled as app-authored text.
- Source-only entries show Arabic/source attribution and note that approved Kazakh meaning is not included.
- Hadith UI includes source/context disclaimers.

Reviewer focus:

- scraped Muftyat/Fatua articles should be labeled as articles/excerpts, not overstated as hadith translation;
- secondary portals should be labeled as secondary, not equal to QMDB/Fatua/Muftyat;
- Quran KK attribution should match actual bundle provenance.

### 4.7 Дін мен дәстүр, шежіре, seasonal content

Core files:

- `KazakhTraditionScreen.tsx`
- `traditionBooksCatalog.ts`, `traditionReligiousEvidence.ts`, `traditionTopicsCatalog.ts`
- `GenealogyClansScreen.tsx`, `FamilyTreeScreen.tsx`
- `db/shezhire_catalog_builder.py`, `mobile/assets/bundled/genealogy-p0.json`
- `HajjMuftyatGuide`, `HajjTourAgenciesPanel`, `KurbanAit*`

Recent UX direction:

- “Дін мен дәстүр” was simplified to reduce too many buttons/cards.
- Family tree clan placeholder was changed from technical `slug` wording to user-facing clan wording.
- Talbiyah hero uses Kaaba imagery with safer aspect policy.

---

## 5. Religious and Kazakhstan Compliance Report

This app must not contradict Kazakhstan religious requirements and must default to Imam A'zam Abu Hanifa madhhab with Maturidi aqida framing.

Implemented safeguards:

- `AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK` in `mobile/src/config/aiRequestPolicy.ts`.
- `withReligiousComplianceGuardrail()` applied to AI prompt builders.
- AI example questions and daily prompts mention Hanafi/QMDB framing.
- Hadith and Tajweed disclaimers strengthened.
- Source-only hadith policy enforced by tests.
- Religious compliance copy tests check presence of QMDB/Hanafi/fatwa/source/teacher language.
- Offline auto-translation sanitizer blocks corrupt/generated religious strings from reaching UI.

Important principle:

- Quran/book excerpts may include scripture or historical wording that looks strong in isolation. Do not remove scripture meaning casually. Instead ensure context labels, source attribution, and Kazakhstan/QMDB/Hanafi-Maturidi disclaimers surround interpretation surfaces.

Recommended next compliance work:

- Add backend pre-generation moderation for takfir/extremism/anti-state/sectarian/violence prompts.
- Add allowlist/source-label tests for hadith/external sources.
- Review `namazContent.ts` practical fiqh topics with qualified Hanafi scholar before public release wording is considered final.
- Relabel scraped Muftyat/Fatua article surfaces to avoid implying every article is a hadith translation.

---

## 6. i18n және offline translation policy

Main files:

- `mobile/src/i18n/kk.ts`
- `mobile/src/i18n/runtime.ts`
- `mobile/src/services/autoTranslate.ts`
- `mobile/src/services/offlineAutoTranslations.ts`
- `mobile/src/services/offlineAutoTranslationSafety.ts`
- `mobile/assets/bundled/offline-auto-translations-core.json`

Current policy:

- Baseline source copy is Kazakh.
- Runtime must not call online machine translation for UI strings.
- Exposed full QA languages should stay limited to `kk`, `ru`, `en`, `ky` until other locales are fully reviewed.
- Corrupt offline translations are rejected if they contain placeholder text, code fragments, `undefined`, `NaN`, or generated protocol-like leftovers.

Tests:

- `mobile/src/services/__tests__/offlineAutoTranslations.test.ts`
- `mobile/src/i18n/__tests__/kkOrthography.test.ts`
- `mobile/src/i18n/__tests__/religiousComplianceCopy.test.ts`

---

## 7. Quality Hardening Completed Recently

### 7.1 UI and safe-area

- Modal safe-area helper added: `mobile/src/theme/modalSafeArea.ts`.
- Applied across important overlays: Halal map/camera, embedded sheets, Kaaba live, Qibla AR, lightboxes, city picker, etc.
- Remaining follow-up: Quran/Hatim sheets (`AyahContextMenuSheet`, `QuranNavWheelSheet`, `HatimSurahSearchSheet`) need same strict modal safe-area pass.

### 7.2 Async/race guards

Added/used latest-request patterns in several areas:

- Quran list remote refresh;
- official knowledge portal;
- Islamic KB search;
- Settings timers/mounted guards;
- various Halal catalog/detail flows already have active/cancel guards.

Remaining follow-up:

- Dashboard prayer load should use the same latest-request guard.
- Raqat AI chat send/retry should get per-request guard or abort support.
- Qibla sensor context async subscription should guard stale subscription attachment.
- Startup/AppState background promises should be wrapped with top-level `try/catch` and `Promise.allSettled`.

### 7.3 Public-launch polish

- Production crash screen no longer exposes raw module/error messages.
- Halal photo AI no longer leaks machine-only `BARCODE:` / `NAME:` protocol text.
- Halal photo result shows clear non-fatwa disclaimer.
- Dashboard halal rotator no longer runs continuous high-frequency JS scroll.
- Offline generated translation fragments are blocked at lookup/cache layer.

### 7.4 Technical debt highlights

- Async/race condition guards should become an app-wide standard, especially for Dashboard, AI chat, Qibla sensor context, startup jobs, and AppState background promises.
- Halal long lists, company product lists, and map marker rendering need virtualization, caps, and lazy loading so older Android devices do not decode/render too much at once.
- Bundle and asset size still need regular pruning. The latest APK was reduced to about `114.46 MB`, but web/mobile exports should continue using selective asset inclusion, runtime JSON loading, and stale-chunk health checks.

---

## 8. Verification Snapshot

Latest known successful verification:

```powershell
Set-Location d:\opt\raqat-ai\mobile
npm run lint
npm test -- --ci
npm run build:apk
```

Results:

- TypeScript: passed.
- Jest: **138 passed suites / 566 passed tests**.
- Android release APK: **BUILD SUCCESSFUL**.
- APK path: `mobile/android/app/build/outputs/apk/release/app-release.apk`.
- APK size: about `114.46 MB` in the latest optimized APK. Previous pre-pruning APK snapshot was about `144.73 MB`.
- SHA256: `87b6c8d4a5bb4324ec372370f4d0c927e3cd8ffc550454a499fd76498d486090`.

Gradle note:

- Build reports Gradle deprecation warnings for future Gradle 9 compatibility. This did not fail the release build, but should be tracked before major Android toolchain upgrade.

---

## 9. Release and Deploy Commands

Mobile:

```powershell
Set-Location d:\opt\raqat-ai\mobile
npm install
npm run lint
npm test -- --ci
npm run build:apk
npm run build:aab
npm run release:play:check
```

Android connected-device QA:

```powershell
Set-Location d:\opt\raqat-ai\mobile
powershell -ExecutionPolicy Bypass -File scripts/setup-android-emulator-env.ps1
adb devices
npm run android:live
npm run qa:android:release
```

Web deploy:

```powershell
Set-Location d:\opt\raqat-ai
powershell -ExecutionPolicy Bypass -File scripts/vps_deploy_web.ps1
```

Web health:

```powershell
Set-Location d:\opt\raqat-ai
powershell -ExecutionPolicy Bypass -File scripts/web-release-health.ps1
```

Platform API local:

```powershell
Set-Location d:\opt\raqat-ai
.\scripts\run_platform_api.ps1 -Dev -FreePort
```

Python tests:

```powershell
Set-Location d:\opt\raqat-ai
.\.venv\Scripts\python.exe -m pytest tests -q
```

Doc-only edits do not require APK/AAB build.

---

## 10. External Review Checklist

### Product/UX reviewer

- [ ] Is the home dashboard understandable in the first 10 seconds?
- [ ] Are the 12 main modules too dense or just right?
- [ ] Does Halal search clearly distinguish official registry, seed data, secondary source, and AI/photo helper?
- [ ] Does Quran/Hatim page mode feel stable on small Android phones?
- [ ] Does “Дін мен дәстүр” feel compact, respectful, and not overloaded?

### Mobile performance reviewer

- [ ] Check home dashboard initial render and JS thread activity.
- [ ] Profile Halal long lists and map WebView marker loading.
- [ ] Check large bundled JSON impact on web/mobile startup.
- [ ] Verify image decode pressure in dashboard/halal/hajj/tradition cards.
- [ ] Verify AppState timers/subscriptions stop in background.

### Android native reviewer

- [ ] Test exact alarm permission, full-screen intent, reboot restore.
- [ ] Test azan screen on locked phone, unlocked foreground, and background.
- [ ] Test widget refresh and stale payload recovery.
- [ ] Test Android 3-button nav and gesture nav safe-area.
- [ ] Inspect manifest permissions for Play compliance.

### Religious-content reviewer

- [ ] Confirm AI disclaimers are enough and not hidden.
- [ ] Confirm Hanafi/Maturidi/QMDB framing is consistent.
- [ ] Review practical namaz fiqh sections with a qualified Hanafi scholar.
- [ ] Review hadith article labels and source-only policy.
- [ ] Review Quran translation attribution and context labels.

### Backend/SRE reviewer

- [ ] Check `/health`, `/ready`, `/metrics/json`.
- [ ] Check AI KB status and source return behavior.
- [ ] Ensure AI cache preserves sources or avoids source-less KB answers.
- [ ] Add moderation precheck for unsafe religious prompts.
- [ ] Check client error reporting pipeline and rate limits.

---

## 11. Known Risks and Priority Backlog

### P0 before broad public launch

1. Add backend religious safety moderation before AI generation. Owner: Backend/SRE. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
2. Run qualified Hanafi scholar review for `namazContent.ts` and practical fiqh sections. Owner: Religious-content. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
3. Guard Dashboard prayer `load()` with latest-request/mounted pattern. Owner: Mobile. Estimate: `S`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
4. Complete Quran/Hatim modal safe-area pass. Owner: Mobile. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
5. Label scraped Muftyat/Fatua article screens precisely as article/excerpt content. Owner: Product/content. Estimate: `S`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
6. Align Quran KK attribution with actual bundle provenance. Owner: Product/content. Estimate: `S`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
7. Real-device Android QA for azan full-screen + audio + lock screen. Owner: Android QA. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).

### P1 quality upgrades

1. Virtualize/cap Halal long lists and company product lists. Owner: Mobile performance. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
2. Chunk/defer Halal map marker loading. Owner: Mobile performance. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
3. Add request guards to AI chat long requests and Halal photo/barcode pipelines. Owner: Mobile/backend. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
4. Add startup/AppState `Promise.allSettled` and client error reporting around background jobs. Owner: Mobile/SRE. Estimate: `S`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
5. Add Qibla sensor stale-subscription guard. Owner: Mobile. Estimate: `S`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
6. Add hadith source allowlist and risky-term exception tests. Owner: Religious-content/QA. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
7. Continue selective asset pruning for web/mobile exports. Owner: Web/mobile performance. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).

### P2 product growth

1. Full Play Store release checklist and privacy/data safety form. Owner: Release. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
2. Better onboarding personalization: city, madhhab/source safety, Quran reading style. Owner: Product/mobile. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
3. Offline-first Quran/hadith/dua catalog completeness. Owner: Content/platform. Estimate: `L`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
4. User account sync: bookmarks, hatim progress, family tree, scan history. Owner: Backend/mobile. Estimate: `L`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
5. Observability dashboards for crash/error/AI/halal/prayer flows. Owner: SRE. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).
6. Scholar review workflow for sensitive content updates. Owner: Religious-content/product. Estimate: `M`. GitHub issue: [TBD](https://github.com/sihymbaev92/raqat-ai/issues).

---

## 12. 30/60/90 Day Perspective

### 30 days: trust and release readiness

- Close P0 items.
- Run manual QA on multiple Android devices.
- Freeze religious copy and source labels after scholar review.
- Run Play release validator and APK/AAB build reproducibility check.
- Confirm web deploy health and stale bundle recovery.

### 60 days: performance and reliability

- Virtualize Halal heavy screens.
- Standardize async request guards app-wide.
- Add backend moderation and source-preserving AI cache.
- Add structured client error dashboards.
- Reduce bundle/assets where possible without losing offline value.

### 90 days: platform maturity

- Account sync and durable user data.
- Better content provenance tooling.
- More complete offline language QA.
- Official partnership workflow for Halal Damu/QMDB content.
- Public-facing support/feedback/report-content flows.

---

## 13. Definition of Done for “World-Class” Release

The app is ready to present widely when:

- no public screen exposes raw technical errors, protocol text, placeholders, or broken generated translations;
- all sensitive religious answers are source-grounded and framed by Kazakhstan/QMDB/Hanafi-Maturidi policy;
- Quran/Hatim rendering does not clip on target Android phones;
- azan full-screen alarm works on real devices and failure mode is clear;
- Halal registry/source labels are transparent;
- `npm run lint`, full Jest, release build, Play validator, and manual smoke pass;
- web deploy health validates index/chunks/key routes;
- content reviewer approves sensitive namaz/hadith/Quran/tradition copy.

---

## 14. Common Diagnostics

| Symptom | Likely cause | First action |
|---------|--------------|--------------|
| Web white screen | stale chunk or missing JS | run `scripts/web-release-health.ps1` |
| Quran web route fails | stale JS or missing bundled asset | check `/more/quran`, `/more/surah/1`, `/more/mushaf-book/1` |
| Android azan does not open | exact alarm/full-screen permission/OEM block | inspect alarm permission, receiver logs, lock-screen behavior |
| Azan duplicates sound | notification channel + screen playback both active | inspect Android channel/sound fallback and receiver path |
| Widget stale | payload not synced | open app, refresh prayer, inspect `PrayerWidgetModule.setPayload` |
| Halal proxy fails | VPS API stale or Halal Damu shape changed | direct fallback should work; update proxy if needed |
| AI no response | API base/env/backend issue | check `/health`, mobile API base, server env |
| Bad translated UI | corrupt offline translation bundle/cache | sanitizer should block; add test and regenerate bundle |
| Bottom buttons overlap nav bar | native modal missing safe-area | apply `modalSafeAreaInsets(useSafeAreaInsets())` |

---

## 15. Maintenance Rules

- Do not add secrets to docs.
- Do not expose partial locales in UI without full QA.
- Do not remove web manifest pruning/health checks.
- Do not casually alter Quran/scripture text; add context and source labels instead.
- Do not present AI output as fatwa.
- Do not rebuild APK/AAB after every tiny edit unless release verification is requested.
- When editing dirty files, preserve user changes and inspect diff first.

Key docs:

- Quran: `docs/QURAN_GPT_HANDOFF.md`
- Hadith: `docs/HADITH_DATA_PROVENANCE.md`
- Islamic KB: `docs/RAQAT_ISLAMIC_KNOWLEDGE_RAG.md`
- VPS API: `docs/VPS_PRODUCTION_PLATFORM_API.md`
- Testing: `docs/operations/testing.md`
- Product vision: `docs/product/vision.md`

---

[← docs/README.md](README.md) · [MAINTAINING.md](MAINTAINING.md) · [handoff/gpt-sre-summary.md](handoff/gpt-sre-summary.md)
