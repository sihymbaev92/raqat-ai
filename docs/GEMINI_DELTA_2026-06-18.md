# RAQAT — соңғы өзгерістер delta (Gemini бағалауға)

**Күні:** 2026-06-18  
**Нұсқа:** mobile v1.1.0 (versionCode 10)  
**Git:** ~352 файл өзгерген (uncommitted), соңғы commit: `3ab7ef1 Polish Kazakh tradition hub`

## Verification snapshot (жергілікті)

| Тексеру | Нәтиже |
|---------|--------|
| Jest | **152 suites / 648 tests** — PASS |
| `npm run build:apk:debug` | PASS — 146 MB APK |
| `npm run release:play:check -SkipGitHygiene` | PASS (keystore, manifest, HTTPS-only network) |
| Release AAB | 120.17 MB (local artifact) |
| Device adb | Телефон уақытша қосылмаған — locked-screen azan QA күтуде |

---

## 1. Азан + рұқсаттар (Android P0)

### Мәселе
Пайдаланушылар баптауға кіріп exact alarm / full-screen intent бермей жүрді; азан locked экранда сенімсіз жұмыс істеді.

### Шешім
- **`prayerAzanPermissions.ts`** (жаңа): автоматты рұқсат оркестрациясы — хабарлама диалогы, native `requestExactAlarmPermissionIfNeeded`, `requestFullScreenIntentPermissionIfNeeded`, 10 сек cooldown, қайта кіруде қайта сұрау.
- **`firstLaunchPermissions.ts`**: алғаш ашылғанда `ensurePrayerAzanPermissions()` шақырылады.
- **`App.tsx`**: `active` күйінде `ensurePrayerAzanPermissionsOnAppActive()`.
- **`usePrayerSettingsSchedule.ts`**: намаз хабарламасын қосқанда толық рұқсат ағыны.
- **`prayerNotifications.ts`**: native schedule 0 болса Expo fallback; `openAndroidExactAlarmSettings` native intent; diagnostics.
- **`PrayerAzanAlarmScheduler.kt`**: `setAlarmClock` exact рұқсат барда; жоқта `setAndAllowWhileIdle` fallback; `SecurityException` ұстау; QA test alarm.
- **`PrayerAzanAlarmReceiver.kt`**: `goAsync()`, native audio + full-screen notification.
- **Тесттер**: `prayerAzanPermissions.test.ts`, `prayerNotificationsFallback.test.ts`, `prayerFullScreenAzan.test.ts` (dynamic import fix).

### Қалған тәуекел
- Samsung/Xiaomi battery optimization — Play сыртында, пайдаланушы шағымы мүмкін.
- Locked-screen azan — нақты prayer time QA аяқталмаған.

---

## 2. Halal Damu + QMDB WebView

- **`OfficialSiteFullWebView.tsx`**: `halaldamu.kz`, `muftyat.kz` ресми сайттар in-app.
- Cache bust, `LOAD_NO_CACHE`, service worker purge, native `clearOfficialSiteWebCache()`.
- Pull-to-refresh, hardware back, link filtering (YouTube/social сыртқа).
- QA: deep link жұмыс істейді; Halal dashboard tile adb tap сенімсіз; SPA BACK кейде экраннан шығады.

---

## 3. Play release hardening

- **`network_security_config.xml`**: release — HTTPS-only (`cleartext=false` only).
- **`src/debug/res/xml/network_security_config.xml`**: dev LAN IP cleartext тек debug variant-та.
- Play validator cleartext blocker түзетілді.

---

## 4. Басқа маңызды өзгерістер (қысқа)

- Dashboard hero/assets, tajweed QCF4, branding/logo refresh.
- PostgreSQL schema (`db/postgresql_schema.py`), halal seed data.
- Genealogy scripts/tests көптегені жойылған/қайта құрылған (scope кішірейту?).
- ~100+ QA screenshot PNG (`mobile/qa-*.png`) — git hygiene risk.
- Religious content review packet (`docs/operations/religious-content-review-packet-2026-06.md`) — scholar sign-off ашық.

---

## 5. Release gate күйі

| Gate | Күй |
|------|-----|
| Play Internal Testing upload | AAB дайын, Console жүктеу күтуде |
| Data Safety / Privacy form | Толтырылмаған |
| iOS App Store | iOS native жоқ |
| Scholar religious sign-off | Ашық |
| Locked-phone azan QA | Күтуде |
| Git clean handoff | ~352 uncommitted файл |

---

## 6. Gemini-ге нақты сұрақ

Осы delta-ны `docs/GEMINI_PLATFORM_EVALUATION_FULL.md` контекстімен бірге бағала:

1. Азан + рұқсат өзгерістері release blocker-ді шешті ме?
2. Play Store-ға шығуға Go / No-Go / Conditional Go?
3. Weaknesses тізімін жаңарту (P0/P1/P2).
4. Halal/QMDB WebView тәуекелі қабылданарлық па?
5. Келесі 5 нақты қадам (иесі + estimate).

Жауап тілі: **қазақша**. Формат: Executive summary → Strengths → Weaknesses → Risks → P0/P1/P2 → Release verdict.
