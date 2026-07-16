# RAHAT OMIR — толық таныстыру құжаты (Gemini үшін)

> **Мақсаты:** бұл құжатты Gemini-ге жіберіп, қолданбаның **сыртқы өнімін** (не істейді, кімге) және **ішкі құрылымын** (технология, экрандар, API, native, контент, билд) толық түсіндіру.  
> **Күні:** 2026-07-13 · **Нұсқа:** 1.1.0 (`versionCode` 10) · **Package:** `kz.raqat.app`

---

## 1. Бір сөйлеммен

**RAHAT OMIR** — Қазақстанға бағытталған исламдық серіктес қолданба: намаз уақыты + азан/виджет/құбыла, Құран/хатым/тәжуид, хадис, ҚМДБ/Fatua–Muftyat білім базасы + AI чат, халал, қазақ дін-дәстүр мазмұны. Backend: `https://api.rahatomir.com`, сайт/CDN: `https://rahatomir.com`.

---

## 2. Бренд және атаулар

| Контекст | Атау |
|----------|------|
| Экрандағы бренд / лаунчер | **RAHAT OMIR** |
| Дауыс / shortcuts | «Рахат өмір» |
| Package / npm / кей OEM мәтін | **RAQAT** (`kz.raqat.app`, `raqat-mobile`) |
| AI / білім бренді (KK UI) | **ҚМДБ** (Imam AI / KMDB hub) |
| Deep link | `raqat://`, `imamai://` |
| Донат / Telegram | `https://t.me/my_islamic_ai_bot` |

---

## 3. Өнім: пайдаланушы не көреді (сыртқы бет)

### 3.1 Кімге арналған
- Қазақстандағы мұсылмандар (қазақ тілі негізгі)
- Күнделікті намаз, Құран оқу, хадис, халал, дәстүр, қажылық/зекет құралдары керек адамдар
- Ресми/сенімді дереккөздерге (Muftyat, Fatua, Halal Damu) жақын мазмұн

### 3.2 Негізгі мүмкіндіктер

**Намаз және құбыла**
- Намаз уақыттары (қала / GPS)
- Азан еске salу (Android: exact alarm, толық экран, native ойнатқыш)
- Үй экраны виджеті (5 намаз + countdown + құбыла индикаторы)
- Құбыла компасы (сенсор + магниттік деклинация / native rotation vector)

**Құран**
- Сүре тізімі, сүре оқу
- Хатым / 604 беттік мұсаф (Madinah / QCF4 / текст Hafs)
- Тәжуид түстері, тәжуид нұсқаулығы
- Аудио (reciter CDN), белгілер, соңғы оқылған жер
- Альбом/портрет ориентациясы (reader)

**Хадис және білім**
- Хадис хабы / тізім / деталь
- Ресми білім порталы (Fatua + Muftyat)
- KB іздеу және мақала деталі
- ҚМДБ hub (мешіттер, ресми сайттар, embedded web)

**AI чат**
- `ImamAI` / Raqat AI чат — негізінен KB контекстінде (`raqatAiKbOnly: true`)

**Халал**
- Halal Damu интеграциясы, тексеру, карта/жақын, өнім seed
- Камера/галерея рұқсаты (жапсырма/құрам суреті)

**Ғибадат құралдары**
- Дұғалар (+ community dua / әмин)
- Тәспі
- Зекет калькуляторы
- Қажылық нұсқаулық (Muftyat guide)
- Қағба live (HLS / YouTube)

**Қазақ дін мен дәстүр**
- 30+ дәстүр тақырыбы (бата, бесік, асар, қонақ күту, …)
- Дінмен байланыс / ырым шегі / бата мәтіндері
- Ұлы сөздер, Абай, кітаптар
- Құрбан айт нұсқаулығы
- Сира (Пайғамбар өмірі)

**Басқа**
- Асма әл-Хусна
- Сақталғандар
- Баптаулар (тіл, тема, құбыла, азан, Құран)
- Онбординг / рұқсаттар қақпасы
- Ecosystem / Telegram info / iOS Siri help

### 3.3 Тілдер (UI)
Пайдаланушы таңдай алады: **kk** (негізгі), **ru**, **en**, **ky**, **uz**, **tr**, **ar** (RTL).  
Офлайн авто-аударма сөздігі бар; kk — source of truth.

### 3.4 UX құрылымы
Классикалық төменгі tab bar жоқ. Негізгі ағын:
1. **Басты (Dashboard)** — намаз жолағы, сервистер торы, жылдам кіру
2. **Мазмұн / More stack** — Құран, дәстүр, халал, AI, KB, т.б.
3. Жеке экрандар: намаз уақыты, құбыла, азан, баптаулар

