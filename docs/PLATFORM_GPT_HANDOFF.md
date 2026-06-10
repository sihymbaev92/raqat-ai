# RAQAT — толық платформа handoff (GPT / SRE / mobile)

**Күйі:** 2026-06-09. Бұл файл жаңа агентке Raqat жобасына тез кіру үшін арналған қысқа емес, жұмысқа жарайтын толық карта. Архивтік ұзын тарих бөлек: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](archive/PLATFORM_GPT_HANDOFF_2026-05.md).

**RAQAT / RAHAT OMIR** — қазақ тіліндегі исламдық mobile/web платформа: намаз уақыты, Құран және мұсаф, хатым, хадис, дұға, тәспі, құбыла, халал іздеу/скан, ҚМДБ/муфтият білім порталы, AI көмекші, дін мен дәстүр, шежіре, қажылық/құрбан айт бағыттары. Клиент — Expo React Native, backend — FastAPI Platform API, дерек қабаты SQLite/PG көшуге дайын, бот — aiogram.

**Қауіпсіздік:** `.env`, API кілттер, парольдер, service token, keystore құпиялары бұл құжатқа енгізілмейді. Құжатқа тек жолдар, командалар, архитектура және public endpoint-тер жазылады.

---

## 1. Жаңа сессияда бірінші оқылатын файлдар

| Рет | Файл | Неге керек |
|-----|------|------------|
| 1 | `docs/PLATFORM_GPT_HANDOFF.md` | Осы файл: platform + mobile + release карта |
| 2 | `docs/handoff/gpt-sre-summary.md` | Ops/API/mobile/AI қысқа индекс |
| 3 | `docs/operations/runbooks-index.md` | VPS, deploy, healthcheck runbook-тары |
| 4 | `docs/roadmap/priorities-p0-p2.md` | Басымдықтар және pending work |
| 5 | `docs/QURAN_GPT_HANDOFF.md` | Құран/мұсаф бөлек терең handoff |
| 6 | `docs/PRODUCTION_POSTURE.md` | Redis/PG/cache/production posture |
| 7 | `mobile/package.json` | Нақты Expo/RN version және scripts |

Қосымша навигация: [docs/README.md](README.md), [handoff/topic-index.md](handoff/topic-index.md), [handoff/section-map.md](handoff/section-map.md), [MAINTAINING.md](MAINTAINING.md).

---

## 2. Репозиторий картасы

| Қалта / файл | Рөлі |
|--------------|------|
| `mobile/` | Expo SDK 54 app: React Native 0.81, React 19, web export та осы жерден |
| `mobile/src/screens/` | Экрандар: dashboard, prayer, Quran, hadith, halal, AI, tradition, genealogy |
| `mobile/src/components/` | UI блоктар, Quran renderer, settings секциялары, dashboard карточкалары |
| `mobile/src/navigation/` | Root/Main/More stacks, deep linking, Android back behavior, Plausible pageview |
| `mobile/src/services/` | Notification, prayer, AI helpers, Plausible, bootstrap, bundled seed services |
| `mobile/src/api/` | Platform API, Halal Damu, prayer times, content API clients |
| `mobile/src/storage/` | AsyncStorage prefs/cache/history; prayer cache Android widget sync source |
| `mobile/src/quran/` | Mushaf layout, typography, audio, translation, page fit policy |
| `mobile/assets/bundled/` | Offline bundled Quran/hadith/dhikr/catalog data |
| `mobile/android/app/src/main/java/kz/raqat/app/` | Native Android widget, qibla service, azan fullscreen alarms |
| `platform_api/` | FastAPI Platform API; production entrypoint still centered on `main.py` |
| `platform_api/app/` | Modular v1 app layer; migration/parallel structure |
| `bot_main.py`, `handlers/`, `services/` | Telegram bot (aiogram 3) |
| `db/`, `global_clean.db` | SQLite data/migrations; PG cutover docs бар |
| `scripts/` | VPS deploy, web health, KB sync, data export/import helpers |
| `tests/` | Python API regression tests |
| `docs/` | Handoff, operations, roadmap, content provenance, release notes |

---

## 3. Mobile runtime stack

**Негізгі версиялар (`mobile/package.json`):**

- Expo `~54.0.35`
- React Native `0.81.5`
- React `19.1.0`
- `expo-av` `~16.0.8`, `expo-notifications` `~0.32.17`, `expo-location` `~19.0.8`
- React Navigation native-stack/bottom-tabs v6
- Web: `react-native-web` `^0.21.0`, `react-native-worklets` `^0.5.2`

**App bootstrap (`mobile/App.tsx`):**

- Ең бірінші hydrate: API override (`hydrateRaqatApiBaseOverride`), locale (`hydrateLocale`), brand font.
- Interaction кейін: Quran fonts, notification quick actions, Halal Damu prefetch, official news prefetch, bundled hadith seed.
- Native only: first-launch permissions, prayer notifications reschedule, background fetch, Android prayer widget sync.
- AppState active/background/inactive кезінде prayer cache self-heal + notification reschedule + widget sync.
- Screen orientation default portrait; Quran reader бөлек баптаумен landscape аша алады.
- `ScreenFitProvider` барлық app frame үшін compact/wide auto fit береді.
- `AppErrorBoundary` web stale bundle/chunk error болса `rv=` cache-busting reload жасайды және client error reporting жібереді.

**Config source:** canonical Expo config — `mobile/app.config.js`. `mobile/app.json` қайтармау керек, әйтпесе Expo doctor conflict береді.

---

## 4. Navigation және deep links

**Root stack (`mobile/src/navigation/RootNavigator.tsx`):**

- `Main`
- `AsmaAlHusna`
- `PrayerTimes`
- `PrayerAzan`
- `Qibla`
- `MoreStack`

**Main stack (`MainTabs.tsx`) табсыз stack ретінде жүреді:**

- `Home` → `DashboardScreen`
- `Articles` → official knowledge portal
- `PrayerTab` → prayer times
- `Saved`
- `Profile` → settings
- `Duas` stack
- `Tasbih` stack

**More stack (`MoreStack.tsx`) lazy screen split арқылы web initial bundle-ды жеңіл ұстайды. Негізгі маршруттар:**

- Quran: `QuranList`, `QuranSurah`, `QuranMushafBook`, `QuranSettings`, `Hatim`, `HatimSettings`
- Worship: `PrayerSettings`, `NamazGuide`, `TajweedGuide`, `Duas`, `Tasbih`
- Knowledge: `KmdbHub`, `OfficialKnowledgePortal`, `IslamicKbSearch`, `HadithHub`, `HadithList`, `HadithDetail`, scraped Muftyat hadith list/detail
- Services: `Halal`, `ZakatCalculator`, `Qibla`, `Ecosystem`
- Culture: `KazakhTradition`, topic/detail/articles/favorites/books, `KazakhGreatWords`
- Genealogy: `GenealogyClans`, `FamilyTree`
- Seasonal: `KurbanAit`, `Hajj`, `Seerah`
- AI: `ImamAI`

**Deep linking (`mobile/src/navigation/linking.ts`):**

- Prefixes: `imamai://`, `raqat://`, web origin.
- Key paths: `/more/quran`, `/more/surah/:surahNumber/:initialAyah?`, `/more/mushaf-book/:initialPage?`, `/prayer`, `/prayer-times`, `/azan`, `/qibla`.
- Native full-screen azan opens `imamai://azan?label=...&time=...&soundId=...&salatKey=...`.

---

## 5. Dashboard және негізгі UX

**Dashboard (`DashboardScreen.tsx`)** app-тың негізгі hub-ы. Онда:

- next prayer hero/card, compact prayer row, prayer tracker
- qibla hero/card and sensor context
- 12 service tile grid / launcher (`dashboardRadialItems.ts`)
- daily AI prompts/example chips
- Quran continue reading card
- Halal products rotator / Halal Damu blocks
- official/news/tradition/hadith/hajj promos

**12 басты модуль (`dashboardRadialItems.ts`):**