---

## 4. Техникалық стек (ішкі)

| Қабат | Технология |
|-------|------------|
| Mobile | Expo ~54, React Native 0.81, React 19 |
| Навигация | React Navigation (native stack) |
| Сақтау | AsyncStorage, FileSystem cache |
| Android native | Kotlin (азан, виджет, құбыла сенсор) |
| Backend | FastAPI / platform API (`api.rahatomir.com`) |
| Auth | JWT (Google/Apple/телефон) |
| Билд | Gradle + Expo; EAS профильдері; slim release |

**Репозиторий:** `d:\opt\raqat-ai`  
**Мобиль код:** `mobile/`  
**Негізгі экрандар:** `mobile/src/screens/`  
**Навигация:** `mobile/src/navigation/`  
**Сервистер:** `mobile/src/services/`  
**Контент каталогтары:** `mobile/src/content/`  
**Android native:** `mobile/android/app/src/main/java/kz/raqat/app/`

---

## 5. Навигация картасы (қысқа)

### Root
- `Main` → басты стек
- `PrayerTimes`, `PrayerAzan`, `Qibla`, `AsmaAlHusna`, `MoreStack`

### Main
- `Home` (Dashboard)
- `Articles` / білім
- `PrayerTab`
- `Saved`
- `Profile` (Settings)
- `Duas`, `Tasbih` стектері

### MoreStack (мазмұн хабы)
ContentHub, KmdbHub, QuranList/Surah, Hatim, QuranMushafBook, HatimTajweed*, Seerah, Duas, CommunityDua, Halal, ImamAI, Hadith*, KazakhTradition*, GreatWords*, KurbanAit, Hajj, MakkahLive, ZakatCalculator, IslamicKbSearch, OfficialKnowledgePortal, Settings, PrayerSettings, QuranSettings, HatimSettings, Ecosystem, OfficialIslamicWeb, …

Толық типтер: `mobile/src/navigation/types.ts`.

---

## 6. Backend / желі

**Негізгі API:** `https://api.rahatomir.com`  
Клиент: `mobile/src/services/platformApiClient.ts`

Негізгі топтар (`/api/v1/`):
- Health / info / content stats
- Quran (сүре, аят, іздеу)
- Hadith
- AI chat / image analyze / KB browse-search
- Auth (OAuth, phone, refresh)
- Sync (hatim, last-read, bookmarks, markers)
- Community duas

**Басқа дереккөздер**
- Намаз: Muftyat → Aladhan fallback (`mobile/src/api/prayerTimes.ts`)
- Халал: Halal Damu WP (`halaldamu.kz`)
- Құран аудио CDN: `cdn.islamic.network`
- Bundled JSON CDN: `https://rahatomir.com/assets/bundled`
- Mushaf assets: `https://rahatomir.com/assets/quran`
- Қағба live: HLS / YouTube конфигтері

---

## 7. Android native ерекшеліктер

**Азан**
- Exact alarm жоспарлау, Boot restore
- Full-screen delivery + foreground service (`mediaPlayback`)
- Native MP3 ойнатқыш + азаннан кейінгі дұға
- OEM батарея шектеуі бойынша нұсқаулық

**Виджет**
- Home strip: 5 намаз, countdown, құбыла
- Фонда сенсор сервисі (құбыла стрелкасы)

**Құбыла**
- `QiblaDeviceHeadingWatcher` — rotation vector / accel+mag
- GeomagneticField деклинация (WMM)
- Жазық/тік ұстау үшін coordinate remap
- JS fallback: Expo Location / Magnetometer

**Рұқсаттар**
- Location (құбыла, намаз)
- Notifications, exact alarm, full-screen intent
- Camera/photos (халал)

---

## 8. Контент және офлайн

### APK ішінде / бандл
- Құран араб (Hatim pack: uthmani және т.б.)
- Қазақ мағына seed, хадис каталогы
- Дұға / тәспі / асма / дәстүр TS каталогтары
- Азан дыбыстары
- Тәжуид әріп аудиолары
- UI kk + offline translation dictionary (release-те CDN-ға шығарылуы мүмкін)

### Release slim (үлкен файлдар APK-дан шығарылады)
Шамамен stash/strip:
- QCF4 қаріптері (~90+ MB)
- `offline-auto-translations-core.json` (~36 MB)
- `quran-translations-offline.json` (~18 MB)
- Хадис seed / great-words / halal snapshot және т.б.