`quran`, `hadith`, `namaz`, `tajweed`, `seerah`, `hajj`, `tasbih`, `duas`, `asma`, `ai`, `halal`, `tradition`.

**Responsive policy:**

- `mobile/src/theme/screenFit.ts` computes `horizontalPadding`, `maxContentWidth`, `fontScale`.
- `ScreenFitScrollView` / `ScreenFitView` экрандарда double-padding болдырмай қолданылуы керек.
- Web-та content clamp және lazy chunks маңызды, heavy JSON static import қоспау керек.

---

## 6. Намаз, notification, azan, widget

### 6.1 Prayer data flow

- Prayer data API/cache: `mobile/src/api/prayerTimes.ts`, `mobile/src/storage/prayerCache.ts`.
- Self-heal: `mobile/src/services/prayerDaySelfHeal.ts`.
- Schedule slots: `mobile/src/services/prayerNotificationSchedule.ts`.
- Notification orchestration: `mobile/src/services/prayerNotifications.ts`.
- Settings UI: `PrayerSettingsScreen.tsx`, `SettingsPrayerNotificationsSection.tsx`.

### 6.2 Scheduled notifications

- 14 күнге дейінгі prayer slots жиналады, iOS pending notification limit үшін max `64`.
- Android channel per sound: `prayer_v12_${soundId}`. Channel sound immutable болғандықтан sound ауысса жаңа channel id.
- Per-salat mute: `prayerNotifMutedSalatKeys` (`fajr`, `dhuhr`, `asr`, `maghrib`, `isha`).
- Sunrise notification soundсыз/азансыз.
- Iftar extra Maghrib body-ге қосылады.

### 6.3 Full-screen azan (2026-06-09)

Пайдаланушы талабы: намаз уақыты кіргенде жай notification дыбысы емес, толық бет ашылып, азан толық ойнауы керек; керек болмаса қолданушы өзі тоқтатады.

Іске асуы:

- JS bridge: `mobile/src/services/prayerFullScreenAzan.ts`
- Screen: `mobile/src/screens/PrayerAzanScreen.tsx`
- Route: `PrayerAzan`, deep link path `azan`
- Native scheduler: `PrayerAzanAlarmScheduler.kt`
- Native receiver: `PrayerAzanAlarmReceiver.kt`
- Native module methods: `PrayerWidgetModule.scheduleFullScreenAzanAlarms`, `cancelFullScreenAzanAlarms`
- Manifest permission: `android.permission.USE_FULL_SCREEN_INTENT`
- Reboot restore: `PrayerWidgetBootReceiver.kt` calls `PrayerAzanAlarmScheduler.restore`
- `MainActivity.kt` sets show-when-locked / turn-screen-on only for azan deep link.

Behavior:

- Android: native `AlarmManager` schedules exact/full-screen alarm for salat slots with enabled adhan sound.
- Receiver posts high-priority alarm notification with `setFullScreenIntent`, opening `imamai://azan`.
- App open/in foreground: `fireInAppPrayerAlert` opens the same Azan screen and mutes notification sound to avoid double playback.
- `PrayerAzanScreen` plays selected bundled MP3 with `expo-av`.
- User button: `Азанды тоқтату`; otherwise playback finishes naturally.
- Latest tweak: `previewPrayerNotifSound.ts` starts volume at `0.15` and fades to full volume across ~12 seconds.

Important release caveat:

- Full-screen azan native code was compiled into APK/AAB on 2026-06-09.
- After that, fade-in JS change was made and **APK/AAB was not rebuilt**, because user explicitly said: “әр өзгеріске апк жинай берме мен айтам жинайтын кезде”.
- Сондықтан release алдында user “жина” десе ғана жаңа APK/AAB build жасау керек.

### 6.4 Android widgets / native services

Native files:

- `PrayerHomeStripWidgetProvider.kt`
- `BasePrayerRemoteWidgetProvider.kt`
- `PrayerWidgetViews.kt`
- `PrayerWidgetPayload.kt`, `PrayerWidgetTime.kt`, `PrayerWidgetRichText.kt`
- `PrayerWidgetAlarmScheduler.kt`, `PrayerWidgetTickReceiver.kt`, `PrayerWidgetBootReceiver.kt`
- `QiblaWidgetSensorService.kt`, `QiblaWidgetHelper.kt`
- `PrayerWidgetModule.kt`, `PrayerWidgetPackage.kt`

Current release stance:

- Only home strip widget XML should remain active: `prayer_home_strip_widget_info.xml`.
- Old widget provider XMLs were intentionally removed/blocked by release validator.
- Qibla sensor service is foreground service with `specialUse` subtype for widget compass updates.

---

## 7. Құран, хатым, мұсаф

Main files:

- Screens: `QuranListScreen.tsx`, `QuranSurahScreen.tsx`, `QuranMushafBookScreen.tsx`, `HatimScreen.tsx`, `HatimSettingsScreen.tsx`, `QuranSettingsScreen.tsx`
- Components: `components/quran/*`
- Logic: `mobile/src/quran/*`
- Fonts: `mobile/src/fonts/quranBookFonts.ts`, QCF4 loader, Arabic font presets
- Data: `mobile/assets/bundled/quran-*`, generated translations, page metadata

Rendering modes:

- QCF4 / Madinah-like page rendering
- Text Hafs / Unicode Turkish
- Muftyat “green ink” theme
- Raster/WebP/SVG fallback components
- Continuous Arabic block and per-ayah rendering

Recent stability fixes:

- `mushafBookFitPolicy.ts` centralizes one-page fit rules.
- Turkish Unicode and Muftyat green ink in book layout force one-page Arabic-only fit; transliteration/meaning layers are hidden for that mode.
- `mushafOnePageFitScale` adjusts dense pages and short viewports.
- `MushafBookPageScroll` has fallback notice if QCF4/raster asset fails.
- Web health smoke includes `/more/quran`, `/more/surah/1`, `/more/mushaf-book/1`.
- `AppErrorBoundary` handles stale web chunks that previously caused Quran routes to white-screen.

Read deeper: [QURAN_GPT_HANDOFF.md](QURAN_GPT_HANDOFF.md).

---

## 8. Halal Damu, halal scan, products

Client:

- API: `mobile/src/api/halalDamuWp.ts`
- Screen: `mobile/src/screens/HalalScreen.tsx`
- Components: `components/halal/*`, `HalalNearbyBlock.tsx`
- Seed data: `mobile/assets/bundled/halal-products-seed-kz.json`
- Docs: `docs/operations/halal-products-seed-kz.md`, `docs/operations/halaldamu-products-api-empty-2026-05.md`

Behavior:

- Direct `halaldamu.kz/wp-json` by default on web.
- Native uses Platform API proxy when API base is local/VPS or `EXPO_PUBLIC_HALAL_DAMU_USE_PROXY=1`.
- `EXPO_PUBLIC_HALAL_DAMU_DIRECT=1` forces direct mode.
- Proxy fallback: if platform proxy returns 404/502/503, client retries direct Halal Damu endpoint.
- Bulk company/product responses have extended timeout because Halal Damu JSON can be large.
- Product seed fills gap when official product API is empty.

Partnership docs/letters are in `docs/operations/halaldamu-*` and `kmdmb-*`.

---

## 9. AI, ҚМДБ/Муфтият knowledge, Platform API

Platform API key points:

| Purpose | Endpoint / file |
|---------|-----------------|
| Health | `GET /health` |
| Readiness | `GET /ready` |
| AI chat | `POST /api/v1/ai/chat` |
| KB status | `GET /api/v1/ai/kb/status` |
| Halal Damu proxy | `GET /api/v1/halal-damu/{path}` |
| Auth login | `POST /api/v1/auth/login` |
| Bot link code | `POST /api/v1/auth/link/code` |
| Quran/Hadith | `/api/v1/quran/*`, `/api/v1/hadith/*` |
| Client errors | `/api/v1/client/errors` |
| Metrics JSON | `/metrics/json` |