Олар runtime-да `rahatomir.com` CDN + FileSystem кэш арқылы жүктеледі.

**Маңызды:** Debug APK ~**120+ MB** (толық). Release slim APK әдетте әлдеқайда кіші (~20–40 MB шамасы, нақты билдге байланысты). Play үшін **AAB** ұсынылады.

---

## 9. Негізгі экрандар (файл атаулары)

| Сала | Screen файлдары |
|------|-----------------|
| Басты | `DashboardScreen.tsx` |
| Намаз | `PrayerTimesScreen`, `PrayerAzanScreen`, `PrayerSettingsScreen` |
| Құбыла | `QiblaScreen` |
| Құран | `QuranListScreen`, `QuranSurahScreen`, `HatimScreen`, `QuranMushafBookScreen`, `HatimTajweed*` |
| Хадис/KB/AI | `Hadith*`, `OfficialKnowledgePortalScreen`, `IslamicKbSearchScreen`, `KbArticleDetailScreen`, `RaqatAIChatScreen`, `KmdbHubScreen` |
| Халал | `HalalScreen`, `MosquesNearbyScreen` |
| Дәстүр | `KazakhTradition*`, `KazakhGreatWords*`, `KurbanAitScreen`, `SeerahScreen` |
| Құралдар | `DuasScreen`, `Tasbih*`, `ZakatCalculatorScreen`, `HajjGuide` / Hajj, `MakkahLiveScreen` |
| Жүйе | `SettingsScreen`, `OnboardingIntroScreen`, `LanguagePickScreen`, `CorePermissionsGateScreen` |

---

## 10. Билд / шығару

```text
mobile/
  npm run build:apk:debug   → толық debug APK (үлкен)
  npm run build:apk         → release APK + slim stash
  npm run build:aab         → Play Store AAB + slim
  npm run eas:apk / eas:ios → EAS cloud builds
```

Release алдында:
- Slim: `apk-slim-assets.sh` + `strip-apk-remote-assets.cjs`
- Signing: `android/keystore.properties`
- Production: HTTPS-only
- QA скрипттер: `qa:android:release`, `qa:azan:locked`

---

## 11. Архитектура схемасы (логикалық)

```text
[Пайдаланушы телефоны]
    │
    ├─ React Native UI (Expo)
    │     ├─ Dashboard / MoreStack / Quran / Tradition / Halal / AI
    │     └─ JS сервистер (prefs, cache, API client, qibla math)
    │
    ├─ Android Kotlin native
    │     ├─ Azan alarms + FGS + player
    │     ├─ Home widget
    │     └─ Qibla sensors / GeomagneticField
    │
    └─ Желі
          ├─ api.rahatomir.com  (AI, KB, auth, sync, quran/hadith API)
          ├─ rahatomir.com/assets  (CDN packs, mushaf)
          ├─ Muftyat / Aladhan     (намаз)
          └─ Halal Damu / official sites (WebView + proxy)
```

---

## 12. Gemini-ге арналған қысқа нұсқау

Осы құжатты оқығанда:
1. Өнімді **RAHAT OMIR** деп ата (қажет болса RAQAT — техникалық package).
2. Бұл **Қазақстанға** бағытталған толық исламдық супер-қолданба (намаз + Құран + білім + халал + дәстүр).
3. AI — **ҚМДБ/KB** контекстіндегі көмекші, жалпы ChatGPT клоны емес.
4. Debug APK үлкен; **release slim** + CDN — шығару стратегиясы.
5. Код негізі: `mobile/src`, native: `mobile/android/.../kz/raqat/app`.

Қосымша сұрақтарға жауап беру үшін: экран атын, API endpoint тобын немесе native класс атын сұраңыз — репозиторийде тиісті файлдар жоғарыда көрсетілген жолдарда.

---

## 13. Қазіргі өнімдік ерекшеліктер (2026 жаз)

- Құбыла: native heading + WMM деклинация + тік/жазық remap
- Хатым мұсаф: альбомда толық енге жайылу (portrait-ен stale layout түзетуі)
- Дін мен дәстүр → «Бата беру»: толық бата мәтіндері тізімі
- Азан: native delivery + дұға аудио
- Тәжуид: офлайн JSON + түстер + әріп аудио
- Slim release: QCF4/fonts және үлкен JSON CDN-ға

---

*Құжат автоматты түрде код базасынан жиналған өнім+тех брифинг. Толық PRD емес — Gemini контекстіне арналған толық таныстыру.*