Mobile AI surfaces:

- `RaqatAIChatScreen.tsx`
- `RaqatKbStatusBar.tsx`
- `RaqatAiExampleChips.tsx`
- `IslamicKbSearchScreen.tsx`
- `OfficialKnowledgePortalScreen.tsx`
- `KmdbHubScreen.tsx`

Config:

- API base priority: `EXPO_PUBLIC_IMAM_AI_API_BASE`, `EXPO_PUBLIC_RAQAT_API_BASE`, `app.config.js extra.imamAiApiBase`, `extra.raqatApiBase`.
- Runtime override stored in AsyncStorage key `imam_ai_api_base_override_v1`.
- `isRaqatApiOnlyMode()` can disable external fallback sources.

Read deeper:

- [platform_api/overview.md](platform_api/overview.md)
- [platform_api/islamic-kb-rag.md](platform_api/islamic-kb-rag.md)
- [RAQAT_ISLAMIC_KNOWLEDGE_RAG.md](RAQAT_ISLAMIC_KNOWLEDGE_RAG.md)
- [VPS_PRODUCTION_PLATFORM_API.md](VPS_PRODUCTION_PLATFORM_API.md)

---

## 10. Hadith, duas, tasbih, asma, seerah

Hadith:

- Screens: `HadithHubScreen`, `HadithListScreen`, `HadithDetailScreen`, scraped Muftyat list/detail.
- Data: app-bundled compact seed `mobile/assets/bundled/hadith-from-db-seed.json`; generated/runtime full corpus `mobile/assets/bundled/hadith-from-db.json`; plus `hadith-sahih-seed.json`, `external-hadith-kk.json`, `extracted-hadith-muftyat.json`.
- Cross-link component: `components/hadith/HadithCrossLinkBar.tsx`.
- Export/quality scripts in `mobile/package.json`: `export:hadith-json`, `export:scraped-hadith-muftyat`, `extract:hadith-quotes`, `hadith:quality`, `hadith:normalize`.
- Provenance: [HADITH_DATA_PROVENANCE.md](HADITH_DATA_PROVENANCE.md).

Duas/Tasbih:

- `DuasStack`, `DuasScreen`, `TasbihStack`, `TasbihListScreen`, `TasbihCounterScreen`.
- Catalogs: `duasCatalog.ts`, `duasShortZikrCatalog.ts`, `dhikrChapters.ts`, bundled `dhikr-list.json`.

Asma/Seerah:

- `AsmaAlHusnaScreen`, `asmaChapters.ts`, `asmaTafsirKk.ts`.
- `SeerahScreen`, seerah assets/content banners.

---

## 11. Дін мен дәстүр, шежіре, қазақ контенті

Tradition:

- Screens: `KazakhTraditionScreen`, topic detail/articles/favorites/books, `OfficialFatuaBookScreen`, great words screens.
- Components: `TraditionRedesignCards`, `TraditionReligiousEvidenceSection`, `TraditionKazakhHeroBanner`, `TraditionCatalogShelfGrid`, `TraditionBookCard`, `TraditionTopicCard`, `TraditionAccordion`.
- Content: `traditionBooksCatalog.ts`, `traditionReligiousEvidence.ts`, `traditionTopicsCatalog.ts`, `officialBooksCatalog.ts`, `great-words-catalog.json`.

Genealogy:

- Screens: `GenealogyClansScreen`, `FamilyTreeScreen`.
- Components: `ClanPickerModal`, `GenealogyNotableCarousel`, `GenealogyPersonModal`.
- Data/builders: `db/shezhire_catalog_builder.py`, `db/shezhire_catalog_data.py`, `mobile/assets/bundled/genealogy-p0.json`.
- Backend/user schema touchpoints: `db/family_tree/repository.py`, `db/user_data_schema.py`, `db/genealogy_seed.py`, migrations.

Seasonal:

- `KurbanAitScreen`, `KurbanAitTraditionGuide`, `KurbanAitTopicsPanel`.
- Hajj/Talbiyah: `HajjMuftyatGuide`, `HajjTourAgenciesPanel`, `TalbiyahHeroBanner`, `hajjTourAgenciesCatalog.ts`, `talbiyahHeroContent.ts`.

---

## 12. i18n and offline language policy

Main files:

- `mobile/src/i18n/kk.ts` is baseline source tree.
- `mobile/src/i18n/runtime.ts` hydrates locale and applies offline patches.
- `mobile/assets/bundled/offline-auto-translations-core.json` supplies ru/en/ky offline UI translation.
- Builder: `mobile/scripts/build-offline-auto-translations.mjs`.

Current policy:

- User-facing app language selector only exposes full offline QA languages: `kk`, `ru`, `en`, `ky`.
- `uz/tr/ar/zh/fa/id/ms/hi/ku` may exist in types/storage, but should not be exposed until full bundle coverage + QA.
- Runtime must not call Google Translate/fetch for UI strings.
- For dynamic strings, prefer stable labels + variable count/time instead of translating template literals at runtime.

---

## 13. Web deploy and stale bundle safety

Current web is Expo export from `mobile/dist` served on `https://rahatomir.com`.

Deploy script:

```powershell
Set-Location d:\opt\raqat-ai
powershell -ExecutionPolicy Bypass -File scripts/vps_deploy_web.ps1
```

Skip build if `mobile/dist` already exported:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/vps_deploy_web.ps1 -SkipBuild
```

Deploy hardening:

- `scripts/vps_deploy_web.ps1` exports web, copies bundled JSON/Quran assets, generates `.raqat-web-js-manifest.txt`, uploads tar.gz, runs postdeploy, reloads nginx, then runs health check.
- `scripts/web-dist-postdeploy.sh` strips CRLF, validates manifest, prunes old JS not in manifest, ensures index-referenced JS exists, gzips AppEntry.
- `scripts/web-release-health.ps1` checks index, all `_expo/static/js/web/*.js` referenced by index, key Quran routes, and API `/health`.
- `AppErrorBoundary` catches chunk/stale function errors and reloads once with `?rv=timestamp`.

Known past incident:

- Quran/web white-screen occurred due to mixed new `index.html` + stale old JS chunks (`toEasternArabicIndic` / `mushafPageForSurahAyah is not a function`).
- Do not remove manifest-based pruning or web health check.

---

## 14. Android release/build rules

User instruction as of 2026-06-09:

**Do not build APK/AAB after every small change. Build only when user explicitly says to build.**

Useful commands when explicitly requested:

```powershell
Set-Location d:\opt\raqat-ai\mobile
npm run build:apk
npm run build:aab
npm run release:play:check
```

Release validator:

- `mobile/scripts/validate-play-release.ps1`
- Checks AAB exists, keystore path exists, manifest permissions, HTTPS-only network security, widget provider XML policy.
- Manifest must include `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` where relevant.

Last known builds:

- 2026-06-09 after full-screen azan native work:
  - APK `mobile/android/app/build/outputs/apk/release/app-release.apk`
  - SHA256 `a1c53806579936e1e710bc394ce7b5ecf5b61c2d4e199e099473f0ac5a3df30f`
  - AAB `mobile/android/app/build/outputs/bundle/release/app-release.aab`
  - SHA256 `97d82330521122232be9bc1abde8e407e6324a202403b8527e95e975775f2e12`
- Fade-in azan JS change happened after those builds; rebuild only on explicit request.

---

## 15. Local development commands

Mobile:

```powershell
Set-Location d:\opt\raqat-ai\mobile
npm install
npm run start
npm run web
npm run android
npm run android:emu
npm run android:live
```

Web export:

```powershell
Set-Location d:\opt\raqat-ai\mobile
npm run export:web:win
```

Platform API:

```powershell
Set-Location d:\opt\raqat-ai
.\scripts\run_platform_api.ps1 -Dev -FreePort
# health: http://127.0.0.1:8787/health
```

Python tests:

```powershell
Set-Location d:\opt\raqat-ai
.\.venv\Scripts\python.exe -m pytest tests -q
```

---

## 16. Test matrix

Mobile TypeScript:

```powershell
Set-Location d:\opt\raqat-ai\mobile
npm run lint
```

Mobile Jest:

```powershell
npm test
npm run test:full
```

Focused useful tests:

```powershell
npm test -- --runTestsByPath src/services/__tests__/prayerFullScreenAzan.test.ts --runInBand
npm test -- --runTestsByPath src/quran/__tests__/mushafBookFitPolicy.test.ts --runInBand
npm test -- --testPathPattern=qiblaArrow
```

Detox:

```powershell
npm run e2e:build:emu
npm run e2e:test:emu
```

Backend:

```powershell
Set-Location d:\opt\raqat-ai
.\.venv\Scripts\python.exe -m pytest tests/test_halal_damu_proxy.py -q
.\.venv\Scripts\python.exe -m pytest tests/test_content_and_bot_sync_api.py -q
```

After doc-only edits, no APK/AAB build is needed.

---

## 17. Current rough edges / risks to remember

1. Android full-screen intent behavior can vary by OEM/battery settings. QA on real Android device is required before Play release.
2. Azan fade-in is JS-side `expo-av`; scheduled Android notifications for full-screen salat alarms are routed through the silent/off channel so the full-screen screen playback remains the single “full azan” source.
3. Web deploy safety relies on manifest + health check. Do not bypass health unless debugging.
4. Heavy bundled JSON should stay runtime-loaded on web; static import can inflate `AppEntry`/`__common`.
5. Locale selector must not expose partial languages without full offline bundle coverage.
6. Halal Damu public API shape can change; client has fallback/direct/proxy logic, but QA search/map/products after deploy.
7. Many files are currently WIP/uncommitted. Do not revert user changes; inspect diff before editing touched files.

---

## 18. Common diagnostics

| Symptom | Likely cause | First action |
|---------|--------------|--------------|
| Web site white-screen | stale chunk / missing JS | run `scripts/web-release-health.ps1`, inspect client errors |
| Quran route fails on web | stale JS or missing Quran asset | check `/more/quran`, `/more/surah/1`, `/more/mushaf-book/1`, asset copy scripts |
| Android notification no sound | immutable notification channel | change channel id/version or reinstall app |
| Azan screen does not open | full-screen intent blocked / exact alarm permission | check Android notification + exact alarm settings, receiver logs |
| Widget stale | widget payload not synced | open app, call prayer refresh, check `PrayerWidgetModule.setPayload` path |
| Halal proxy 404 | VPS API older deploy | fallback direct should work; update platform API if proxy needed |
| AI no response | missing `GEMINI_API_KEY` / API base | check API `/health`, mobile API base, server env |
| Partial language | incomplete offline bundle | keep only `kk/ru/en/ky` exposed |
| Play check fails widget XML | old widget XML restored | keep only approved provider XML or update validator intentionally |

---

## 19. Documentation maintenance

- New facts should go into the relevant doc folder per [MAINTAINING.md](MAINTAINING.md), not the old May archive.
- Update this handoff when app architecture, release flow, native Android behavior, or critical production posture changes.
- For topic-specific long detail, link out instead of making this file a second archive.

Key topic docs:

- Quran: [QURAN_GPT_HANDOFF.md](QURAN_GPT_HANDOFF.md)
- Hadith: [HADITH_DATA_PROVENANCE.md](HADITH_DATA_PROVENANCE.md)
- Islamic KB: [RAQAT_ISLAMIC_KNOWLEDGE_RAG.md](RAQAT_ISLAMIC_KNOWLEDGE_RAG.md)
- VPS API: [VPS_PRODUCTION_PLATFORM_API.md](VPS_PRODUCTION_PLATFORM_API.md)
- Testing: [operations/testing.md](operations/testing.md)
- Product vision: [product/vision.md](product/vision.md)

---

[← docs/README.md](README.md) · [MAINTAINING.md](MAINTAINING.md) · [handoff/gpt-sre-summary.md](handoff/gpt-sre-summary.md)
