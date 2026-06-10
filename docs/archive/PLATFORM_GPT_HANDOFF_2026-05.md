# RAQAT — толық платформа брифі (GPT / сыртқы талдау үшін)

Бұл құжатты басқа модельге немесе серіктеске **бірден жіберуге** болады: веб, мобильді, Telegram бот, `platform_api`, SQLite, скрипттер мен қауіпсіздік моделі. **`.env` құпиялары осы мәтінге енгізілмейді.**

**Құжат қалай оқылады (таңдаулы):**

- **§1** — өнім мақсаты, **адамға жеңіл · оңай · керек** ұстанымы, **§1.0** бәсекелес идеялар кестесі.  
- **§2–§21** — репо құрылымы, бот, `platform_api`, мобильді жинақ (**§6**), тесттер (**§11**), қауіпсіздік, миграцияларға дейінгі негізгі бриф.  
- **§22–§24** — GPT/SRE үшін жинақ нұсқау; **§24.0** (фазалар **§33–§38** индексі), **§24.0.1** (Windows PowerShell, GitHub Actions).  
- **§25–§32, §39–§45** — мобильді өзгерістер **хронологиясы** (Expo SDK **54**, мұсаф, хатым, Хафс 604; **§39** — Jest/APK, Android намаз виджеттері, Halal файл күйі, VPS API құжаты (**§39.1–§39.4**), WIP ескерту (**§39.5**), **2026-05-15** қосымшалары: «Дін мен дәстүр» экран құрылымы + kk (**§39.6**), Expo web / Metro asset (**§39.7**), `AppState` `inactive` (**§39.8**); **§42** — **2026-05-16**: Құрбан айт нұсқаулығы, құбыла оюлы иін, басты бет шапкасы, ислам KB RAG; **§43** — **2026-05-17 — 2026-05-19**: KB-only AI (Fatua/Muftyat), Halal Damu клиент түзетулері, products API бос, Hajj екі баған, Gemini/VPS, release APK; **§44** — **2026-05-20 — 2026-05-24**: Device QA, FlashList B2, hook split, prod AI auth, VPS cron smoke, Hatim sync QA, dashboard header; **§45** — **2026-05-24 — 2026-05-25**: **GENEALOGY-P0/A1** — қазақ шежіресі (14 node), API, bundled offline, `GenealogyClansScreen`, A1 PG graph engine lock; **§40** — PG алдындағы қабат, `QuranSurahScreen` hook-тар, AsyncStorage; **§41** — P0/P1/P2 priority матрицасы).  
- **§27, §28, §29, §31, §33–§38, §40–§41** — тәуекел, жоспар, спринт deliverable-тер, Feature-Sliced ұсыныс, өнім жол картасы, **стратегиялық техника қарызы** (**§40**), **басымдық матрица** (**§41**). **Ескерту:** файл ішінде **§31** мәтіні **§32**-ден кейін орналасуы мүмкін — нөмір **хронологиялық файл ретімен** сәйкес келмейді; сілтемелер мазмұн бойынша дұрыс.

**Соңғы жинақ (бір сессияда жеткілікті минимум):** **§22** (ops / API / мобильді UI) → **§23** (SQLite auth, 012–014) → **§24** (сілтеме картасы; **өнім жолы — §24.0** индекс кестесі) → **§41** (P0/P1/P2 басымдық) → мобильді бекітулер **§26–§32** + **§39** (tooling / виджет / Halal; қажет болса **§39.6–39.8**: дәстүр экраны, web asset, AppState) + **§42** (Құрбан айт, құбыла иін, шапка, ислам KB) + **§43** (KB-only AI, Halal Damu клиент, products API, Hajj layout, APK) + **§44** (Device QA, FlashList/hooks, prod hardening, Hatim sync) + **§45** (шежіре P0/A1, API, mobile bundled) + мұсаф sprint **§29** + тәуекел **§27** + **§40** (PG / экран бөлу / локалды state) + қалта жоспары **§31** → өнім фазалары **§33–§38** (мазмұны төмен, **тізбекті шолу — §24.0**). Өндіріс: **`docs/PRODUCTION_POSTURE.md`**. Қысқаша оқу: §22–§24 (**§24.0** міндетті емес, бірақ жол картасы үшін ыңғайлы) + **§41** + §26–§32 + **§39** + **§42** + **§43** + **§44** + **§45** + **§40** + қажет §29/§31; өнім ұстанымы мен бәсеке: **§1** (**§1.0**, **§38**); **Windows / pytest / GitHub Actions** — **§24.0.1**.

---

## 25. Mobile update (2026-04-20) — Halal/Barcode/Qibla/UI + APK

Бұл бөлім **2026-04-20 сәтіндегі** мобильді өзгерістерді бір жерге жинайды. GPT/әзірлеушіге жаңа контекст керек болса, **осы §25 + §6 + §22** жеткілікті.

**Актуалдылық (2026-05):** төмендегі **25.1–25.2** кестелерінде аталған кей файлдар кейінгі PR-ларда **реподан алынған** немесе **басқа жолға ауыстырылған** болуы мүмкін (мысалы штрихкод/Open Food Facts стегі). **2026-05-13** нақты күй: **§39.3** (E-code база / eski сканер модал жойылған; камера модалы атауы өзгерген). **2026-05-15:** «Дін мен дәстүр» экран құрылымы — **§39.6**. Қазіргі халал экран мен конфиг: `mobile/src/screens/HalalScreen.tsx`, `mobile/src/config/halalDamuUrl.ts`, `mobile/src/api/halalDamuWp.ts`. Нақты ағаш үшін `git log` / іздеу; жинақталған ескерту — **§30.4**, **§39**.

### 25.1 Halal: E-code база және AI prompt толықтыру

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/content/halalEcodeDb.ts` | Жаңа E-code анықтама базасы (`HALAL_ECODE_ENTRIES`), `findEcodesInText`, `formatEcodeAppendixForPrompt`, `halalEcodeEntriesSorted` |
| `mobile/src/content/halalAiPrompts.ts` | `buildHalalTextPrompt` ішінде мәтіннен табылған E-code-тарға қосымша анықтама блогы автоматты қосылады |
| `mobile/src/screens/HalalScreen.tsx` | E-code glossary UI (scroll + row styles), қолданушыға базаны экранда көрсету |

### 25.2 Barcode smart flow (Open Food Facts)

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/services/barcodeNormalize.ts` | QR/OFF URL-дан код алу; GTIN/UPC candidate генерациясы (`barcodeLookupCandidates`) |
| `mobile/src/services/openFoodFacts.ts` | `fetchProductByBarcodeSmart`: бірнеше candidate-пен іздеу; host fallback (`world.openfoodfacts.org` + `openfoodfacts.org`), retry/backoff |
| `mobile/src/components/HalalBarcodeScannerModal.tsx` | OFF product URL және цифрлық кодтарды smart қабылдау |
| `mobile/src/i18n/kk.ts` | Штрихкод hint мәтіні: UPC/EAN/GTIN және көп-нұсқалы lookup туралы түсіндірме |

### 25.3 Qibla жылдам/дәл қозғалыс тюнингі

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/context/QiblaSensorContext.tsx` | Магнитометр update интервалы `80ms -> 16ms`; emit фильтрі агрессивті; EMA alpha реакция үшін көтерілді |
| `mobile/src/components/QiblaArrowPointer.tsx` | Arrow spring параметрлері жылдамдатылды (`tension` өсірілді, `friction` азайды) |

Нәтиже: стрелка қозғалысы әлдеқайда жылдам және кідірісі аз.

**Жаңарту (§42.2):** қазақы оюлы **PNG иін** (`mobile/assets/qibla/qibla-arrow-ornament.png`, `ornamentArrow` проп) — барлық құбыла көріністерінде; бұру геометриясы `mobile/src/lib/qiblaArrowGeometry.ts` (`QIBLA_ORNAMENT_ASSET_TIP_DEG`, `QIBLA_ORNAMENT_IMAGE_ALIGN_DEG`); тест: `mobile/src/lib/__tests__/qiblaArrowGeometry.test.ts`.

### 25.4 UI өзгерістер (Dashboard / Tabs / Seerah)

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/navigation/MainTabBar.tsx` | Төменгі таб төмен түсірілді және ықшамдалды (icon/label/padding азайтылды) |
| `mobile/src/screens/DashboardScreen.tsx` | (2026-04) Header құбыла белгісі; (2026-05 **§32.5**) **ортада құбыла** батырмасы (`headerTitle`), **сол жақта** күн/ауа райы + кіші RAQAT; тор тайлдарында **`hideTitles` жоқ** — тақырып/субтитр қайта көрінеді; `Halal/AI` қатар иконкалары кішірейтілген күй сақталуы мүмкін |
| `mobile/src/screens/SeerahScreen.tsx` | Сира ішіндегі lesson card суреттері алынды (мәтін-only карточкалар) |

### 25.5 Тесттер және build күйі

| Тексеру | Нәтиже |
|---------|--------|
| `npm run lint` (`mobile`) | OK (`tsc --noEmit`) |
| `npx jest --ci` (`mobile/`) | **2026-05-25:** **375/375 PASS** (preflight subset **85**); **+2** genealogy bundled (**§45.5**). **2026-05-24:** **375/375 PASS**. **2026-05-13:** **35 suite / 128 test**. **`npm run test:full`** = `lint` + `jest --ci`. AsyncStorage mock — **§39.1**. |
| `pytest tests` (репо түбі, `.venv`) | **2026-05-25:** genealogy **11 PASS** (**§45.5**). **2026-05-11** тексеру: **112 passed, 1 skipped** (~3 мин). |
| Қосылған unit tests (2026-04 контекст) | `barcodeNormalize`, `openFoodFacts` тесттері — файлдар репода болса; **`halalEcodeDb`** тесттері файл жойылған соң **§30.4 / §39**. |
| APK build (release) | `npm run build:apk` — **BUILD SUCCESSFUL** (жол төмен) |
| APK build (debug) | `npm run build:apk:debug` — шығыс: `mobile/android/app/build/outputs/apk/debug/app-debug.apk` (**§32.7**, **§39.1**) |
| APK жолы (release) | `mobile/android/app/build/outputs/apk/release/app-release.apk` |

### 25.6 Қысқа next steps

1. Реал құрылғыда Qibla sensor calibration UX (fast vs stable toggle) қосу.  
2. OFF rate-limit (`429`) үшін adaptive backoff + telemetry өрісін қосу.  
3. Halal E-code базасын JSON/remote config-ке шығарып, кодсыз жаңарту арнасын ашу (**§39.3:** бұрынғы `halalEcodeDb.ts` репода жоқ; қайта енгізу немесе басқа көз жоспарлау).

## 26. Mobile update (2026-05-09) — Хатым кітап UI, Құран экран бағыты, мұсаф араб тығыздығы

Бұл бөлім **мобильді** соңғы UX/типография жұмыстарын бекітеді (Expo SDK 54). Платформа API өзгерісі **қажет емес**; натив қайта жинау: `orientation` / `MainActivity` өзгерген соң **толық Android build** (`expo run:android` немесе APK скрипті).

### 26.1 Хатым (`Hatim`) — мұсаф кітап хромы

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/screens/HatimScreen.tsx` | Сүре тізімі **кітап үстелі** (`#EBE4D4`) + **бет** (`#FDF6E9`) ішінде: көлеңке, жиек, қараңғы темада `#0D0C0B` / `#161513` палитрасы; прогресс карточкасы мен жолдар «қағаз» бетіне сәйкес surface түстері |
| `mobile/src/navigation/MoreStack.tsx` | `Hatim` экраны: `headerStyle` / `contentStyle` жарық режимде үстел түсі; `headerTintColor` / `headerTitleStyle` — `#5C4D3D` (мәтін кітап сиясында) |

Хатымнан сүреге өту бұрынғыдай: `QuranSurah` с `mushafLayout: true`.

**Жаңарту (§32.4):** 30 джуз торы әрқашан ашық; джуз басу — `FlatList` ішінде скролл; орнамент `KazakhOrnamentBand` (`stripOnly` / `hatimOrnamentTop`).

### 26.2 Құран сүре оқу: экранды бұру (портрет / ландшафт)

| Файл | Өзгеріс |
|------|---------|
| `mobile/package.json` | Тәуелділік: **`expo-screen-orientation`** (~SDK 54 үйлесімді нұсқа) |
| `mobile/app.json` | `"orientation": "default"` — натив деңгейде бұруға жол; әдепкі қолданба портреті JS арқылы бекітіледі |
| `mobile/android/app/src/main/AndroidManifest.xml` | `MainActivity` үшін қатты **`android:screenOrientation="portrait"`** алынып тасталды (ландшафт `setRequestedOrientation` / expo модулімен жұмыс істеу үшін) |
| `mobile/App.tsx` | `bootReady` кейін **`ScreenOrientation.lockAsync(PORTRAIT_UP)`** — Құраннан тыс экрандар әдепкі тік |
| `mobile/src/screens/QuranSurahScreen.tsx` | **`useFocusEffect`**: оқу экранында баптауға қарай `unlockAsync()` немесе портрет құлыбы; шыққанда портретке қайта бекіту; **`InteractionManager.runAfterInteractions`** + blur кезінде pending callback **`cancel`**; Android-та шығу cleanup-інде **қосарланған** `PORTRAIT_UP` (~60 ms аралық). AsyncStorage: **`quran_reader_allow_rotation_v1`** (`1` = ландшафтқа рұқсат) |
| `mobile/src/i18n/kk.ts` | `quran.readerAllowRotationLabel` / `readerAllowRotationHint` (қазақша түсіндірме: жатық оқу үшін өшік ұсынылады) |

**Ескерту:** iOS үшін `prebuild` кейін `Info.plist` бағыттары `app.json`-мен үйлесуін тексеру керек.

### 26.3 Мушаф (`mushafLayout`) — араб мәтінін тығыздау

Барлығы **`QuranSurahScreen.tsx`** ішіндегі `makeStyles` / mushaf константалары: аят арабының **`letterSpacing: 0`**, жол биіктігі множителінің азайтылуы (`mushafArabLineHeight`), қаріп өлшемі коэффициенті (`mushafArabSize`), **`mushafAyahArabicCluster` gap** (маркер ↔ мәтін), **`mushafAyahRow`** төменгі/ішкі padding, **`mushafListPad`** горизонталь padding, сүре тақырыбы арабы (`mushafSurahTitleAr` fontSize/lineHeight), бисмилля баннері (`mushafBismillahBanner` padding + `mushafBismillahBannerTxt` lineHeight/fontSize), аят маркері сақинасының өлшемі.

Мақсаты: хатымнан ашылатын мұсаф оқуда **әріп пен жол арасы ашық тұрмау**.

### 26.4 Git commit (қысқа)

| Элемент | Мазмұны |
|---------|--------|
| Commit | **`a6d447f`** — хабарлама: `mobile: hatim book chrome, Quran rotation toggle, mushaf spacing` |
| Файлдар (9) | `App.tsx`, `app.json`, `AndroidManifest.xml`, `package.json`, `package-lock.json`, `QuranSurahScreen.tsx`, `HatimScreen.tsx`, `MoreStack.tsx`, `kk.ts` |
| Ескерту | `QuranSurahScreen.tsx` / `kk.ts` diff үлкен болуы мүмкін — сол commitке **басқа WIP өзгерістері** де кірген болса; кейінгі PR-да тармақтау ұсынылады |

### 26.5 Тексеру

| Тексеру | Нәтиже (сұрау бойынша) |
|---------|-------------------------|
| `npm run lint` (`mobile/`) | `tsc --noEmit` OK |

### 26.6 Қысқа next steps

1. Реал құрылғыда мұсаф оқу: бисмилля/ұзын аяттарда жол қиылысуын тексеру; **аят арабы** үшін динамикалық `lineHeight` §26.7.3-те қосылған; қажет болса `mushafBismillahBannerTxt` lineHeight множителін **1.0**-ға жақындату (баннер бөлек).  
2. Хатым тізімінде қосымша орнамент (мысалы `KazakhOrnamentBand`) — өнім шешімі бойынша.  
3. `expo prebuild` кейін Android manifest бағыт өрістерін қайта валидациялау.  
4. **Samsung / Xiaomi** құрылғыларында Құран экраны: landscape ↔ portrait циклінде layout және жад (orientation settle тесті).

### 26.7 Mobile (2026-05-11) — Құран: аудио скролл, мұсаф аят `lineHeight`, last read толықтыру

Бұл бөлім **жақында аяқталған** мобильді жұмысты бекітеді (Expo, `mobile/`). Платформа API өзгерісі **қажет емес**; дерек тек **жергілікті AsyncStorage**.

#### 26.7.1 Аудио ойнатқанда аятқа скролл (`QuranSurahScreen.tsx`)

- Триггер: `ayahAudioIsPlaying === true` және `playingAyahInSurah` орнатылғанда.
- Тік тізім (`FlatList` `listRef`): `scrollToIndex({ index, animated: true, viewPosition: 0.35 })`.
- Мұсаф **бет режимі** (`mushafLayout` + `readerNavMode === "page"`): `horizontalListRef.scrollToIndex({ index: pageIdx, …, viewPosition: 0.45 })`, мұнда `pageIdx = floor(ayahIndex / MUSHAF_AYAHS_PER_PAGE)` (`MUSHAF_AYAHS_PER_PAGE` — `mobile/src/config/mushafConfig.ts`).
- **Қайталауды шектеу:** `lastAudioScrollRef` — бір ойнату циклінде сол аятқа қайта-қайта скролл жібермейді; **пауза** кезінде ref тазаланады (қайта ойнатуға жол).
- **Сүре ауыстырғанда** `lastAudioScrollRef` тазаланады.

#### 26.7.2 `scrollToIndex` сенімділігі (аудио жолы + FlatList fallback)

**Аудиоға байланысты скролл:** `requestAnimationFrame` ішінде бірінші `scrollToIndex`, содан кейін **160 ms** және **400 ms** қайталаулар (layout дайын болмаған жағдай). Бет режимінде қосымша **520 ms** кейін `scrollToOffset({ offset: pageIdx * mushafPageWidth })` (`mushafPageWidth` — `useMemo`, бет ені).

**FlatList `onScrollToIndexFailed`:**

- **Горизонтальды мұсаф pager:** 350 ms кейін `scrollToOffset(info.index * mushafPageWidth)` (индекс жолы сенімсіз болғанда бет офсеті).
- **Тік тізім:** 350 ms кейін `scrollToIndex` (`viewPosition: 0.35`); **700 ms** кейін `scrollToOffset` — `averageItemLength` немесе ~180 px қадам (fallback).

#### 26.7.3 Ұзын аят — динамикалық `lineHeight` (мұсаф аят арабы)

- Файл: **`mobile/src/quran/mushafAyahArabicLineHeight.ts`** — `mushafArabicLineHeightForAyah(baseLineHeight, arabicPlain)`.
- Логика: бос орындарсыз ұзындық бойынша көбейткіштер (1.04 … 1.16 порогтармен); тәжуид тегтері есепке алынбайды — ұзындық үшін қарапайым Uthmani `item.text`.
- Қолдану: **`mobile/src/components/quran/MushafAyah.tsx`** (мұсаф аят жолы) ішінде `TajweedColoredArabicText` және қарапайым `Text`; `QuranSurahScreen` `renderMushafAyahItem` арқылы осы компонентті шақырады.
- Тест: **`mobile/src/quran/__tests__/mushafAyahArabicLineHeight.test.ts`**.

#### 26.7.4 Соңғы оқу орны (last read) — сақтау, blur, тізім UI

**Сақтау (`mobile/src/storage/quranLastRead.ts`):**

- Кілттер: `quran_last_read_enabled_v1` (`"1"` / `"0"`; **жоқ = әдепкі қосулы**), `quran_last_read_state_v1` (JSON: `global: { surah, ayah, ts }`, `bySurah: Record<string, number>`).
- Скролл кезінде: `scheduleQuranLastReadSave(surah, ayah)` — **800 ms** debounce, ішінде **`pendingSave`**; `persistQuranLastRead` тек қосулы болса жазады.
- **Blur (экран фокусын жоғалту):** `saveQuranLastReadNow(surah, ayah)` — таймерді тоқтатып, pending тазалап, көрсетілген орынды бірден жазады. Шақыру: `QuranSurahScreen` — `footerAnchorAyahRef` + екінші `useFocusEffect` cleanup (`surahNumber` бойынша).

**Қалпына келтіру (`QuranSurahScreen`):** бұрыннан бар логика — `initialAyah` route params болмаса және last read қосулы болса `loadQuranLastReadState()` → `scrollTargetAyah` / `resumeHighlightAyah`.

**Баптаулар:** `SettingsScreen` — `getQuranLastReadEnabled` / `setQuranLastReadEnabled` / `clearQuranLastReadPositions` (`kk.settings.quranReadLastPos*`).

**Сүре тізімі:** `QuranListScreen` — `useFocusEffect` арқылы `global` оқылып, **«Соңғы оқуға оралу»** карточкасы (`kk.quran.continueReadingTitle` / `continueReadingSubtitle` / `continueReadingA11y`) → `navigate("QuranSurah", { …, initialAyah })`.

**Тест:** **`mobile/src/storage/__tests__/quranLastRead.test.ts`** — `saveQuranLastReadNow` дебаунсталған жазуды болдырмайды.

**Ескерту (§28.1 №5-пен сәйкестік):** құжатта бұрын `lastReadPosition_v2` деп ұсынылған; **нақты кодта** кілттер **`_v1`** суффиксімен (`quran_last_read_*_v1`).

#### 26.7.5 Басқа репо контексті (бұл бөлімге тікелей кірмейді, бірақ Құран/Hatim желісі)

Терең сілтеме / хатым джуз тор: `mobile/src/navigation/quranSurahDeepLink.ts`, `mobile/src/hatim/hatimJuzProgress.ts`, `HatimScreen` — толығырақ алдыңғы commit/PR жазбаларынан.

#### 26.7.6 Тексеру (сұрау бойынша)

| Тексеру | Нәтиже |
|---------|--------|
| `mobile/`: `npx tsc --noEmit` | OK |
| `npx jest` — `mushafAyahArabicLineHeight.test.ts`, `quranLastRead.test.ts` | OK |

#### 26.7.7 Әлі ашық (§28.2 сілтеме)

Аудио **уақыт бойынша** синхрон (сегмент highlight), A–B repeat, FlashList/үлкен сүре перфомансы, бисмиллә баннері бөлек `lineHeight` калибрлеу — **жоспар**, §28.1 кестесінде қалған тармақтарға қараңыз.

### 26.8 Mobile (2026-05-11) — Мұсаф архитектурасы: RNGH, компоненттер бөлу, тығыздық баптаулары

Бұл бөлім **1-спринттің** нақты кодта орындалған бөлігін бекітеді (Expo SDK 54, `mobile/`). Платформа API өзгерісі **қажет емес**.

#### 26.8.1 `react-native-gesture-handler`

- Тәуелділік: **`mobile/package.json`** → `react-native-gesture-handler` (~**2.28.0**, `npx expo install` арқылы үйлесімді нұсқа).
- **`mobile/App.tsx`**: ең үстінде **`import "react-native-gesture-handler"`** (Metro entry тәртібі); түбір UI **`GestureHandlerRootView`** (`style={{ flex: 1 }}`) ішінде — `NavigationContainer` және провайдерлер.
- **Ескерту:** натив модуль; **custom dev build / APK** үшін RNGH қосылғаннан кейін **қолданбаны қайта жинау** (`expo run:android` / `ios` немесе `prebuild` + native build) қажет болуы мүмкін. Expo Go көп жағдайда RNGH қолдайды.

#### 26.8.2 Конфиг және типография hook

- **`mobile/src/config/mushafConfig.ts`**: тығыздық пресеттері (`tight` / `medium` / `comfort`), `getMushafDensityPreset`, `normalizeMushafDensity`, **`MUSHAF_DENSITY_ORDER`** (баптаулар мен UI тәртібі үшін).
- **`mobile/src/quran/useMushafStyles.ts`**: `useMushafLayoutMetrics` + `getMushafDensityPreset` → `{ metrics, densityPreset }`. `QuranSurahScreen` мұсаф `makeStyles` үшін **метрикалардың бір кіру нүктесі**.
- **Әлі жоспар:** толық `StyleSheet` (`makeStyles` мұсаф блогы) осы hook немесе бөлек `mushafReaderStyleSheet` файлына толық көшірілмеген — рефактордың келесі қадамы.

#### 26.8.3 Компоненттер

| Файл | Мазмұны |
|------|---------|
| **`mobile/src/components/quran/MushafAyah.tsx`** | Мұсаф бір аят: маркер + араб (тәжуид/қарапайым), транскрипция/мағына, аудио `Pressable`, ұзын басу → контекст мәзірі; ішінде **`MushafAyahRow`**; `mushafArabicLineHeightForAyah` (§26.7.3). |
| **`mobile/src/components/quran/AyahContextMenuSheet.tsx`** | Ұзын басу модалы: ойнату, көшірру, бөлісу, ескертпа, түсті бетбелгі, белгіні жою; `Modal` компонент ішінде. |
| **`mobile/src/components/quran/MushafAyahRow.tsx`** | (бұрыннан) маркер + `arabicBody` + `belowArabic` контейнері — өзгеріссіз негіз. |

#### 26.8.4 Горизонтальды бет режимі (базалық RNGH)

- **`QuranSurahScreen.tsx`**: мұсаф **page** режиміндегі көлденең тізім — **`FlatList` → `react-native-gesture-handler` ішіндегі `FlatList`** (импортта `GestureHandlerFlatList` псевдонимі); `pagingEnabled`, `getItemLayout`, `onScrollToIndexFailed` сақталған; **`decelerationRate="fast"`** (iOS-та бет ауысуының «қаттырақ» сезімі).
- **Әлі жоспар:** Reanimated snap interval, тік бетке **snap to ayah**, pinch zoom — §28.2.

#### 26.8.5 Баптаулар: мұсаф тығыздығы (3 пресет)

- **`mobile/src/screens/SettingsScreen.tsx`**: «Құран оқу» бөлімінде **тығыз / орташа / жайлы** чиптер (`MUSHAF_DENSITY_ORDER`); **`getMushafDensity` / `setMushafDensity`** (`mobile/src/storage/quranReaderPrefs.ts`, AsyncStorage кілті: **`quran_reader_mushaf_density_v1`**) — **Құран оқу** модалындағы тығыздық таңдауымен **бір кілт**, синхрон.
- **`mobile/src/i18n/kk.ts`**: `settings.quranMushafDensityTitle`, `quranMushafDensityHint`, `quranMushafDensityOption`.

#### 26.8.6 2-спринт (осы құжатта қысқа — толығы §28.2)

Уақыт бойынша audio highlight, **FlashList**, қағаз текстурасы + көлеңке, bookmark экраны / тізім — **орындалмаған**, келесі жұмыс.

## 27. Production тәуекелдері (2026-05) — PostgreSQL cutover, Redis, мобильді orientation

### 27.1 PostgreSQL cutover

`db/get_db.py` және dialect абстракциясы **джанк қабылдауға жарайды**, бірақ нақты cutover **ең үлкен тәуекел** болып қалады.

**Неге SQLite «тез бітіп» кету қаупі жоғары:** mobile growth (DAU / сессия), **AI completion** сұраныстары (`platform_api`), **Hatim** және болашақтағы **bookmark / reading sync**, **аудио** күйі, **виджет** жақтан туындайтын жиі жазу, **analytics / events** — бәрі бір уақытта single-file SQLite үшін **жазу конкуренциясы**, диск I/O, backup/HA тұрғысынан **табалдырыққа** әкелуі мүмкін. Cutover тек «басқа СУБД қосу» емес, **жүктеме профилінің** өзгеруі.

Cutover-ден кейін **міндетті** тексеру: **индекстер** (EXPLAIN, slow query логы), **VACUUM / ANALYZE** саясаты, **connection pool** (`pool_size`, `max_overflow`, timeout, recycle), оқу-жазу latency бойынша **репрезентативті жүктеме** (staging → canary).

**Cutover алдында кодта басталатын қабат (ұсыныс, толығы §40.1):** **SQLAlchemy async** (`asyncpg` + pool), **Alembic** — қатаң версияланған миграциялар (review + CI), **repository layer** (HTTP handler ↔ SQL емес, домен ↔ репозиторий), **read/write separation abstraction** (оқу репликасы / writer pool — нақты топология инфрамен бекітіледі).

Қолда бар runbook: **`docs/PG_SLOW_QUERIES_RUNBOOK.md`**.

### 27.2 Redis (өндіріс)

**Redis-тты өндірісте міндетті ету** — rate limit, short-lived cache және queue үшін дұрыс шешім: API қорғалуы, жүктемеге төзімділік, фондық жұмыстарды бөлісу.

### 27.3 Мобильді: `expo-screen-orientation`

`unlockAsync` / `lockAsync` **нәзік** (OEM-ге тәуелді). `QuranSurahScreen.tsx` ішінде: focus кезінде orientation **тек** `InteractionManager.runAfterInteractions` кейін; blur-да pending callback **бас тартылады**; Android cleanup-інде **қосарланған** портрет құлыбы. Толығырақ — **§26.2** кестесі.

## 28. Mushaf / Hatim UI — 2026-05 ұсыныс пакеті (келесі деңгей)

Негіз: **§26** (кітап хромы, мұсаф тығыздығы, rotation). Мақсат — **нағыз мұсаф оқу тәжірибесін** жақындату және **Hatim** пайдалануын ыңғайландыру.

### 28.1 Қысқа мерзім (1–2 спринт)

#### Mushaf (`QuranSurahScreen` — `mushafLayout: true`)

| № | Өзгеріс | Нәтиже | Файлдар / ескертулер |
|---|---------|--------|----------------------|
| 1 | **Жолдар арасындағы теңгерім** | Ұзын аяттар мен бисмилләде жол қиылыспауы | **Ішінара:** `mushafAyahArabicLineHeight.ts` + **`MushafAyah.tsx`** (§26.8.3); **бисмиллә баннері** (`mushafBismillahBannerTxt`) әлі бөлек калибрлеу керек болуы мүмкін — §26.6, §26.7.7 |
| 2 | **Аят маркері стилі** | Нағыз мұсаф сияқты дөңгелек + нөмір | `mushafAyahMarker*`: **SVG** немесе custom drawable; мүмкіндіктер: **React Native Skia** немесе `react-native-svg` (bundle өлшемі мен Expo үйлесімін тексеру) |
| 3 | **Сүре басындағы орнамент** | Бисмиллә + сүре аты үшін баннер | `KazakhOrnamentBand` + **`mushafSurahHeader`** / `SurahHeader` компоненті (төменде §28.4) |
| 4 | **Тапсырыстық қаріп тығыздығы** | 3 деңгей: **Tight / Medium / Comfort** | **Іске асырылды (§26.8.5):** `SettingsScreen` + Құран оқу модалы; кілт: **`quran_reader_mushaf_density_v1`** (`quranReaderPrefs.ts`); конфиг: **`mushafConfig.ts`** + `MUSHAF_DENSITY_ORDER` |
| 5 | **Last read position** | Қолданба жабылғанда/қайта ашқанда соңғы аятқа scroll + тізімнен жалғастыру | **Іске асырылды (§26.7.4):** `quran_last_read_enabled_v1`, `quran_last_read_state_v1`; blur `saveQuranLastReadNow`; `QuranListScreen` «Соңғы оқуға оралу»; баптауда қосқыш/тазалау |

#### Hatim (`HatimScreen`)

| № | Өзгеріс | Нәтиже |
|---|---------|--------|
| 1 | **Juz / Hizb прогресс** | 30 juz кітап беті стилінде + толтырылу (radial немесе book-like fill) |
| 2 | **Қазіргі хатым картасы** | Ағымдағы сүре визуалды белгі (мысалы book spine индикаторы) |
| 3 | **Бірнеше хатым** | Өзің / отбасы / қауым — таб немесе segmented control; дерек моделі + сервер синхроны шешімі қажет |
| 4 | **Completion** | Хатым біткенде анимация (мысалы confetti) + қысқа дұға мәтіні |

### 28.2 Орта мерзім (3–4 спринт)

- **Gesture navigation (нағыз мұсаф):** горизонталь swipe → келесі/алдыңғы аят немесе бет; **базалық:** §26.8.4 (`GestureHandlerFlatList` + `pagingEnabled` + `decelerationRate="fast"`). **Әлі:** тік scroll + **snap to ayah**; **pinch zoom** (техникалық түрде тек араб кластеріне шектеу оңай емес — шешім: zoom state + transform немесе Skia).
- **Tajweed highlighting (қосымша опция):** идғам, ихфа, имала т.б. — JSON ережелері + regex / тегтерден кейінгі қабат (қазіргі түстермен үйлесім).
- **Audio sync:** аятқа touch → сол аяттан оқу; **ойнату басталғанда аятқа скролл** §26.7.1-де бар; **уақыт бойынша** сегмент highlight / уақыт синхроны әлі жоспар (күрделі, құнды).
- **Dark mode polish:** қағаздың «түнгі» текстурасы + subtle noise (opacity ~0.06).
- **Performance:** ұзын сүрелер (Бақара, Ниса) — **FlashList** немесе виртуализацияны күшейту; араб рендерін Skia-ға көшіру (Expo) — тегіс, бірақ үлкен жоба.

### 28.3 Ұсынылатын келесі commit / PR ауқымы (теңгерімді пакет)

| Бағыт | Мазмұны |
|--------|---------|
| **§26 негізі** | `QuranSurahScreen.tsx` ішіндегі **mushaf styles** блогын қайта қарау: аят арабы үшін `mushafArabicLineHeightForAyah` (§26.7.3), маркер + араб кластері spacing, бисмиллә баннері, соңғы тығыздық түзетулері |
| **Компоненттер** | **`MushafAyah`**, **`AyahContextMenuSheet`** (§26.8.3); **`SurahHeader`** бөлек компонент (орнамент + сүре аты + аят саны) — жоспар; болашақта **`MushafPage.tsx`** |
| **Конфиг** | **`mushafConfig.ts`** — пресеттер + `MUSHAF_DENSITY_ORDER` (§26.8.2); түс токендері / толық spacing бір файлға көшіру — жоспар |
| **Hatim** | Кітап үстелі сақталады; **juz grid/card**; прогресс (**book filling** эффектісі) |
| **Баптаулар** | **Қолданыста:** `quran_reader_mushaf_density_v1` + Settings (§26.8.5). **Жоспар:** `quran.showOrnaments`, `quran.ayahMarkerStyle` (көрсету режимдері) |

### 28.4 Дизайн қосымшалары (қалағанда)

- Қағаз дәнін: subtle paper grain (SVG filter немесе PNG overlay, opacity ~**0.06**).
- Жарық көлеңке: беттің сол жағына жеңіл градиент (ашық кітап әсері).
- Аят нөмірлері: **Uthmani** стиліне жақын визуал (қаріп / маркер пішіні).

### 28.5 §26-пен байланыс

Бұл §28 **жоспар** болып табылады; нақты код өзгерістері PR бойынша бөлек бекітіледі. §26.2–26.3 және §27.3-тегі orientation өзгерістері осы жоспарға **негіз** болып қалады. **2026-05-11** нақты код: **§26.7** (аудио скролл, last read, аят `lineHeight` helper) + **§26.8** (RNGH, `useMushafStyles`, `MushafAyah`, `AyahContextMenuSheet`, Settings тығыздығы, горизонтальды `GestureHandlerFlatList`). §28.1 кестесі №1/№4/№5 және §28.2 gesture bullet §26.7–§26.8-пен үйлестірілген. **Толық sprint тізбегі** — **§29**.

## 29. Ұсынылатын келесі қадамдар — Mushaf Polish + Audio / Performance (2026-05)

Бұл бөлім **§28**-тегі идеяларды **орындалатын sprint форматына** түсіреді: **1-спринт (~2 апта)** — визуал мен оқу UX («Mushaf Polish»); **2-спринт** — аудио синхроны мен перфоманс. Негізгі код орны: `mobile/src/screens/QuranSurahScreen.tsx`, `mobile/src/components/quran/*`, `mobile/src/config/mushafConfig.ts`, `mobile/src/storage/quranReaderPrefs.ts`, `SettingsScreen.tsx`. §26.7–§26.8 **орындалған минимум**; §29 — **келесі инкремент**.

### 29.1 1-спринт (~2 апта) — «Mushaf Polish»

#### 29.1.1 `MushafAyah` компонентін толық жетілдіру

| Тапсырма | Нәтиже / техника |
|----------|------------------|
| **Түсті bookmark индикаторы** | Аят жолының **оң жағына** шеңбер немесе жіңішке жолағы: `ayahMarkers` түсіне байланысты көрініс (қазіргі маркер сақинасына қосымша немесе оның орнына UX шешімі). |
| **Ойнату highlight** | **Reanimated** (shared value) — `playingAyahInSurah` + `ayahAudioIsPlaying` өзгерісінде жеңіл жарықтану / border; JS `setState` ғана емес, кадрға тиымсыз анимация. |
| **Маркер жақсарту** | **SVG** дөңгелек + **Uthmani** стиліндегі аят нөмірі (`react-native-svg` немесе Skia; bundle және Expo үйлесімін тексеру). |

#### 29.1.2 Horizontal Page Mode жақсарту

| Тапсырма | Нәтиже / техника |
|----------|------------------|
| **Snap** | **Reanimated** + `useSharedValue` (немесе `react-native-reanimated` + `scrollHandler`) — бет индексіне «жабысу»; қазіргі `pagingEnabled` + RNGH `FlatList` негізінде кеңейту. |
| **Бет «қағаз» эффектісі** | **Page curl** (күрделі) немесе **көлеңке + linear gradient** (жеңіл нұсқа); §28.4 дизайн ноталарымен үйлесім. |
| **Жылдамдық** | Қазіргі `decelerationRate="fast"` (§26.8.4) сақталады; қосымша **custom velocity threshold** (жест аяқталғанда бет шешімі) — Reanimated / `onMomentumScrollEnd` комбинациясы. |

#### 29.1.3 Context menu кеңейту (`AyahContextMenuSheet` / ұзын басу)

| Тапсырма | Нәтиже |
|----------|--------|
| **Bookmark + түс таңдау** | Қазіргі түсті таңдау UX-ін жақсарту (түс preview, соңғы таңдалған түс). |
| **«Мағынамен көшірру»** | Араб + қазақша мағына (және опция: транскрипция) бір бумаға `expo-clipboard`. |
| **«Ескертпа қосу»** | **AsyncStorage** (немесе бар `quranAyahMarkers` note өрісін кеңейту); кейін **сервер sync** — `platform_api` шешімі бойынша JWT + endpoint (§28.3 «баптаулар» жолынан бөлек техникалық тапсырма). |

#### 29.1.4 Settings → «Quran Reader» бөлімі (немесе эквивалентті топтау)

| Тапсырма | Ескерту |
|----------|---------|
| **Mushaf Density (3 preset)** | **§26.8.5** — Settings-те бар; Құран оқу модалымен синхрон. Қажет болса бір **«Quran Reader»** секциясына жинақтау. |
| **Reading mode: Scroll / Page** | Кілт: `quran_reader_nav_mode_v1` (`getQuranReaderNavMode`) — UI Settings-ке шығару (экранда тек модалда емес). |
| **Show translation / transliteration** | Бар AsyncStorage кілттері (`QuranSurahScreen`); Settings-тен тікелей toggle. |
| **Ayah marker style** | Көрсету режимдері (мысалы классик / minimal); жаңа pref кілті + `MushafAyah` / маркер рендері. |

### 29.2 2-спринт — Audio + Performance

| Тапсырма | Нәтиже / дерек |
|----------|----------------|
| **Timestamp-based audio sync** | Әр аят үшін **уақыт белгілері** (мысалы **EveryAyah** JSON / CDN; немесе **өз `platform_api`** арқылы MP3 + segments); `expo-av` `onPlaybackStatusUpdate` → ағымдағы сөз/сегмент highlight (§26.7.1 скроллдан бөлек). |
| **FlashList** | Ұзын сүрелер (`QuranSurahScreen` тік тізім); `@shopify/flash-list` + `estimatedItemSize`; мұсаф **page** режимінде өлшемділік талдау. **Нұсқа:** §30.3. |
| **Paper texture** | **SVG noise** overlay немесе жеңіл PNG, opacity ~**0.04–0.06**; қараңғы темада да контраст сақтау (§28.2 dark polish). |

#### 29.2.1 Ағымдағы статус — терең UX әлі жоқ

Келесі итерацияға қалдырылған нәрселер (кодта база бар, бірақ төмендегілер толық емес):

| Қолданыстағы база | Келесі қадам |
|-------------------|--------------|
| Аудио + скролл (§26.7.1) | **Timestamp-based audio sync** — сегмент/сөз highlight уақыт белгілерімен (`onPlaybackStatusUpdate` + дерек көзі жоғарыдағы кестеде). |
| `MushafPaperVignette` (бұрынғы) | **§32.2:** файл **жойылды**; Құран мұсаф экранында виньетка/кітап «қорабы» жоқ. Келешекте қағаз текстурасы керек болса — жаңа компонент (мысала **§29.2** SVG noise) бөлек PR. |
| Горизонтальды бет: `pagingEnabled` + `decelerationRate="fast"` (§26.8.4) | **Reanimated** бетке snap + **velocity threshold** (29.1.2 жоспары); қазіргі жұп жеткілікті бастапқы paging UX үшін. |

### 29.3 §26–§28-пен байланыс

- **§26.7–§26.8** — орындалған негіз; §29.1–§29.2 оған **қосымша** емес, **келесі қадам**.
- **§28** — стратегиялық тақырыптар; **§29** — sprintке бөлінген **нақты deliverable** тізімі. PR-ларды §29.1 / §29.2 бойынша бөлу ұсынылады.
- **§33** — §26–§32 + §29 бойынша **Фаза 1 (1–2 ай)** жинақ жол картасы; өнім басымдықтарын бір бетте шолу үшін.
- **§24.0** — §33–§38 фазаларының **бір индекс кестесі** мен **байланыс диаграммасы** (§24 бөлімінде).

## 30. Mobile sync — мұсаф бет басылымы, Хафс 604 кестесі, FlashList (2026-05-11)

Бұл бөлім **құжат пен репо синхронын** бекітеді: GPT сұрауы кезінде «файл жоқ» немесе ескі npm тәуелділігі туралы шатасуды азайту.

### 30.1 Мұсаф футер: Medina / Turkish таңдауы (**ескірді → §32.1**)

Бұл кесте **2026-05-11 алдындағы** UI мәнін сақтайды; репода **жалған екі режим жойылған**.

| Элемент | Тарихи мазмұн (ескі) |
|---------|----------------------|
| **Мақсаты (ескі)** | Medina / Turkish таңдауы — есептеу бірдей болғандықтан пайдаланушыға шатасу туғызды. |
| **Prefs (жойылды)** | `quran_mushaf_page_edition_v1` — `getMushafPageEdition` / `setMushafPageEdition` жоқ. |
| **Есептеу (қазір)** | **`§32.1`** — тек `mushafDisplayPageFromGlobalAyahOneBased(globalOneBased)`, бір **Хафс 604** картасы. |

**Актуалды сипаттама:** **§32.1** (бет нөмірі prefs жоқ) және **§32.2** (сызықты мұсаф визуалы).

### 30.2 Хафс 604: жергілікті PageList (npm `quran-meta` жоқ)

| Файл | Рөлі |
|------|------|
| `mobile/src/data/quranHafsPageStarts.generated.json` | Хафс **PageList** (606 сан): бет басталуының глобалды аят индекстері; көз — [quran-center/quran-meta](https://github.com/quran-center/quran-meta) `HafsLists` (`PageList`). |
| `mobile/src/data/quranHafsPageFromGlobalAyah.ts` | `hafsPageFromGlobalAyahOneBased` — глобалды аят 1..6236 → бет 1..604. |
| `mobile/src/data/quranHizbBoundaries.ts` | Хизб есебінен бөлек, **медина бет шамасы** үшін де осы `hafsPageFromGlobalAyahOneBased` қолданылады (`approxMedinaPageFromGlobalAyahOneBased`). |
| **Тест** | `mobile/src/data/__tests__/quranMushafPageByGlobalAyah.test.ts` (мысалы 2:255 → бет 42). **Jest** үшін `quran-meta` пакеті қажет емес — Metro да ESM мәселесін болдырмайды. |

**PageList жаңартуы (сирек):** upstream өзгерсе, `HafsLists.ts` ішіндегі `PageList` массивін қайта экспорттап JSON-ды жаңарту; содан кейін тесттерді іске қосу.

### 30.3 `@shopify/flash-list` нұсқасы

| Тақырып | Мазмұны |
|---------|---------|
| **Негізі** | §29.2 **FlashList** тапсырмасы әлі толық орындалмаған болуы мүмкін, бірақ тәуелділік репода бар. |
| **Бекіту** | `mobile/package.json` — **`@shopify/flash-list@1.7.3`** (ескі архитектура / Expo 54 үйлесімі үшін major жаңартуды шектейді). Интеграцияланған экрандарды әр уақытта `grep FlashList` арқылы тексеру. |

### 30.4 §25 (Halal / штрихкод) және «файл табылмады»

| Сценарий | Әрекет |
|----------|--------|
| GPT §25 кестесіндегі жолды ашпай қалды | Файл **жойылған** немесе **қайта аталған** болуы ықтимал — `HalalScreen.tsx`, `halalDamuUrl.ts` және `git log -- mobile/src` арқылы нақты тармақты қарау. |
| Продакт халал OFF сканерін қайта қосқысы келеді | Жаңа тапсырма ретінде §25 мазмұнын қайта құру; API/құқық шектеулерін ескеру. |

### 30.5 Құжат саулығы (қысқа талдау)

| Мәселе | Түзету күйі |
|--------|-------------|
| §2 репо кестесінде `mobile/` **Expo SDK 52** деп тұрған | Бұл бөлім **§30**-мен бірге **SDK 54**-ке жаңартылды (төмен §2). |
| §25 тест саны | **§25.5** + **§11** — **2026-05-13**: Jest **35 / 128** (`npm run test:full`); pytest **112 + 1 skipped** (2026-05-11); кейін `npm test` / `pytest` шығысымен қайта үйлестіру. **§39.1** — Jest AsyncStorage mock. |
| Мұсаф бет нөмірі құжатта жоқ еді | §30.2 + §24.6; **UI/prefs жаңартуы** — **§32.1**. |

## 32. Mobile update (2026-05-11 — кейінгі сессия) — мұсаф сызықты бет, Хафс UI, кітап типографиясы, хатым джуз, басты бет, ассеттер

Бұл бөлім **бір сессиядағы соңғы мобильді өзгерістерді** бекітеді (Expo `mobile/`). Платформа API өзгерісі **қажет емес**.

### 32.1 Мұсаф бет нөмірі: жалған Medina / Turkish жойылды

| Элемент | Қазіргі күй |
|---------|-------------|
| **AsyncStorage** | Кілт **`quran_mushaf_page_edition_v1`** және `getMushafPageEdition` / `setMushafPageEdition` **`quranReaderPrefs.ts`-тен жойылған**. |
| **Дерек** | `mobile/src/data/quranMushafPageByGlobalAyah.ts` — `mushafDisplayPageFromGlobalAyahOneBased(globalOneBased)`; тип **`MushafPageEditionId` жоқ** (бұрынғы мұра сілтемелері жойылған). |
| **Футер** | `QuranSurahScreen.tsx` — `kk.quran.mushafFooterEditionHafs604` («Хафс · 604»), a11y сол мәтінмен. |
| **Оқу модалы / баптаулар** | Екі таңдау жоқ; түсініктеме ғана. `SettingsScreen.tsx` — мұсаф бет басылымы чиптері жойылған. |
| **i18n** | `mobile/src/i18n/kk.ts` — `readerMushafPageEditionHint`, `settings.quranReaderMushafPageHint`, `mushafFooterEditionHafs604`; ескі `readerMushafPageEditionMedina/Turkish`, `juzToggle*`, т.б. тазаланған. |
| **Тест** | `quranMushafPageByGlobalAyah.test.ts` — бір аргументті шақыру. |

### 32.2 Мұсаф визуал: кітап «қорабы» мен виньетка жоқ (`QuranSurahScreen`)

| Өзгеріс | Сипат |
|---------|--------|
| **Темаға жақын фон** | Алдыңғы сары/қағаз палитра **алынып**, `colors.bg` / `card` / `border` / `accentSurface` үйлесімі. |
| **Кітап қабы** | Сыртқы `mushafBookDesk` / `mushafBookPage` wrap, көлеңке, бет жиегінің градиенті, `MushafPaperVignette` — **жойылған** (`mobile/src/components/quran/MushafPaperVignette.tsx` файл жоқ). |
| **Бет ені** | Горизонтальды мұсаф: `mushafPageWidth === windowWidth` (ішкі margin-жиек жоқ). |
| **Нәтиже** | Пайдаланушы **телефон бетінде сызықты оқу** — физикалық мұсаф қақпағы эмуляциясы емес. |

### 32.3 «Кітаптан оқып отырғандай» типография (`mushafLayout`)

| Файл | Мазмұны |
|------|---------|
| `quranArabicFontPresets.ts` | `effectiveArabicPresetForMushafBook` — әдепкі / `large` / `compact` → **`book_scheherazade`** (басқа кітап пресеті таңдалса — өзгермейді). |
| `mushafTypography.ts` | `computeMushafTypography(..., { bookMushaf })`; жылы сия: жарық **`#231f1a`**, қараңғы **`#FAF5EB`**. |
| `useMushafLayoutMetrics.ts` | 5-ші параметр `bookMushaf`. |
| `useMushafStyles.ts` | `mushafBookLike: mushafLayout` — тек **`mushafLayout: true`** кезінде кітап метрикалары. |
| `MushafAyah.tsx` | Транскрипция/мағына: **`mushafAyahSectionCaption`**, **`mushafAyahKiril`**, **`mushafAyahKk`**, **`mushafNoKkHint`** (serif, жұмсақ `fontWeight`). |
| `QuranSurahScreen.tsx` `makeStyles` | `mushafAyahTxt` **`letterSpacing`**; **`mushafListPad`** горизонталь ~**24** px. |

### 32.4 Хатым (`HatimScreen`)

| Өзгеріс | Сипат |
|---------|--------|
| **30 джуз торы** | Toggle жоқ — тор **әрқашан** көрінеді. |
| **Джуз басу** | `QuranSurah` **ашпайды**; `FlatList` **`scrollToIndex`** — сол джуздың басталатын сүре жолына (`QURAN_JUZ_STARTS`, `getItemLayout`, `onScrollToIndexFailed`). |
| **Ою** | `KazakhOrnamentBand` — проп **`stripOnly`**; контейнер **`hatimOrnamentTop`** — `bookPage` **сыртында**, фонсыз жолақ. |
| **Тізім** | `rowTitle` — serif, **`fontWeight: "500"`**. **Ескерту:** §26.1 кестесіндегі кремді кітап палитрасы Hatim бетінде әлі болуы мүмкін — осы § тек ою орны мен джуз мінез-құлқын сипаттайды. |

### 32.5 Басты бет шапкасы (`DashboardScreen`)

| Элемент | Мазмұны |
|---------|---------|
| **`headerTitle`** | Ортада **құбыла** (`HomeHeaderQiblaChip` `layout="center"`). |
| **`headerLeft`** | **Күн + ауа райы**; кіші **RAQAT** бренд мәтіні. |
| **Тор тайлдары** | **`hideTitles` алынып тасталды** — сурет астындағы тақырып/субтитр қайта көрінеді. |

**Жаңарту (§42.3):** шапка қайта жоспарланды — **RAQAT** оңға (`headerTitleAlign: "right"`, `headerTitleLeftPad` / `headerTitleRightPad`); **баптаулар** оң жиекке (`HEADER_NAV_EDGE_NUDGE`); **құбыла** баптаулардың солында; сол жақта тек күн/ауа райы (`HomeHeaderLeft`).

### 32.6 Ассеттер (намаз / дәрет)

| Файл | Мазмұны |
|------|---------|
| `mobile/assets/namaz/tile-namaz.png` | Басты бет / контент хабы **Намаз** тайлы. |
| `mobile/assets/namaz/wudu_full_steps.png` | Намаз нұсқаулығы — **«Дәрет алу реті»** инфографикасы (`ContentGuideScreens.tsx`). |
| `mobile/assets/namaz/wudu_button_icon_custom.png` | Дәрет hero батырмасы суреті. |

### 32.7 APK (локальды Gradle)

| Команда | Скрипт (`mobile/` каталогынан) |
|---------|----------------------------------|
| Release | `npm run build:apk` → `node scripts/build-apk-node.cjs release` |
| Debug | `npm run build:apk:debug` → `node scripts/build-apk-node.cjs debug` |
| **Шығыс (release)** | `mobile/android/app/build/outputs/apk/release/app-release.apk` |
| **Шығыс (debug)** | `mobile/android/app/build/outputs/apk/debug/app-debug.apk` |

---

## 39. Mobile / platform sync (2026-05-13 — 2026-05-15) — Jest, виджеттер, Halal, VPS құжаты, дәстүр экраны, web asset, AppState

Бұл бөлім **репо күйінің жинақталған снапшоты**: мобильді unit test инфрасы, Android үстел виджеттері, сыртқа API шығару құжаты, Halal модулінде файлдардың жаңартылуы; **2026-05-15** қосымшасында — «Дін мен дәстүр» экранының құрылымы, Expo web / Metro ассет ескертулері, `AppState` `inactive` мәселесі. Платформа `platform_api` үшін **міндетті жаңа endpoint жоқ** (виджет дерегі — қолданба ішінде / бар API шарттарымен).

### 39.1 Jest: `AsyncStorage` mock және `test:full`

| Файл | Мазмұны |
|------|---------|
| `mobile/jest.setup.js` | `jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"))` — Jest ортасында native модуль **null** болғандықтан `src/api/halalDamuWp.ts` сияқты файлдарды импорттау құламайды. |
| `mobile/jest.config.js` | `setupFilesAfterEnv: ["<rootDir>/jest.setup.js"]` |

**Тексеру (2026-05-13):** `npm run test:full` (`mobile/`) — **35** suite, **128** test, барлығы PASS.

**APK (debug, сол күн):** `npm run build:apk:debug` — **BUILD SUCCESSFUL**; шығыс: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

### 39.2 Android: намаз уақыты home screen виджеттері

| Элемент | Мазмұны |
|---------|---------|
| **База** | `BasePrayerRemoteWidgetProvider` — `AppWidgetProvider`, `buildViews` → `RemoteViews`. |
| **Провайдерлер** | `PrayerTimesWidgetProvider`, `PrayerNextWidgetProvider`, `PrayerStripWidgetProvider`, `PrayerMorningWidgetProvider`, `PrayerEveningWidgetProvider`, `PrayerTwoColWidgetProvider`, `PrayerFiveDualWidgetProvider` (`mobile/android/app/src/main/java/kz/raqat/app/`). |
| **RN көпірі** | `PrayerWidgetPackage` / `PrayerWidgetModule` — Expo/React Native жақтан виджетті жаңарту (payload, rich text helper-лар: `PrayerWidgetPayload`, `PrayerWidgetRichText`, `PrayerWidgetViews`). |
| **Boot** | `PrayerWidgetBootReceiver` — жүйелік оқиғалардан кейін жаңарту шақырулары үшін (нақты intent фильтрлері `AndroidManifest.xml`-те). |
| **Ресурстар** | `res/layout/widget_prayer_*.xml`, `res/xml/prayer_*_widget_info.xml`, `res/drawable/widget_prayer_bg.xml`, `strings.xml` виджет белгілері. |
| **Тіркеу** | `MainApplication.kt` — `add(PrayerWidgetPackage())`; `AndroidManifest.xml` — әр провайдер үшін `<receiver …>` + `APPWIDGET_UPDATE`. |

**Ескерту:** виджеттер **толық натив Android build** (custom dev client / Gradle APK) қажет етеді; тек Expo Go арқылы виджет тіркеуін күтпеу керек.

### 39.3 Halal: реподағы файл күйі (§25-пен үйлестіру)

| Өзгеріс | Сипат |
|---------|--------|
| **Жойылған (тарихи §25.1–25.2)** | `mobile/src/content/halalEcodeDb.ts`, `mobile/src/content/halalAiPrompts.ts`, `mobile/src/components/HalalBarcodeScannerModal.tsx`, `mobile/src/components/HalalResultFormatted.tsx` — репода **жоқ**; E-code glossary / eski OFF modal кестелері **тарихи** болып табылады. |
| **Қалған / ауыстырылған** | `HalalScreen.tsx`; штрихкод/камера: **`HalalBarcodeCameraModal.tsx`**; карталар: **`HalalCompaniesMapModal.tsx`**; API: **`mobile/src/api/halalDamuWp.ts`**; конфиг: **`mobile/src/config/halalDamuUrl.ts`**. **2026-05-19 клиент түзетулері:** **§43.3** (AsyncStorage bulk, loading UX, прокси). |

OFF / `openFoodFacts` сервистері репода қалған-қалмағанын PR кезінде `git grep` / файл ағашымен растаңыз.

### 39.4 Құжат: VPS және Platform API сыртқа шығару

| Файл | Мазмұны |
|------|---------|
| `docs/VPS_PRODUCTION_PLATFORM_API.md` | `platform_api` үшін **HTTPS**, DNS (`api.домен…`), VPS, nginx, **Cloudflare Tunnel / ngrok** жылдам сынағы, мобильді баптауда API URL енгізу схемасы. |

Негізгі өндіріс позициясы: **`docs/PRODUCTION_POSTURE.md`** (бұрынғыдай).

### 39.5 Басқа (қысқа)

Репо `git status` бойынша **көп өзгерістер** (мысалы `db/migrations.py`, `.env.example`, мобильді ассеттер, Құран UI, дауыстық көмекші, nginx README) осы §-та тізбектелмеген — нақты diff үшін `git log` / PR сипаттамасын қолданыңыз. **2026-05-15** нақты түйіндер: **§39.6–39.8**.

### 39.6 «Дін мен дәстүр» (`KazakhTraditionScreen`): кітаптар жоғарыда, кіріспе кейін

| Элемент | Мазмұны |
|---------|---------|
| **Мақсат** | Экран ішіндегі **кіріспе / кітаптар / құралдар** араласпауы үшін оқу реті нақтыланды: алдымен қысқа `Text` (`styles.intro`), содан **«Кітаптар»** `TraditionAccordion` (`booksSectionOpen` әдепкі **`true`**), содан **`SpiritLiftButton`**, содан **«Кіріспе»** аккордеоны (`introSectionOpen` әдепкі **`false`** — жинақы), содан `anchorBar` және жұмыс парағы / апта / тақырыптар. |
| **Код** | `mobile/src/screens/KazakhTraditionScreen.tsx` — `ScrollView` ішіндегі JSX тәртібі. |
| **i18n** | `mobile/src/i18n/kk.ts` — `features.traditionIntro`, `traditionGuide.traditionScreenMapTitle` / `traditionScreenMapBody`, `sectionBooksSubtitle`, `sectionIntroSubtitle` жаңа layout-пен үйлеседі. |

Терең контекст (ислам білім базасы / RAG): `docs/RAQAT_ISLAMIC_KNOWLEDGE_RAG.md`.

### 39.7 Expo web / Metro: «Invalid JPG, no size found» (ассет гигиенасы)

| Себеп | Түрі |
|-------|------|
| **Кеңейтім ↔ құшақ** | Файл атауы **`.png`**, бірақ ішкі формат **JPEG** (`FF D8 FF E0 … JFIF`) — Metro asset трансформері **`image-size`** жолында JPEG парсеріне түсіп, кей файлда **SOF** табылмай **құлауы** мүмкін (лог: `Invalid JPG, no size found`). |
| **Репо ескертуі** | `mobile/assets/` астында **көптеген** `.png` тарихи түрде нақты JPEG; Android натив бандлы әдетте өтеді, ал **web** бандлы кейде осыған сезімтал. |
| **Шешім** | Ассетті **нақты PNG** (RGBA) қайта экспорттау немесе кеңейтімді **`.jpg`** деп түзету; күдіктілерді сканерлеу: `.png` атаулы файлдың басында **PNG сигнатурасы** (`89 50 4E 47 0D 0A 1A 0A`) **жоқ** болса (мысалы `FF D8 FF` — JPEG), оны қайта кодтау. |
| **Тексеру** | `npx expo start --web --clear`; қате қайталанса, соңғы `import` қосылған суреттерді және жоғарыдағы JPEG-пен `.png` атауын бірінші күмәнге алу. |

### 39.8 `App.tsx`: AppState `inactive` — iOS фонға шығу алдында жаңарту

| Элемент | Мазмұны |
|---------|---------|
| **Мәселе** | iOS-та **үй түймесі** басылғанда алдымен **`inactive`**, содан **`background`** — кей жаңартулар тек `background` күткенде кешігуі мүмкін. |
| **Шешім** | `AppState` тыңдаушысында фронттан шығу: `next === "background"` **немесе** (`next === "inactive" && prev === "active"`) (`leavingForeground`). |
| **Код** | `mobile/App.tsx` — `AppState.addEventListener("change", …)` блогы және түсіндірме коммент. |

---

## 40. Стратегиялық техника қарызы (2026-05) — PostgreSQL алдындағы платформа қабаты, `QuranSurahScreen` hook-декомпозиция, локалды state масштабы

Бұл бөлім **өнім жолынан бөлек**, бірақ cutover және мобильді өсу кезінде **құлау тәуекелін төмендетуге** бағытталған **міндеттемелер мен ұсынымдарды** бекітеді. Нақты код PR-лармен кезең-кезеңмен шығады; §27, §28–§29, §31-пен үйлеседі.

### 40.1 SQLite → PostgreSQL: тәуекелдің түбі мен қазірден басталатын қабат

| Тақырып | Мазмұны |
|---------|---------|
| **Жүктеме көздері** | Mobile growth, **AI** (`platform_api` completion / rate), **Hatim sync**, **bookmarks**, **audio** күйі, **widgets** (жиі жаңарту), **analytics** — бір уақытта single-node SQLite үшін **жазу конкуренциясы**, файл өлшемі, backup/HA тұрғысынан **шегіне тез жету** қаупі. Бұл **§27.1**-дегі cutover тәуекелінің практикалық түсіндірмесі. |
| **Қазірден басталатын инфра (ұсыныс)** | **SQLAlchemy async** (`asyncpg`, pool sizing, statement timeout), **Alembic** — қатаң версияланған миграциялар (CI-да `alembic upgrade head` сынағы, review checklist), **repository layer** (handler-ларда шикі SQL емес; домен операциялары репозиторий арқылы), **read/write separation abstraction** (оқу жолы / жазу жолы — replica URL немесе кем дегенде интерфейс + кейін replica қосу). |
| **Cutover сәтіне дейін** | Индекстер, pool, VACUUM, staging жүктеме — **§27.1**; **`docs/PG_SLOW_QUERIES_RUNBOOK.md`**. |

### 40.2 `QuranSurahScreen.tsx` — technical debt орталығы; міндетті hook-декомпозиция

| Элемент | Мазмұны |
|---------|---------|
| **Мәселе** | Бір экранда шоғырланған: scroll, audio, orientation, paging, mushaf, modal, bookmarks, translation, tajweed, last read — §28–§29 және **§31.0 A** бұрыннан осы бағытты айтады. |
| **Міндетті бөлу (ұсынылатын hook шектері)** | **`useQuranReader`** — linear vs mushaf layout, тізім refs, scroll оркестрациясы; **`useAyahPlayback`** — ойнату күйі, highlight, аудио→скролл (**§26.7.1**); **`useMushafPager`** — горизонталь бет ені, snap, RNGH pager (**§26.8.4**); **`useLastReadPersistence`** — debounce, blur flush (`quranLastRead.ts`); **`useQuranNavigation`** — `ScreenOrientation`, focus/blur cleanup (**§26.2**, **§27.3**). Қосымша: **`useQuranReaderPrefs`** — density, nav mode, translation toggles (`quranReaderPrefs.ts`) — AsyncStorage шақыруларын осыдан оқшаңдау (**§40.3**-пен үйлеседі). |
| **Файл орны** | `mobile/src/quran/hooks/` немесе `mobile/src/features/quran/hooks/` — **§31.1** мақсаттық ағашпен келісімді. |
| **Deliverable тәртібі** | Экранда тек **композиция + JSX**; PR-ларды **бір hook = бір PR** (немесе кіші топ) деп бөлу — регрессияны шектеу. |
| **Орындалған (2026-05-24, §44.2)** | **`useAyahPlayback`**, **`useAyahPlaybackScroll`**, **`useLastReadPersistence`** — `mobile/src/quran/`; **`QuranSurahScreen`** wiring. **Қалған:** `useQuranReader`, `useMushafPager`, `useQuranNavigation`. |

### 40.3 AsyncStorage — critical state шоғырлануы; масштаб кезіндегі траектория

| Элемент | Мазмұны |
|---------|---------|
| **Мәселе** | last read, reader prefs, density, nav mode, markers — көп критикалық күй **AsyncStorage** арқылы: JS thread I/O, JSON serialize, кілт саны өскен сайын **латенттілік** және жазу сәтсіздігі тәуекелі. |
| **Eventually (траектория)** | **MMKV** (жылдам key-value, native), немесе **Zustand + persist** (subset state, миграция нұсқалары), немесе **SQLite жергілікті кэш** (bookmark / hatim офлайн + sync queue үшін ыңғайлы). **Таңдау шешімі:** сервермен синхрондалатын домен көп болса — жергілікті **SQLite** + кезек; тек preferences / жеңіл күй болса — **MMKV** жеткілікті. |
| **Уақытша тәртіп** | Жаңа pref кілттерін PR сипаттамасында тізімдеу; ауыр JSON-ды AsyncStorage-та ұзақ ұстамау; cutover кезінде **бір кілт = бір мәнділік** ережесін сақтау. |

---

## 41. Қазір не істеу керек — priority матрицасы (P0 / P1 / P2)

Бұл кесте **тұрақты басымдық тәртібін** бекітеді: **P0** — масштаб пен cutover үшін негіз; **P1** — AI / әкімшілік / аналитика кеңеюі; **P2** — платформа мен тілдің ұзақ мерзімді жобалары. Техникалық тереңдік: **§40**; мобильді бөлшектер: **§28–§31**, **§29**; өндіріс тәуекелі: **§27**.

### 41.1 P0 — қазіргі өткел (инфра + ядро UX / өнім негізі)

| Домен | Тапсырмалар |
|--------|--------------|
| **Backend** | **PostgreSQL migration layer** (async SQLAlchemy, Alembic, repository, R/W абстракция — **§40.1**); **Redis** (rate limit, cache, queue — **§27.2**); **JWT refresh architecture**; **background jobs** (фондық синхрон, ретрәй, тазалау, хабарлама жіберу). |
| **Mobile** | **`QuranSurahScreen` split** (**§40.2** hook шектері — **§44.2** ішінара); **FlashList migration** (**§30.3**, **§29.2** — **§44.2** классикалық тізім); **audio sync architecture** (уақыт бойынша highlight / сегменттер — **§28.2**, **§29.2**; pulse scroll — **§44.2**). |
| **Product** | **offline Quran**; **push reminders** (намаз / хабарлама); **account sync**; **bookmark cloud sync** (пайдаланушы дерегі + `platform_api` / PG кейін). **2026-05-25:** **GENEALOGY-P0** — шежіре read API + mobile bundled (**§45**, freeze-scope read-only контент). |

### 41.2 P1 — келесі толқын (AI, әкімшілік, дерек)

| Бағыт | Тапсырмалар |
|--------|-------------|
| **AI & retrieval** | **AI fatwa routing**; **Muftyat semantic retrieval**; **vector search** (индекстеу, embedding pipeline, қауіпсіздік шегі). |
| **Admin & analytics** | **imam/admin panel**; **analytics pipeline** (оқиғалар жинау, сақтау, бақылау). |

### 41.3 P2 — ұзақ мерзім (тіл, дауы, жаңа платформалар)

| Бағыт | Тапсырмалар |
|--------|-------------|
| **Voice & тіл** | **full voice assistant**; **Kazakh ASR/TTS**. |
| **Кеңейтілген платформалар** | **smartwatch**; **Android Auto**; **TV mode**. |

**Ескерту:** P0 ішіндегі элементтерді бір спринтке сыйдырмау — **Backend** жолы (PG + Redis + JWT + jobs) мен **Mobile** (экран бөлу + FlashList + audio) **паралель топтар** ретінде жоспарлаған дұрыс; Product тармағы мобильді және API дайындығына тәуелді.

---

## 42. Mobile + platform sync (2026-05-16) — Құрбан айт, құбыла оюлы иін, басты бет шапкасы, ислам KB RAG

Бұл бөлім **2026-05-16** сәтіндегі өнім/код жинақын бекітеді: мерекелік нұсқаулық, құбыла UI, басты бет композициясы, платформа **ислам білім базасы** (RAG). Толық RAG құжаты: **`docs/RAQAT_ISLAMIC_KNOWLEDGE_RAG.md`**.

### 42.1 Құрбан айт — мазмұн, экран, басты бет карточкасы

| Элемент | Файл / мазмұн |
|---------|----------------|
| **6 бағыт нұсқаулық** | `mobile/src/content/kurbanAitGuideContent.ts` — `KURBAN_AIT_GUIDE_SECTIONS` (намаз, дұға, көрші, құрбан, ет бөлу, ысырапсыз мереке); қосымша: `phrases`, `dayplan` |
| **Инфографика** | `mobile/assets/hajj/kurban-ait-guide-infographic.png` (1024×558); `KurbanAitTraditionGuide` — `showSectionsInfographic` |
| **Тақырыптар тізімі** | `mobile/src/components/KurbanAitTopicsPanel.tsx` + `mobile/src/content/kurbanAitDashboardTopics.ts` — 8 жол; тақырып басу → `KurbanAitScreen` ішінде `scrollToTopic` / `focusSectionId` |
| **Толық экран** | `mobile/src/screens/KurbanAitScreen.tsx` — баннер, кіріспе, **Тақырыптар** панелі, содан толық бөлімдер (`KurbanAitTraditionGuide`, `hideTitleBanner`) |
| **Навигация** | `MoreStack` → `KurbanAit`; `DashboardScreen` → `goKurbanAit(focusSectionId?)` |
| **Басты бет карточкасы** | `mobile/src/components/DashboardKurbanAitCard.tsx` — тақырып + субтитр + hero; **«Толық нұсқаулықты ашу»** карточка **төменгі футер** жолақта (`openFooter`); карточка скролдың **ең астында** (`promoHolidayBottom`), Halal/AI промодан кейін, **тор тайлдарынан кейін** |
| **i18n** | `kk.dashboard.promoHolidayKurbanTitle`, `kk.features.kurbanAitTopicSub`, `kk.dashboard.kurbanAitOpenFullGuide`, `kk.dashboard.kurbanAitTopicsHeading` |
| **Тест** | `mobile/src/content/__tests__/kurbanAitGuide.test.ts` |

**Ескерту:** бұрын тақырыптар тізімі басты бет карточкасында болған; қазір тізім тек **`KurbanAitScreen`** ішінде.

### 42.2 Құбыла — оюлы стрелка және бұру геометриясы

| Элемент | Мазмұны |
|---------|---------|
| **Ассет** | `mobile/assets/qibla/qibla-arrow-ornament.png` (мөлдір PNG; кадрда ұш ~+45° CW «жоғарыдан») |
| **Тема** | `mobile/src/theme/qiblaAssets.ts` — `qiblaArrowOrnament`, `QIBLA_ARROW_ORNAMENT_ASPECT` |
| **Компонент** | `QiblaArrowPointer.tsx` — `ornamentArrow` (векторлық `ornamentNeedle` орнына); `spinDeg = qiblaNeedleSpinDeg(rotateDeg)` |
| **Геометрия** | `mobile/src/lib/qiblaArrowGeometry.ts` — `QIBLA_ORNAMENT_IMAGE_ALIGN_DEG = 180° − assetTip`; сыртқы бұру + ішкі align → экранда ұш **құбыла азимутына** (`qiblaNeedleTipScreenDeg(rotateDeg)`) |
| **Қолдану** | `QiblaScreen`, `DashboardScreen` (шапка), `DashboardHeroQiblaCard`, `QiblaArCameraView` — `ornamentArrow` |
| **Тест** | `mobile/src/lib/__tests__/qiblaArrowGeometry.test.ts` |

**Калибрлеу:** сурет ауыстырылса — `QIBLA_ORNAMENT_ASSET_TIP_DEG` қайта өлшеу.

### 42.3 Басты бет шапкасы (`DashboardScreen`)

| Элемент | Мазмұны |
|---------|---------|
| **RAQAT** | `headerTitle` — оңға тураланған (`headerTitleAlign: "right"`, `headerTitleLeftPad ≈ 36% ені`, `headerTitleRightPad` — құбыла+баптаулар резерві) |
| **Сол жақ** | `headerLeft` — тек күн (`formatGregorianTechYmd`) + Open-Meteo ауа райы (`HomeHeaderLeft`) |
| **Оң жақ** | `HomeHeaderQiblaChip` (`layout="center"`) + `HomeHeaderSettingsButton`; баптаулар **`HEADER_NAV_EDGE_NUDGE`** (8px) арқылы RN header padding-ін өтіп, safe-area `paddingRight` |
| **Константалар** | `HEADER_SETTINGS_BTN`, `HEADER_QIBLA_SETTINGS_GAP`, `HEADER_TITLE_RIGHT_RESERVE`, `HEADER_NAV_EDGE_NUDGE` — `DashboardScreen.tsx` үстінде |

§32.5 кестесіндегі «ортада құбыла + сол жақта RAQAT» схемасы **§42.3** бойынша **ескірген**.

### 42.4 Мұсаф «қағаз» беті (қысқа)

| Элемент | Мазмұны |
|---------|---------|
| **Түс** | `mobile/src/theme/illuminatedMushafManuscript.ts` — `MUSHAF_BOOK_PAGE_FACE_LIGHT` / desk ≈ **`#EFEFEF`** |
| **Экран** | `QuranSurahScreen.tsx` — `bookPageLayout`, мұсаф бет режимінде жеңіл сұр фон; `MushafSurahHeader`, `MushafBookFooter` |
| **Тест** | `mobile/src/quran/__tests__/mushafTypographyBook.test.ts` |

Толық мұсаф архитектурасы — **§26**, **§32**, **§29**.

### 42.5 Platform: ислам білім базасы (Fatua / Muftyat RAG)

| Элемент | Мазмұны |
|---------|---------|
| **Пакет** | `platform_api/islamic_kb/` — SQLite + FTS5 (`db.py`, `search.py`), ingest (`ingest.py`), RAG (`rag.py`), `config.py` |
| **Синхрондау** | `scripts/sync_islamic_kb_fatua.py`, `scripts/sync_islamic_kb_muftyat.py`; DB әдепкі: `data/islamic_kb.sqlite3` (`RAQAT_ISLAMIC_KB_DB_PATH`) |
| **AI** | `platform_api/ai_proxy.py` — `build_islamic_kb_context` (қосымша контекст); `RAQAT_ISLAMIC_KB_ENABLED=1` |
| **API** | `sources[]` жауапта; `GET /api/v1/ai/kb/status` — индекс статистикасы (`platform_api/ai_routes.py`) |
| **Мобильді** | `platformApiClient.ts` — `fetchIslamicKbStatus`; `RaqatAIChatScreen` / `RaqatAiChatSettingsPanel` — баптаулар жоғарыда, дереккөздер UI |
| **Конфиг** | `.env.example`, `infra/docker/platform-api.env.example` — `RAQAT_ISLAMIC_KB_*` |
| **Тест** | `tests/test_islamic_kb_search.py` (репо түбі, `pytest`) |
| **Құжат** | **`docs/RAQAT_ISLAMIC_KNOWLEDGE_RAG.md`** |

**§41.2 P1** («Muftyat semantic retrieval») қазіргі кодпен **басталған**; embeddings / pgvector — әлі фаза 2 (**RAQAT_ISLAMIC_KNOWLEDGE_RAG.md**).

### 42.6 APK және тексеру

| Команда | Сипат |
|---------|--------|
| `mobile/scripts/assemble-android-release-phone.ps1` | Release APK (ARM v7+v8); көшірме: `mobile/raqat-release-latest.apk` |
| `npm run test:full` (`mobile/`) | `tsc` + Jest; тармақталған тест: `kurbanAitGuide`, `qiblaArrowGeometry`, `mushafTypographyBook` |
| `pytest tests` (түбір `.venv`) | `test_islamic_kb_search` және бар API тесттері |

**Ескерту:** репода `tsc --noEmit` кей жерлерде тарихи тип қателерін көрсетуі мүмкін — жаңа §42 файлдарына нақты тесттерді қолданыңыз.

### 42.7 Қысқа next steps

1. Құрбан айт: Oraza айтпен бірдей «күн бойынша жоспар» күнтізбе UI (қазір мәтіндік бөлім).  
2. Құбыла: құрылғыда оюлы иін калибрлеуін растау; қажет болса `QIBLA_ORNAMENT_ASSET_TIP_DEG` түзету.  
3. Ислам KB: өндірісте ingest cron + `RAQAT_ISLAMIC_KB_ENABLED`; embedding/search фазасы — **RAQAT_ISLAMIC_KNOWLEDGE_RAG.md**. (Келесі масштабтау — **§43.1**.)

---

## 43. Mobile + platform sync (2026-05-17 — 2026-05-19) — KB-only AI, Halal Damu клиент, products API, Hajj layout, Gemini/VPS

Бұл бөлім **2026-05-17 — 2026-05-19** сессияларын бекітеді: өнім моделінің бөлінуі (Halal Damu vs Raqat AI), платформа **KB-only** режимі, Islamic KB индексінің масштабы, Halal экранының клиент түзетулері, halaldamu **products** API бос екені, Hajj Muftyat екі баған UI, production env/APK. Ops құжат: **`docs/operations/halaldamu-products-api-empty-2026-05.md`**, KB sync: **`docs/operations/islamic-kb-vps-sync.md`**.

### 43.0 Өнім моделі (қысқа бөлу)

| Бөлік | Дереккөз | UI / мінез |
|--------|-----------|------------|
| **Halal (halaldamu.kz)** | `GET /api/v1/halal-damu/...` прокси → `halal-bot/v1/companies` (+ products/additives) | **Каталог** — ~3700 ұйым; штрихкод/камера/AI фото; ресми реестр сілтемесі |
| **Raqat AI (Imam AI)** | Islamic KB индекс: **Fatua.kz + Muftyat.kz** (`RAQAT_ISLAMIC_KB_*`) | **Сұрақ–жауап + дереккөз сілтемелері**; еркін чат емес — **KB-only** (`RAQAT_AI_KB_ONLY=1`) |
| **Тоқтатылған / азайтылған** | Хадис/Құран батч аударма (Gemini batch) | Шығын + заңдық тәуекел азайту; хадис аударма жобасы тоқтатылды |

**Ескерту:** Raqat AI «жаңа сайт» емес — **ресми сайттардан** үзінді + URL; Halal — halaldamu **сат/реестр** деректері.

### 43.1 Platform: KB-only режим және Islamic KB масштабы

| Элемент | Мазмұны |
|---------|---------|
| **Env** | `RAQAT_AI_KB_ONLY=1`, `RAQAT_ISLAMIC_KB_ENABLED=1`, `RAQAT_ISLAMIC_KB_SOURCES=fatua,muftyat`, `RAQAT_AI_PIPELINE_STAGES=0`, `RAQAT_AI_ENABLE_GOOGLE_SEARCH=0` |
| **AI логика** | `platform_api/ai_proxy.py` — `_ai_kb_only_mode()`, `_kb_only_retrieved_and_sources()`; Құран/хадис SQLite, QA HTML, Google Search контекстінен **алынып тасталған** |
| **API status** | `GET /api/v1/ai/kb/status` → `kb_only: true`, `by_site`, `chunks` (`platform_api/ai_routes.py`) |
| **KB search** | `GET /api/v1/ai/kb/search?q=...` — мобильді каталог/іздеу (`IslamicKbSearchScreen`) |
| **Sync** | `scripts/sync_islamic_kb.py --site all`; VPS cron — **`docs/operations/islamic-kb-vps-sync.md`** |
| **Production snapshot (2026-05-19)** | `https://api.rahatomir.com/api/v1/ai/kb/status`: **enabled**, **kb_only: true**, **documents: 778**, **chunks: 4336**, **fatua: 206**, **muftyat: 572** |
| **Тест** | `tests/test_ai_kb_only_mode.py` |

§42.5-тегі бастапқы индекс (80 fatua) **§43.1** бойынша **кеңейтілген**; Muftyat sync бұрын HTTP 500 болған — кейін VPS cron/sync арқылы толтырылған.

### 43.2 Mobile: KB-only UI (Raqat AI)

| Файл | Өзгеріс |
|------|---------|
| `mobile/app.json` | `extra.raqatAiKbOnly: true` |
| `mobile/.env.production` | `EXPO_PUBLIC_RAQAT_AI_KB_ONLY=1`, `EXPO_PUBLIC_HALAL_DAMU_USE_PROXY=1`, `EXPO_PUBLIC_RAQAT_API_BASE=https://api.rahatomir.com` |
| `mobile/src/config/raqatAiKbOnly.ts` | `isRaqatAiKbOnlyClient()` — env + app.json extra |
| `mobile/src/components/RaqatKbStatusBar.tsx` | Индекс статистикасы + **«Тек Fatua.kz + Muftyat.kz»** badge (`kb_only` серверден) |
| `mobile/src/screens/RaqatAIChatScreen.tsx` | KB-only prompt; Quran/hadith staged pipeline **skip**; `RaqatKbStatusBar` |
| `mobile/src/screens/IslamicKbSearchScreen.tsx` | Halal-сияқты **тізім/іздеу** — `fetchPlatformIslamicKbSearch` → `/api/v1/ai/kb/search` |
| `mobile/src/i18n/kk.ts` | KB-only чат мәтіндері, `kbIndexed`, `halalCatalogLoadingHint` |
| `mobile/src/services/platformApiClient.ts` | `fetchPlatformAiKbStatus`, `PlatformAiKbStatus.kb_only` |
| **Тест** | `mobile/src/config/__tests__/raqatAiKbOnly.test.ts` |

**Gemini:** KB-only режимде индексте материал **болса** ғана Gemini шақырылады (үзіндіге сүйенген қысқа жауап); материал жоқ → «Fatua/Muftyat-та табылмады» (Geminiсіз).

### 43.3 Halal Damu: прокси, products API бос, клиент түзетулері (2026-05-19)

#### 43.3.1 API нақты күй (2026-05-19 тексеру)

| Endpoint | Нәтиже |
|----------|--------|
| `GET .../halal-bot/v1/companies` | **200**, ~3757 ұйым, ~3.4–4.5 МБ JSON |
| `GET .../halal-bot/v1/products` (барлық query) | **200**, `success: true`, **`items: []`**, `total: 0` |
| `GET https://api.rahatomir.com/api/v1/halal-damu/status` | **200**, прокси enabled, in-memory cache |
| Proxy latency (companies bulk) | ~2.7 с (VPS кэшпен) |

**Клиент қатесі емес:** штрихкод/өнім атауы іздеу **products** деректері пайда болғанша бос. Құжат + хат шаблон: **`docs/operations/halaldamu-products-api-empty-2026-05.md`**, **`docs/operations/halaldamu-official-partnership-letter-kk.md`**.

#### 43.3.2 Мобильді конфиг

| Айнымалы | Мағынасы |
|----------|----------|
| `EXPO_PUBLIC_RAQAT_API_BASE` / `EXPO_PUBLIC_IMAM_AI_API_BASE` | `https://api.rahatomir.com` (production) |
| `EXPO_PUBLIC_HALAL_DAMU_USE_PROXY=1` | Native: `/api/v1/halal-damu/*` |
| `EXPO_PUBLIC_HALAL_DAMU_DIRECT=1` | Проксиді **міндетті** өшіреді (production-та **қолданбаңыз**) |
| `EXPO_PUBLIC_HALAL_DAMU_URL` | `https://halaldamu.kz` (origin / fallback) |

Код: `shouldUseHalalDamuPlatformProxy()` — `api.rahatomir.com` үшін **авто** прокси (`mobile/src/api/halalDamuWp.ts`).

#### 43.3.3 Клиент түзетулері (экран «ашылмай» / қату)

| Мәселе | Шешім |
|--------|--------|
| ~4 МБ companies JSON **AsyncStorage**-қа (`COMPANIES_BULK_DISK_KEY`) — Android лимит (~6 МБ) | Bulk **дискке жазылмайды**; тек жад + кіші **page-1** кэш (`CATALOG_PAGE1_CACHE_KEY`) |
| Еski oversized bulk кэш | `purgeHalalDamuOversizedDiskCaches()` — prefetch және Halal ашу алдында oversized кэшті тазалау |
| `catalogLoading` алдымен `false` — бос экран | `HalalScreen`: бастапқы **`true`**, спиннер + `halalCatalogLoadingHint` |
| `loadCatalog` catch — қате көрсетілмейді | `setCatalogErr(halalHubNetworkErr)` + **Қайта көру** |
| `fetch().json()` BOM/бос дене | `parseHalalDamuResponseJson()` + `yieldToUi()` bulk parse алдында |
| Bootstrap | `halalHubBootstrap.ts` — prefetch алдында oversized cache purge |

| Файл | Рөл |
|------|-----|
| `mobile/src/api/halalDamuWp.ts` | API, прокси, bulk memory, page-1 cache, `purgeHalalDamuOversizedDiskCaches` |
| `mobile/src/screens/HalalScreen.tsx` | UI, loading/error, каталог |
| `mobile/src/services/halalHubBootstrap.ts` | `prefetchHalalDamuHub()` |

**Halal камера:** `POST /api/v1/ai/analyze-image` — **Gemini Vision** (`GEMINI_API_KEY` VPS-та қажет); halaldamu JSON-ға тәуелді емес.

### 43.4 Hajj — Muftyat мәтіні: KK сол / араб-transliteration оң

| Файл | Мазмұны |
|------|---------|
| `mobile/src/content/hajjMuftyatDisplay.ts` | `parseHajjMuftyatDisplaySegments()` — Оқылуы/Мағынасы блоктары, `dua` сегменттері |
| `mobile/src/components/HajjMuftyatPageText.tsx` | Екі баған UI (мағына сол, оқылуы оң) |
| `mobile/src/components/HajjMuftyatGuide.tsx` | Жаңа компонентті қолдану |
| **Тест** | `mobile/src/content/__tests__/hajjMuftyatDisplay.test.ts` |

### 43.5 Auth / bot link (қысқа)

| Endpoint | Мазмұны |
|----------|---------|
| `POST /api/v1/auth/link/code` | Bearer: 6 цифр код шығару (мобильді ↔ Telegram бот) |
| Bot | `handlers/link_code.py`, `X-Raqat-Bot-Link-Secret` |

Толығы: **§23**, `docs/platform_api/integration.md`.

### 43.6 Gemini / Google Cloud (2026-05)

| Тақырып | Күй |
|---------|-----|
| Бұрынғы шот | GCP **IslamicDataApp** — Gemini 1.5 Flash batch/chat (~$104 invoice); аккаунт **suspended** төлемегеннен |
| Шешім | Хадис/Құран **батч аударма тоқтатылды**; `RAQAT_AI_KB_ONLY=1` — контекст кіші; Budget ұсынылады ($15–25/ай) |
| Жаңа кілт | VPS `GEMINI_API_KEY` жаңартылды — `check-gemini.sh` **WORKS**; Raqat AI чат + Halal камера қайта қосылды |
| Halal без Gemini | Companies каталог, мәтіндік additives — Gemini **керек емес** |

### 43.7 APK, тест, release

| Команда | Нәтиже (2026-05-19) |
|---------|---------------------|
| `npm run build:apk` (`mobile/`) | **BUILD SUCCESSFUL** (~8 мин) |
| APK | `mobile/android/app/build/outputs/apk/release/app-release.apk` (~**154 МБ**) |
| `npm test` (`mobile/`, halalDamu pattern) | Halal тесттері OK; жинақ: **354 passed**, 1 failed (`officialHomeFeedCache.test.ts` — KB/Halal-ға байланысы жоқ) |
| Production API | `GET /health` OK; `GET /api/v1/ai/kb/status` — **§43.1** snapshot |

**Орнату:** eski app data тазалау ұсынылады (oversized halal bulk cache); бірінші Halal ашу **5–15 с** (bulk JSON parse).

### 43.8 Қауіпсіздік аудит (басталған, толық емес)

| Тақырып | Ескерту |
|---------|--------|
| `.env` / `mobile/.env` | Gitignore; жергілікті файлдарда **нақты кілттер** болуы мүмкін — rotation ұсынылады |
| `CORS_ORIGINS` default `*` | Production-та шектеу |
| `RAQAT_AI_ALLOW_ANONYMOUS=1` | AI abuse/cost тәуекелі — **§44.9:** prod **`=0`** орнатылды, anonymous → **401** |
| `network_security_config.xml` | Cleartext dev IP (мыс. VPS) — release review |
| Halal-damu proxy | Public read-only (design) |

Толық аудит **аяқталмаған** — §10 + `docs/architecture/security.md` қосу.

### 43.9 §41 басымдыққа байланыс (жаңарту)

| Бұрын P1 | Қазір |
|----------|--------|
| Muftyat semantic retrieval | **FTS индекс** production-та (572 doc); embeddings/pgvector — әлі P1/P2 |
| Halal+ штрихкод | **Блокер:** halaldamu `products` API бос — сервер жағы (**§43.3.1**) |

### 43.10 Қысқа next steps

1. Halaldamu командасына **products API** хаты (**§43.3.1** құжат).  
2. VPS: Islamic KB **cron** (`sync_islamic_kb.py --site all`) — индекс жаңарту.  
3. GCP: **Budget** + KB-only + камера-only Gemini шектеу.  
4. Қауіпсіздік: CORS, anonymous AI, secret rotation.  
5. `officialHomeFeedCache` Jest қатесін түзету (§43.7).

---

## 44. Mobile + platform hardening (2026-05-20 — 2026-05-24) — Device QA, FlashList B2, hook split, prod AI auth, VPS cron, Hatim sync

Бұл бөлім **2026-05-20 — 2026-05-24** сессияларын бекітеді: release candidate APK, құрылғыда QA чеклисті (§1–§4), Құран классикалық тізім **FlashList** + **Reanimated** audio pulse, **`QuranSurahScreen` hook split**, dashboard шапка UX, Halal crash fix, хадис hub біріктіру, prod **`RAQAT_AI_ALLOW_ANONYMOUS=0`**, VPS **cron smoke**, CI hadith KK саясаты, хатым sync автомат/QA. Толық чеклист: **`docs/mobile/changelog/2026-05-24-device-qa.md`**.

### 44.0 Production snapshot (2026-05-24)

| Тексеру | Нәтиже |
|---------|--------|
| `https://api.rahatomir.com/ready` | **backend=postgresql**, **redis=ok** |
| Halal companies (proxy) | **~3757** |
| Prod Celery async AI | **PASS** (KB-only жауап, worker active) |
| `POST /api/v1/ai/chat` (аноним) | **401** (`RAQAT_AI_ALLOW_ANONYMOUS=0`) |
| Islamic KB | **~779 doc** (cron sync жалғасады) |
| Bootstrap `POST /auth/login` (prod) | **503** — пароль env жоқ; OAuth/телефон/link-code |
| Mobile Jest | **375/375 PASS** (preflight subset **85** + hatim **23**) |

### 44.1 Ops: prod env, VPS cron smoke, Gemini probe

| Элемент | Мазмұны |
|---------|---------|
| **`scripts/vps_patch_env_production.sh`** | VPS `.env`: `RAQAT_AI_ALLOW_ANONYMOUS=0`, `RAQAT_AI_KB_ONLY=1`, Islamic KB жолдары, `RAQAT_HALAL_DAMU_ORIGIN` — құпияларды өзгертпейді |
| **`scripts/vps_cron_smoke.sh`** | 6 сағ сайын: local `/health`, `/ready`, Celery worker, public health, **`smoke_async_ai_celery.py`**, **`check_gemini_key.py`** (quota/key probe) |
| **`scripts/vps_install_cron_smoke.sh`** | Cron: `0 */6 * * * …/vps_cron_smoke.sh >> .logs/vps_smoke.log` |
| **`scripts/smoke_async_ai_celery.py`** | Async enqueue → poll; infra OK; Gemini кейде `gemini_busy` |
| **`scripts/start_local_backend.ps1`** | Windows: Docker PG `:5432`, Redis `:16379`, API `:8787`, Celery `--pool=solo`; migrate `--validate-only` skip when PG has data |
| **`platform_api/celery_app.py`** | Repo root `sys.path` fix — worker **`No module named 'db'`** жойылды |
| **`raqat-celery-worker.service`** | VPS: installed + active |

### 44.2 Mobile: FlashList B2 + audio pulse + hook split (`QuranSurahScreen`)

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/components/quran/QuranSurahAyahListRow.tsx` | Классикалық тізім жолы; **Reanimated** pulse highlight (`Animated.View`) |
| `mobile/src/quran/quranAyahListItemLayout.ts` | FlashList `estimatedItemSize` / layout helper |
| `mobile/src/quran/useAyahPlayback.ts` | Play/pause/queue, highlight state |
| `mobile/src/quran/useAyahPlaybackScroll.ts` | Аудио → scroll оркестрациясы (pause/resume қайталанбау) |
| `mobile/src/quran/useLastReadPersistence.ts` | **Жаңа:** scroll target, resume highlight, debounce/throttle save, blur flush |
| `mobile/src/screens/QuranSurahScreen.tsx` | FlashList классикалық режим; жоғарыдағы hook-тарға wiring |
| **Тест** | `quranAyahListItemLayout.test.ts`, `quranLastRead.test.ts` |

**§40.2 прогресс:** **`useAyahPlayback`**, **`useAyahPlaybackScroll`**, **`useLastReadPersistence`** — **орындалды**; **`useQuranReader`**, **`useMushafPager`**, **`useQuranNavigation`** — әлі экран ішінде (экран ~3500+ жол).

### 44.3 Mobile: Dashboard шапка (2026-05-24)

| Файл | Өзгеріс |
|------|---------|
| `mobile/src/screens/DashboardScreen.tsx` | React Navigation **`headerShown: false`**; **`HomeHeaderBar`** inline — жоғарғы бос орын жойылды |
| `mobile/src/theme/homeHeaderContrastText.ts` | `homeHeaderDateLineStyle()` — Nunito **700**, 11px |
| `mobile/src/utils/formatKkDate.ts` | `formatDashboardHeaderDateLines()` — `24 мамыр 2026` / `7 зул-хижжа 1447` (`х.ж.` / `2026 ж.` жоқ) |

### 44.4 Mobile: Halal crash fix

| Мәселе | Шешім |
|--------|--------|
| Halal экраны ашылмай crash | `HalalNearbyBlock.tsx` — **`loadedOnce`** state жоқ еді; қосылды |

### 44.5 Mobile: Hadith hub біріктіру

| Файл | Мазмұны |
|------|---------|
| `mobile/src/screens/HadithHubScreen.tsx` | KK excerpts + Sahih corpus hub |
| `mobile/src/components/hadith/HadithCrossLinkBar.tsx` | KK ↔ Sahih corpus cross-link |
| `mobile/src/i18n/kk.ts` | Hadith hub KK мәтіндері |
| **Саясат** | Sahih corpus — Arabic + citation ғана; толық KK аударма **жарияланбаған** (447 offline excerpt bundled) |

### 44.6 Hatim sync + API smoke

| Элемент | Мазмұны |
|---------|---------|
| `mobile/src/storage/hatimProgress.ts` | `syncHatimWithServerBidirectional`, push/merge, resume **local-only** |
| `mobile/src/screens/HatimScreen.tsx` | Focus → sync → reload; continue card → `openMushafAtSurah` |
| `GET/PUT /api/v1/me/hatim` | JWT міндетті (**401** аноним); `platform_api/progress_routes.py`, `db/hatim_progress_store.py` |
| **`scripts/dev_test_hatim_auth_api.py`** | Temp SQLite smoke (PG env оқшаңдалған); GET/PUT/GET roundtrip |
| **`scripts/smoke_hatim_api.py`** | Prod/local HTTP smoke (пароль env) |
| **`scripts/smoke_platform_api.py`** | **`--hatim`** — login кейін hatim roundtrip |
| **Jest** | `hatimProgress.test.ts` (13), `hatimJuzProgress`, `hatimListScroll`, `hatimSurahSearch` — **23 PASS** |
| **Prod manual QA** | Bootstrap пароль жоқ → **Google/Apple/телефон** логин; 2 құрылғы merge — **MANUAL** |

### 44.7 CI / pytest: hadith KK quality

| Файл | Өзгеріс |
|------|---------|
| `tests/test_hadith_kk_quality.py` | Бүкіл класс **`@unittest.skipUnless(RAQAT_HADITH_KK_TRANSLATIONS_PUBLISHED=1)`** — CI default **6 skipped**; саясат: KK аударма жарияланғанша enforce емес |

### 44.8 Device QA чеклист + preflight

| Артефакт | Мазмұны |
|----------|---------|
| **`docs/mobile/changelog/2026-05-24-device-qa.md`** | §1 Quran (FlashList/pulse), §2 Halal, §3 Hadith hub, §4 Hatim sync; ops кестесі |
| **`scripts/mobile_device_qa_preflight.ps1`** | Jest (quran/hadith/halal/hatim), APK өлшемі, `/ready`, anonymous AI **401**, `dev_test_hatim_auth_api.py` |
| **APK** | `mobile/apk-download/raqat-release-latest.apk` (~**155 MB**); `npm run build:apk` |
| **§1–§4 UI** | Dev машинада **`adb` жоқ** — физикалық құрылғыда **MANUAL** (`adb install -r …`) |

### 44.9 §41 / §43.8 жаңарту

| Бұрын | Қазір (2026-05-24) |
|-------|---------------------|
| `RAQAT_AI_ALLOW_ANONYMOUS=1` тәуекелі (**§43.8**) | Prod **`=0`**; anonymous AI **401** |
| P0 FlashList + hook split (**§41.1**) | **Ішінара орындалды** — FlashList B2 + 3 hook; экран толық split әлі ашық |
| P0 account sync / Hatim | API + клиент sync логикасы бар; prod QA — OAuth логин |
| CI hadith KK FAIL | **Skipped** by policy flag |

### 44.10 Қысқа next steps

1. **Құрылғыда** §1–§4 Device QA толтыру (`2026-05-24-device-qa.md`).  
2. Prod bootstrap login (опция): `RAQAT_AUTH_PASSWORD_BCRYPT` немесе smoke-only user — hatim/API автомат smoke үшін.  
3. `QuranSurahScreen` қалған hook-тар (**§40.2**): `useQuranReader`, `useMushafPager`, `useQuranNavigation`.  
4. Halaldamu **products API** — **§43.3.1** блокер сақталған.  
5. Gemini **alerting** (cron WARN → Slack/email) — quota probe бар, dashboard жоқ.

---

## 45. Genealogy P0/A1 (2026-05-24 — 2026-05-25) — қазақ шежіресі, API, bundled offline, PG graph engine

Бұл бөлім **GENEALOGY-P0** sprint-ін бекітеді: «Дін мен дәстүр» астындағы **Шежіре** (3 жүз + 11 ру/тармақ = **14 node**), SQLite P0 adjacency list, PostgreSQL A1 DAG (LTREE + closure), public read API, мобильді FlatList accordion + breadcrumbs, offline bundled snapshot. Sprint tracker: **`docs/roadmap/genealogy-sprint-p0.md`** (күй: **P0 complete**). Handoff: **`docs/handoff/genealogy-p0-handoff.md`**. Schema lock: **`docs/genealogy_a1_production_lock.md`**.

### 45.0 Scope және тыйым (P0)

| Рұқсат | Тыйым |
|--------|--------|
| Read-only иерархия, дереккөз citation (`source_key`) | User-generated tree / social graph |
| FlatList + accordion + breadcrumbs (offline JSON) | WebView-heavy hierarchy UI |
| P0 SQLite seed + A1 PG parallel add | AI генерация без `source_key` |

### 45.1 P0 schema (SQLite, migration v20)

| Элемент | Файл / сипат |
|---------|----------------|
| Кестелер | `genealogy_clans` (slug PK, adjacency), `genealogy_source_refs` |
| DDL | `db/genealogy_schema.py` — `ensure_genealogy_tables()` |
| Миграция | **`db/migrations.py` v20** — `_migration_020_genealogy_clans` |
| Seed | `db/genealogy_seed.py` — 14 node; `scripts/seed_genealogy_p0.py` |
| Дереккөздер | `sources/genealogy_sources.md` (Mäshhür, Shäkärim, QR NAS citation кілті) |
| Schema doc | `docs/genealogy_schema.md` |

### 45.2 A1 production graph engine (PostgreSQL only)

| Принцип | Lock |
|---------|------|
| Truth | `genealogy_edges` = authoritative parent→child |
| Path | `ltree` materialized path + `genealogy_closure` |
| IDs | **UUIDv7** (`db/genealogy_uuid.py`); **`slug`** — public API key |
| Cycle | Hot-subtree sync check; full async verify (`db/genealogy/cycle_detector.py`) |
| Cache | Redis tag-based (`db/genealogy/cache_manager.py` — no `scan_iter`) |

| Модуль | Мазмұны |
|--------|---------|
| SQLAlchemy | `db/models/genealogy.py`, `db/models/base.py` |
| Alembic | `alembic.ini`, `db/alembic/env.py`, `db/alembic/versions/001_genealogy_ltree.py` |
| Services | `db/genealogy/importer.py`, `path_updater.py`, `lca_engine.py`, `repository.py`, `synthetic.py` |
| Seed PG | `scripts/seed_genealogy_a1.py` (`--synthetic 10000` perf gate) |
| Synthetic | `scripts/generate_genealogy_synthetic.py` |

**Deploy (prod PG):**

```bash
export DATABASE_URL=postgresql://...
python -m alembic -c alembic.ini upgrade head
python scripts/seed_genealogy_a1.py
```

### 45.3 Platform API (read-only, public)

| Метод | Жол | Сипат |
|--------|-----|--------|
| GET | `/api/v1/genealogy/clans` | Query `parent` — children; parent жоқ → level-1 жүз тізімі |
| GET | `/api/v1/genealogy/clans/{slug}` | Detail + breadcrumbs + `source_refs` |

Код: `platform_api/genealogy_routes.py` → `platform_api/main.py` (`include_router`). Repository: A1 PG when `DATABASE_URL` set; **P0 SQLite fallback** (`db/genealogy/repository.py`).

### 45.4 Mobile

| Файл | Мазмұны |
|------|---------|
| `mobile/src/screens/GenealogyClansScreen.tsx` | FlatList accordion, breadcrumb stack, API + offline fallback |
| `mobile/src/services/genealogyApi.ts` | `fetchGenealogyChildren`, `fetchGenealogyClanDetail` |
| `mobile/assets/bundled/genealogy-p0.json` | 14 node offline snapshot (`scripts/export_genealogy_bundled.py`) |
| `mobile/src/screens/KazakhTraditionScreen.tsx` | «Шежіре» accordion + «Шежіре ашу» CTA |
| `mobile/src/navigation/MoreStack.tsx` | `GenealogyClans` screen |
| `mobile/src/navigation/linking.ts` | Deep link: `imamai://more/genealogy` |
| `mobile/src/i18n/kk.ts` | `genealogyTitle`, `traditionGuide.sectionGenealogy*` |

**UX шектеуі (P0):** nested ScrollView жоқ; accordion бір уақытта бір тармақ; offline режимде bundled JSON.

### 45.5 Тесттер және CI

| Тексеру | Нәтиже |
|---------|--------|
| `tests/test_genealogy_schema.py` | P0 DDL + seed |
| `tests/test_genealogy_repository.py` | SQLite list/detail (3 roots, breadcrumbs) |
| `tests/test_genealogy_uuid.py` | UUIDv7 time-order |
| `tests/test_genealogy_cycle_detector.py` | Hot-subtree + closure |
| `tests/test_genealogy_api.py` | FastAPI TestClient (SQLite fallback) |
| `mobile/.../genealogyBundledP0.test.ts` | 3 roots + 14 nodes integrity |
| **Жалпы (2026-05-25)** | Python genealogy: **11 PASS**; Jest bundled: **2 PASS** |
| CI | `.github/workflows/refactor-smoke.yml` — genealogy compile + pytest |

### 45.6 Device QA + ops (§G1–G4)

Толық чеклист: **`docs/mobile/changelog/2026-05-25-genealogy-p0-qa.md`**.

| # | Сценарий | Критерий |
|---|----------|----------|
| G1 | «Дін мен дәстүр» → «Шежіре ашу» | 3 жүз (Ұлы / Орта / Кіші) |
| G2 | Ұлы жүз → Ұйсін → Дулат | Breadcrumb + accordion |
| G3 | Uçak режим | Offline bundled; қате banner жоқ |
| G4 | `imamai://more/genealogy` | Тікелей экран |

**Feature freeze:** sprint **feature-freeze-2026-06** апта 2-де белгіленді; P0 scope freeze ережесіне сәйкес (read-only контент, жаңа интеграция жоқ).

### 45.7 §41 / freeze жаңарту

| Элемент | Күй (2026-05-25) |
|---------|-------------------|
| «Дін мен дәстүр» контент кеңеюі | **P0 sprint complete** — шежіре read API + mobile |
| Prod PG A1 tables | **Deploy pending** — Alembic + `seed_genealogy_a1.py` VPS-те |
| Celery async (`verify_dag_integrity`, `rebuild_subtree`) | **P1** — documented, not wired |
| 10k synthetic perf gate | Script ready; PG орта керек |

### 45.8 Қысқа next steps

1. **VPS:** `alembic upgrade head` + `seed_genealogy_a1.py` — API PG source of truth.  
2. **APK build** — «Дін мен дәстүр → Шежіре» UI құрылғыда §G1–G4.  
3. **P1:** source citation UI per clan; Celery integrity jobs; user tree — **scope тыйым**.

---

## 31. Mobile `src/` — Feature-Sliced құрылым ұсынысы (жоспар, 2026-05)

Бұл бөлім **қазіргі репода орындалмаған**, келесі рефакторинг үшін **бір мәнді нұсқа картасы**. Мақсаты: Құран/мұсаф логикасын `screens/` ішінен шығарып, **feature-бойынша** оқуға ыңғайлы қалтаға жинақтау; §29 жоспарымен үйлеседі.

**Ескерту (Expo түбірі):** қазір провайдерлер мен `GestureHandlerRootView` көбінесе **`mobile/App.tsx`** ( `src/` сыртында). Төмендегі `src/app/` — **миграция нәтижесіндегі** нұсқа; Expo Router (`app/` file-based routes) енгізілсе, атауларды қайта қарау керек — шатасуды болдырмау үшін PR-да «провайдер қалтасы» атауын нақтылау ұсынылады.

### 31.0 Кезеңділік — алдымен мазмұн, кейін қалта (әдепкі ұсыныс)

§31.1 астындағы ағаш — **мақсаттық нұсқа**; оны бірден толық көшіру **міндетті емес**. Теңгерімді жол:

| Кезең | Не істейміз | Неге |
|--------|-------------|------|
| **A — мазмұнды бөлу** | `QuranSurahScreen.tsx` → **§40.2**-дегі hook шектері (`useQuranReader`, `useAyahPlayback`, т.б.) немесе экрандағы ірі блоктарға сәйкес аралық hook-тар; логиканы `components/quran/` және бар `mobile/src/quran/` (`useMushafStyles` т.б.) арқылы ұйымдастыру; **`features/quran/` қалтасын ашпай-ақ** | Пайда шұғыл: экран қысқарады, тест пен review оңай; импорт дауылы аз |
| **B — қалта атауы** | Hook-тар мен Құранға тән код **тұрақталғаннан кейін** бір немесе екі PR-мен `features/quran/` ашу, файлдарды көшіру, `index.ts` barrel, импорт жолдарын жаңарту | Көшіру механикалыққа жақын болады; регрессияны шектеу оңай |
| **C — спринт 2–3** | Store (zustand), audio sync, FlashList, paper, bookmarks (§31.3) | Инфрақұрылым дайын болған соң тиімдірек |

**Спринт 1-дің жартысы:** тек **A кезеңі** — ірі экранды жеңілдету; §31.1 схемасы құжатта мақсат ретінде тұра береді.

### 31.1 Ұсынылатын қалта құрылымы (`mobile/src/`)

Түбір: `mobile/src/` (бастапқы схемадағы `Bashmobile` — **mobile** түбірінің қате жазылуы).

```
mobile/src/
├── app/                          # (миграция) Root: провайдерлер, NavigationContainer, GestureHandlerRootView — қазіргі App.tsx логикасының бір бөлігі
├── assets/                       # Суреттер, иконкалар, fonts, svg (бар күйде көбінесе mobile/assets/)
├── components/                   # Ортақ, қайта пайдалануға болатын UI
│   ├── common/                   # Button, Card, BottomSheet, LoadingSpinner, т.б.
│   ├── quran/                    # Құранға қатысты ортақ UI (экраннан тыс)
│   │   ├── MushafAyah.tsx
│   │   ├── MushafAyahRow.tsx
│   │   ├── AyahContextMenuSheet.tsx
│   │   ├── SurahHeader.tsx       # (жоспар — §28.1 №3)
│   │   ├── MushafPage.tsx        # болашақ: horizontal page бірлігі
│   │   └── MushafPaperTexture.tsx # болашақ: paper grain (§29.2); бұрынғы `MushafPaperVignette` **жойылған** (§32.2)
│   ├── hatim/
│   ├── prayer/
│   └── ui/                       # Toast, ErrorBoundary, ModalWrapper
│
├── features/                     # Feature-Sliced: домен логикасы + feature UI
│   ├── quran/
│   │   ├── api/                  # Құранға қатысты platform шақырулары (немесе `services/` қайта экспорт)
│   │   ├── components/           # Тек осы feature үшін компоненттер
│   │   ├── hooks/                # useMushafReader, useQuranAudio, useLastRead, useMushafStyles көшірмелері
│   │   ├── store/                # zustand slice (reader prefs, audio UI state) — **2-спринт**; қазір репода `zustand` жоқ, қосу керек
│   │   ├── types.ts
│   │   ├── utils/
│   │   └── config.ts             # mushafConfig.ts логикасының орны (көшіру)
│   ├── hatim/
│   ├── audio/                    # Ортақ аудио плеер / sync абстракциясы
│   ├── settings/
│   └── bookmarks/                # келесі фаза
│
├── config/                       # Глобалды: theme, apiBase, env-ке байланысты емес константалар
├── hooks/                        # Жалпы hooks (useDebounce, useOrientation, т.б.)
├── lib/                          # Utils, formatters, validators
├── navigation/                   # Stacks, Tabs, deep linking
├── screens/                      # Экрандар — жұқа: composition + feature hook шақыру
├── services/                     # platformApiClient, желілік қабат
├── storage/                      # Жалпы AsyncStorage wrapper; **Құран prefs** ұзақ мерзімде features/quran/storage/ ішіне шолуға болады
├── store/                        # Глобалды root store (zustand) — енгізілген соң
├── styles/                       # theme, colors, spacing, typography (бар болса кеңейтіледі)
├── types/                        # Глобалды TS типтері
├── data/                         # Қазіргі: quranAyahCounts, Hafs JSON, hizb — feature көшіргенше осында қалуы мүмкін
└── utils/
```

**Қазіргі ағашпен сәйкестік (қысқа):** `config/mushafConfig.ts`, `quran/useMushafStyles.ts`, `components/quran/*`, `storage/quranReaderPrefs.ts`, `storage/quranLastRead.ts`, `data/quranHafs*.ts` — төмендегі спринт бойынша `features/quran/` және `components/quran/` арасында бөлінеді.

### 31.2 Негізгі принциптер (миграция кезінде сақтау)

| Принцип | Қолдану | Пайда |
|---------|---------|-------|
| **Feature-Sliced** | `features/quran/`, `features/hatim/` | Масштабтау оңай |
| **Colocation** | Компонент + hook + types бір feature ішінде | Оқуға ыңғайлы |
| **Barrel exports** | Әр маңызды қалтада `index.ts` | Импорт таза (`from '@/features/quran'`) |
| **Single source** | Reader prefs: `features/quran/store/` + сыртқы `storage/` шешімі бір PR-да белгіленеді | Конфиг шашылмайды |
| **Қабаттар** | UI → hooks → store → services → API | Тесттеу және өзгерту жеңіл |

### 31.3 Ұсынылатын жоспар (2–3 спринт)

#### Спринт 1a — экранды жеңілдету (алдымен, §31.0 A)

- `QuranSurahScreen.tsx` ішіндегі ірі логиканы hook-тарға шығару (мысалы `useMushafReader`, `useQuranAudioScroll` / `useQuranSurahListScroll` — нақты атаулар PR-да белгіленеді).
- `components/quran/` және `quran/` ішінде **colocation** (бірге орналасу) принципін күшейту; **файл жолы өзгермейді** немесе минималды болады.
- Мақсат: экран **composition** қалпына жақындасады; §29.1 жоспарына техникалық дайындық.

#### Спринт 1b — `features/quran/` физикалық көшіру (қалағанда, §31.0 B)

- `features/quran/` қалтасын ашу.
- Көшіру/импорт жаңарту (бір немесе бірнеше шағын PR):
  - `config/mushafConfig.ts` → `features/quran/config.ts` (немесе `features/quran/config/mushaf.ts`).
  - `quran/useMushafStyles.ts` → `features/quran/hooks/useMushafStyles.ts`.
  - `components/quran/*` → `features/quran/components/` **немесе** ортақ UI ретінде `components/quran/` қалдыру — шешім: экранға тән логикасы бар файлдарды feature ішіне жылжыту.
  - `storage/quranReaderPrefs.ts`, `storage/quranLastRead.ts` → `features/quran/storage/` немесе re-export (`storage/` ескі импортты уақытша сақтайды).
- `features/quran/index.ts` — **barrel**.

#### Спринт 2 — state + audio

- `features/quran/store/quranReaderStore.ts` (**zustand** пакетін қосу + кіші slice: nav mode, density, last read UI mirror, audio playing indices).
- `features/audio/` — ортақ ойнату күйі (expo-av орағы).
- `useQuranAudioSync` — уақыт белгілерімен highlight (§29.2, §29.2.1).

#### Спринт 3 — performance + polish

- `QuranSurahScreen` тік тізімінде **FlashList** (§29.2, §30.3).
- **Paper texture** + кеңейтілген бет эффектілері (`MushafPaperTexture` / §29.1.2).
- **Bookmarks** feature бастау (`features/bookmarks/`).

### 31.4 §28–§29-пен байланыс

| Құжат бөлімі | §31 рөлі |
|--------------|----------|
| §29.1–29.2 deliverable-тер | Спринт 2–3 мазмұнымен тікелей үйлеседі; **1a** экранды оқуға ыңғайлы етеді; **1b** механикалық қалта көшіруі. |
| §30 (Хафс JSON, prefs кілттері) | `data/quranHafs*.ts` және prefs файлдары көшірілгенше **импорт жолдарын** жаңарту; мазмұн өзгермейді. |
| **§33** (Фаза 1 жол картасы) | Бірінші 1–2 айлық пакетті орындау кезінде **A → B → C** кезеңдері (§31.0) мен §29 спринттерін сәйкестендіру. |
| **§34–§35** (Фаза 2–3) | Retention хаб пен scale; §31/§27/§22-пен үйлесетін орта/ұзақ мерзімді өнім жол картасы. |
| **§36–§38** | Техникалық ұсыныстар, **2 апта MVP** тізімі, **болашақ позициясы** (бір экранда шолу). |
| **§24.0** | Фазалар **§33–§38** индекс кестесі мен диаграмма — **§24** бөлімінде; осы § кейін файлда **§33** басталады. |
| **§24.0.1** | Windows PowerShell командалары + GitHub Actions (`refactor-smoke`, `content-release-smoke`) — **§24** бөлімінде. |

## 33. Фаза 1: Core Polish (1–2 ай, қазірден баста)

**Индекс:** барлық фазалардың шолу кестесі — **§24.0**. **Өнім ұстанымы** (адамға жеңіл · оңай · керек) — **§1**, **§38**.

Бұл бөлім **бірінші ірі фазаның** жинақталған жол картасы: **қазірден** бастап 1–2 ай ішінде мобильді **ядро тәжірибесін** жақсарту (мұсаф, хатым, оқу үздіксіздігі, намаз/құбыла, жалпы UI). Толық техникалық бөлшектер: **§26–§32** (орындалған негіз), **§29** (спринт deliverable-тері), стратегиялық тақырыптар — **§28**, қалта рефакторы — **§31**, бәсекелес идеялар — **§1.0**. Платформа API **бұл фазада міндетті емес** (мысалы **отбасылық хатым** sync — кейінгі фазаға қалдырылуы мүмкін).

### 33.1 Мұсаф оқу

| Бағыт | Мазмұн | Құжат / код орны |
|--------|--------|------------------|
| **Горизонталь бет** | **Reanimated** арқылы бетке **snap**, velocity threshold; қазіргі RNGH `FlatList` + `pagingEnabled` негізі | **§29.1.2**, **§26.8.4**, **§29.2.1** |
| **Қағаз текстурасы** | Subtle **SVG noise** (немесе жеңіл overlay), opacity ~0.04–0.06 | **§29.2**, **§28.4** |
| **Pinch zoom** | Кем дегенде **араб кластері** үшін масштаб (техникалық шектеулер — **§28.2**) | **§28.2** |
| **Bookmark** | Түсті **индикатор** + **ескертпа** (`AyahContextMenuSheet`, маркер деректері) | **§29.1.1**, **§29.1.3** |
| **Аудио синхрон** | **Timestamp** негізіндегі ойнату + **сөз/сегмент highlight** (Tarteel-тәрізді терең UX) | **§29.2**, **§29.2.1**; база скролл — **§26.7.1** |
| **Типография** | **Dynamic lineHeight** + кітапты **Scheherazade** пресеттері (`mushafBookLike`, тығыздық) | **§26.7.3**, **§32.3**, **§26.8.2** / **§26.8.5** |

### 33.2 Last Read + Continue

| Бағыт | Мазмұн | Сілтеме |
|--------|--------|---------|
| **Карточка** | `QuranListScreen` ішінде **«Соңғы оқуға оралу»** + жалғастыру ағыны | **§26.7.4**, **§28.1** Mushaf №5 (минимум орындалған; UX тереңдету фазада) |
| **Streaks** | Күнделікті оқу **сериясы** (күнтізбе / санақ UI) — **§1.0** (Tarteel/Pillars идеясы); дерек: локалды prefs → кейін опциялы sync |

### 33.3 Хатым

| Бағыт | Мазмұн | Сілтеме |
|--------|--------|---------|
| **30 juz визуал** | **Book filling** прогресс (торақ + толтырылу эффектісі) | **§32.4** (тор + скролл), **§28.1** Hatim №1 |
| **Отбасы / ортақ хатым** | Бірнеше қатысушы, таб немесе сегмент; **дерек моделі + сервер** шешімі | **§28.1** Hatim №3 |
| **Аяқталу** | Анимация + **қысқа дұға** мәтіні | **§28.1** Hatim №4 |

### 33.4 Намаз / Құбыла

| Бағыт | Мазмұн | Сілтеме |
|--------|--------|---------|
| **Сенсор** | Құбыла **дәлдік / тұрақтылық** тюнингі (OEM айырмашылығы) | **§25.3**, **§27.3** |
| **Prayer tracker** | Pillars-тәрізді **күнделікті намаз бақылауы** (көрнекі прогресс) — жаңа экран немесе басты бет модулі; **§1.0** |
| **Дәрет нұсқаулығы** | Wudu қадамдары, инфографика | **§32.6** ассеттер, `ContentGuideScreens.tsx` |

### 33.5 UI / UX

| Бағыт | Мазмұн | Сілтеме |
|--------|--------|---------|
| **Караңғы тема** | «Қағаз» polish, subtle noise | **§28.2**, **§29.2** |
| **Ою** | Қазақ орнаменттері (хатым, мұсаф баннер — жоспар) | **§32.4**, **§28.1** Mushaf №3, **§28.4** |
| **Минимализм** | Таза оқу беті (Quran.com-ға ұқсас сызықтылық) | **§32.2**, **§1.0** |

### 33.6 §29-пен сәйкестендіру

| Фаза 1 блок | §29 спринт |
|-------------|------------|
| Мұсаф polish (snap, texture, bookmark, Reanimated highlight) | **§29.1** |
| Аудио sync + FlashList + paper overlay | **§29.2** |

Келесі фазалар: **§34** (retention хаб), **§35** (AI + scale), **§36** (техника), **§37** (2 апта MVP), **§38** (позициялау) — қысқаша **§24.0**.

## 34. Фаза 2: All-in-One Retention (2–4 ай)

**Индекс:** **§24.0**. Алдыңғы фаза: **§33**.

Мақсаты: пайдаланушы **күн сайын** оралатын **бір хаб** — RAQAT-ты тек Құран немесе тек намаз емес, **бір орталық companion** ретінде бекіту. Фаза 1 (§33) аяқталған соң немесе параллель шағын командамен іске асыруға болады; **платформа** (JWT, metadata sync, Redis) белсенді болуы тиімді.

### 34.1 Күнделікті хаб (`DashboardScreen`)

| Тірек | Мазмұн | Техника / сілтеме |
|--------|--------|-------------------|
| **Үш баған** | **Намаз уақыты** + **күнделікті аят** + **AI бір сұрақ** (күнделікті карточка немесе FAB ағыны) | `DashboardScreen.tsx`, `PrayerTimesScreen` / API; Құран дерегі; **`platform_api`** AI proxy (**§1**, **§22**) |
| **Streaks + әдет** | Құран оқу, намаз, **тәсбих** бойынша tracker; Pillars/Tarteel идеясы (**§1.0**) | Локалды state + кейін **бір identity** бойынша sync |
| **Күнделікті мазмұн** | **99 есім**, күнделікті **хадис**, кездейсоқ **дуа** | `AsmaAlHusnaScreen.tsx`, хадис тізімі / metadata, `duasCatalog` т.б. |

### 34.2 Тәсбих / Dhikr

| Бағыт | Мазмұн |
|--------|--------|
| **Smart counter** | Санаттар, дыбыс (опция), **сауап/түсініктеме** мәтіндері |
| **Тарих** | Сессиялар, жиынтық санау — кейін статистика виджетімен байланыстыру |

### 34.3 Halal+

| Бағыт | Мазмұн | Сілтеме |
|--------|--------|---------|
| **Қазіргі база** | Штрихкод / **AI фото** (өнім бойынша қайта қосу) | **§25**, **§30.4**, `HalalScreen.tsx`, `halalDamuUrl.ts` |
| **Кеңейту** | **Mosque finder**, **жергілікті іс-шаралар** | Сыртқы дерек немесе `platform_api` гео-агрегация; **§1.0** IslamicFinder идеясы |

### 34.4 AI чат

| Бағыт | Мазмұн |
|--------|--------|
| **Контекст** | **Соңғы оқылған аят**қа сілтеме; ағымдағы сүре/аяттан **«түсіндір»** |
| **Тәпсір** | Жекелендірілген түсіндіру (дерек көзі көрсетілген); **fiqh** бойынша **disclaimer** (қауіпсіз формулировка, устазға жүгіну) |

### 34.5 Community lite

| Бағыт | Мазмұн |
|--------|--------|
| **Дұға** | **Анонимді** бөлісу (модерация саясаты жоспарланады) |
| **Прогресс** | Оқу/намаз прогрессін бөлісу — **privacy-first** (опция, минималды PII) |

## 35. Фаза 3: Advanced + Scale (4–8 ай)

**Индекс:** **§24.0**. Алдыңғы логикалық қадам: **§34** (§33 ядросы аяқталған соң толық көшу оңай).

Мақсаты: **AI тереңдігі**, **ойындандыру**, **офлайн-бірінші** синхрон, **көп платформа**, **монетизация** — PostgreSQL + Redis + Celery инфрасы **§27**, **§24.3**, **`PRODUCTION_POSTURE.md`** негізінде тұрақты болуы керек.

### 35.1 AI мүмкіндіктері

| Мүмкіндік | Сипат |
|-------------|--------|
| **Оқу түзету** | Tarteel-тәрізді **тәжуид / оқу** кері байланыс (аудио + модель) |
| **Жеке жол** | Жаттау: **spaced repetition** кестесі, мақсаттар |
| **Дауыс** | Дауыспен **дуа** / **тәпсір** түсіндіру (TTS + контекст) |

### 35.2 Gamification

| Элемент | Ескерту |
|---------|---------|
| **Badges**, **leaderboard** | **Локалды** немесе бүркемелі атау; **құпиялылық әдепкі бойынша** жоғары |
| **Рамазан** | Маусымдық челленджлер, арнайы dashboard режимі |

### 35.3 Offline-first

| Бағыт | Сілтеме |
|--------|---------|
| **Толық синк** | `GET /api/v1/metadata/changes`, **ETag** / incremental — **§1.3** |
| **Bundled seed** | Офлайн Құран / бастапқы мазмұн — **§22.3** |

### 35.4 Көп платформа

| Бағыт | Мазмұн |
|--------|--------|
| **Web PWA** | `web/`; бір **identity** |
| **Telegram** | Бот **терең интеграция** — `POST /auth/link/telegram`, тарих **§1.2**, **§23** |

### 35.5 Monetization

| Арна | Мазмұн |
|------|--------|
| **Донат** | `raqatDonationUrl`, баптаулар — **§24.6** |
| **Premium** | Темалар / дауыстар, **ads-free** |
| **Waqf** | Ұзақ мерзімді қайырымдылық моделі (құқық + коммуникация жоспары) |

## 36. Техникалық ұсыныстар (қазіргі кодқа сәйкес)

**Индекс:** **§24.0**. Қамтитын фазалар: **§33**–**§35**; шұғыл тапсырмалар: **§37**; стратегия: **§38**.

Төмендегі тізім **§33–§35** іске асыру үшін инженерлік бағыт: репода бар кіріктіру нүктелеріне сілтеме. **§1** ұстанымы (адамға **жеңіл · оңай · керек**) — архитектура таңдауында тірек ретінде ұсталады.

### 36.1 Mobile

| Ұсыныс | Сілтеме |
|--------|---------|
| **Feature-Sliced** — `features/quran/`, `features/hatim/` т.б. | **§31** (A → B → C кезеңі) |
| **FlashList** ұзын сүрелер | **§29.2**, **§30.3** |
| **Reanimated + RNGH** толық пайдалану | **§26.8**, **§29.1.2** |

### 36.2 Backend

| Ұсыныс | Сілтеме |
|--------|---------|
| **PostgreSQL cutover** (өндірісте SQLite емес) | **§27**, **`PRODUCTION_POSTURE.md` §1**, `MIGRATION_SQLITE_TO_POSTGRES.md` |
| **Redis** — rate limit, cache, queue | **§24.3**, **`PRODUCTION_POSTURE.md` §2, §5** |
| **Celery** — async AI, фондық жұмыстар | **§24.3**, `celery_tasks.py` |

### 36.3 Data

| Ұсыныс | Сілтеме |
|--------|---------|
| **Хафс 604 + жергілікті PageList** | **§30.2**, **§32.1** |
| **Hadith KK** жалғастыру | **§24.5**, **§18**, `HADITH_DATA_PROVENANCE.md` |

### 36.4 Privacy / Security

| Ұсыныс | Сілтеме |
|--------|---------|
| **JWT бір identity** | **§1.2**, **§5.4**, **§23** |
| **Минималды дерек жинау** | Өнім шешімі + саясат мәтіні |
| **Ашық бөліктер** (мысалы Quran.com стиліндегі дерек/open tooling) | Құран мәтіні лицензиясы мен репо саясаты бойынша |

### 36.5 Performance

| Ұсыныс | Сілтеме |
|--------|---------|
| **UI defer** | **§22.3**, `utils/uiDefer.ts` |
| **Ауыр жұмыс** | Фонда (`InteractionManager`, native module, Celery) |

## 37. Келесі 2 апта: MVP boost (нақты тапсырмалар)

**Индекс:** **§24.0**. **§33** ядросымен **қатар** іске асырылады.

Фаза 1 (§33) ішінен **шұғыл нәтиже** беретін пакет; PR-ларды бөлек ұсынылады.

| № | Тапсырма | Сілтеме / файл |
|---|----------|----------------|
| 1 | **`MushafAyah`**: Reanimated **ойнату highlight** + **bookmark** индикаторы | **§29.1.1** |
| 2 | **`DashboardScreen`**: **streaks** UI + **күнделікті хадис** тайлы (немесе карточка) | **§34.1**, хадис дерегі |
| 3 | **Prayer tracker** (минималды) + **дәрет** визуал нұсқаулық (**§32.6** ассеттер) | **§33.4** |
| 4 | **`SettingsScreen`**: Құран **тығыздығы** + **оқу режимі** + **last read** toggle-тарын кеңейту / топтау | **§29.1.4**, **§26.8.5** |
| 5 | **AI чат**: ағымдағы **сүре/аят** контекстімен **«осы аятты түсіндір»** (жүйелік prompt + user message) | **§34.4**, `platform_api` AI маршруттары |

## 38. RAQAT болашағы (позициялау)

**Индекс:** **§24.0**.

**Мақсатты образ:** **қазақ / ТМД мусылмандары үшін ең ыңғайлы, бір орталық ислам companion** — әрқайсысы үшін **ең жеңіл**, **ең оңай**, **ең керек** тәжірибе (§1 ұстанымы). Muslim Pro-ның **ыңғайлылығы** (намаз, хабарлама, құбыла, күнделікті әдет) + Quran.com-ның **таза оқу тәжірибесі** + Tarteel-дің **AI-ы** (оқу, жаттау, уақыт бойынша синхрон) + RAQAT-тың **жергілікті мазмұны** (**KK** аударма, **Хафс 604**, **хатым**, хадис/дуа экожүйесі). Техникалық тірек: **§36**; алғашқы қадам: **§37** + **§33**; жол картасын шолу: **§24.0**.

## GPT-ге қалай жіберу (ChatGPT, Claude, Cursor, т.б.)

### Ең қарапайым жол

1. Осы файлды ашыңыз: **`docs/PLATFORM_GPT_HANDOFF.md`** (толық мәтінді көшіріп жіберіңіз **немесе** тіркеме ретінде беріңіз).
2. Өнім стратегиясы керек болса, қосымша: **`docs/RAQAT_PLATFORM.md`** (солтүстік жұлдыз, XI–XII).
3. Хабарламада мынаны жазыңыз: *«Контекст — төмендегі RAQAT брифі. Менің тапсырмам: …»* және нақты сұрақты қосыңыз.

### Тереңдету пакеті (қажетіне қарай)

| Деңгей | Файлдар |
|--------|---------|
| **Минимум** | `PLATFORM_GPT_HANDOFF.md` |
| **+ мобильді Құран: мұсаф бет нөмірі, Хафс JSON, FlashList pin** | осы файл **§30** |
| **+ mobile/src Feature-Sliced рефактор жоспары** | осы файл **§31** |
| **+ өнім жол картасы (фазалар 1–3, MVP 2 апта, техника)** | осы файл **§24.0** (индекс), содан **§33**–**§38**; **§24.0.1** (Win/CI) |
| **+ өнім** | `RAQAT_PLATFORM.md` |
| **+ Құран мазмұны** | `QURAN_GPT_HANDOFF.md` |
| **+ Auth / JWT / тарих** | `PLATFORM_ROADMAP_API_AI_USERS.md` |
| **+ PostgreSQL көшу** | `MIGRATION_SQLITE_TO_POSTGRES.md` |
| **+ локальды тексеру** | `DEV_LOCAL_CHECKLIST.md` |
| **+ экожүйе карта + 2M blueprint** | `ECOSYSTEM.md` (түбір), `PRODUCTION_BLUEPRINT_2M_USERS.md`, `apps/`, `packages/`, `infra/docker/` |
| **+ Alembic / PG audit DDL** | `ALEMBIC_BOOTSTRAP.md` |
| **+ өндіріс стегі (Redis, PG, Celery, DNS, metrics)** | `OPERATIONS_STACK_CHECKLIST.md`, `scripts/ops_stack_checklist.sh` |
| **+ өндіріс аудитіне жауап (SQLite жоқ, Redis міндетті, monitoring/cache/Celery)** | `PRODUCTION_POSTURE.md` |
| **+ толық сілтеме картасы (барлық тақырып бір кестеде)** | осы файл **§24** |

### Жібермеу керек

- `.env`, нақты **BOT_TOKEN**, **GEMINI_API_KEY**, **RAQAT_JWT_SECRET**, **RAQAT_AI_PROXY_SECRET**, пароль хэштері.
- Клиентке арналған **құпияны** өндірісте чатқа қоймаңыз; тек орын атауы (мысалы *«RAQAT_AI_PROXY_SECRET орнатылған»*) жеткілікті.

### Бір жолдық сұраныс үлгісі (көшіріп қолдану)

```text
Төменде RAQAT платформасының инженерлік брифі (docs/PLATFORM_GPT_HANDOFF.md) беріліп тұр.
Оны негізге алып, [мысалы: мобильді AI чатты JWT-ға көшіру / PostgreSQL cutover / endpoint қосу] үшін нақты қадамдар мен файл жолдарын ұсыныңдар.
Код құпияларын сұрама — тек айнымалы атауларын ата.
```

---

| Қосымша құжат | Мазмұны |
|-----------------|--------|
| `docs/RAQAT_PLATFORM.md` | **Солтүстік жұлдыз** (USER / VALUE / UX), стратегия, mermaid, **XI** қабаттар, **XII** тех. басымдықтар |
| `docs/QURAN_GPT_HANDOFF.md` | Құран `text_kk` / `translit`, импорт, аудит |
| `docs/HADITH_DATA_PROVENANCE.md` | Хадис: `source` дәл мәндері, кітап ↔ slug, JSON синк, KK аударма жолдары |
| `docs/PLATFORM_ROADMAP_API_AI_USERS.md` | Auth, profile, тарих, келесі фаза |
| `docs/MIGRATION_SQLITE_TO_POSTGRES.md` | SQLite → PostgreSQL дайындық (COPY, advisory lock, isolation, backup, audit) |
| `docs/DEV_LOCAL_CHECKLIST.md` | Локальды: `/ready`, `/health`, JWT, `dev_verify_platform_flow.py` |
| `scripts/audit_sql_placeholders.py` | `?` плейсхолдер аудиті (PG `%s` көшуіне дайындық) |
| `tests/test_auth_link.py` | `POST /auth/link/telegram` — бот құпиясы, uuid JWT, идемпотенттілік; **legacy access JWT** uuid емес `sub` → **400** `SUB_NOT_PLATFORM_UUID` (`conftest`: **`RAQAT_REDIS_REQUIRED=0`**) |
| `scripts/healthcheck_raqat.sh` | Дерекқор файлы + API `/ready` + `/health` (резерв) + бот процесі |
| `scripts/backup_sqlite.sh` | SQLite сақтық көшірмесі (`backups/`, соңғы 14 файл) |
| `scripts/nightly_maintenance.sh` | Түнгі: backup + healthcheck → `.logs/nightly_maintenance.log` |
| `scripts/copy_quran_hadith_full.sh` | Контентті PG/SQLite көшіру орамы (`MIGRATION_SQLITE_TO_POSTGRES.md`) |
| `platform_api/README.md` | API endpoint, `/ready`, орта айнымалылар |
| `ECOSYSTEM.md` | Репо құрылымы: `platform_api`, `mobile`, `apps/*` картасы, Docker Postgres/Redis |
| `docs/PRODUCTION_BLUEPRINT_2M_USERS.md` | 2M+ user modular monolith, Redis/Celery/PG HA build order |
| `docs/ALEMBIC_BOOTSTRAP.md` | PostgreSQL + Alembic бастау, `audit_events` PG DDL мысалы |
| `docs/OPERATIONS_RUNBOOK_5_TRACKS.md` | **PG cutover + JWT link + Redis/cache + mobile sync + app.main** бір runbook (командалар, rollback, скрипт жолдары) |
| `docs/OPERATIONS_STACK_CHECKLIST.md` | **Redis + `RAQAT_QUEUE_BACKEND=celery` + PG cutover (`run_pg_cutover.sh`) + DNS (`fix_dns_resolved.sh`) + API/worker + `/metrics`** — бір беттік ops чеклист |
| `docs/PRODUCTION_POSTURE.md` | **Өндіріс аудиті:** PG міндетті, Redis міндетті (`REQUIRED=0` — тек тест), `/metrics` + Prometheus/Grafana, семантикалық кэш, Celery retry/timeout vs DLQ жол картасы |
| `scripts/ops_stack_checklist.sh` | Терминалда жоғары чеклистті мәтін түрінде шығару |
| `platform_api/celery_tasks.py` | Celery: `raqat.ai.chat`, `analyze_image`, `tts`, `transcribe` — ауыр AI жұмысы фонда |
| `mobile/src/utils/uiDefer.ts` | `runWhenHeavyWorkAllowed` — Құран бандл сидингі UI қатырмасын азайту |
| `mobile/src/navigation/MainTabBar.tsx` | Төменгі таб: **дұға** және **тәсбих** (екі баған); 99 есім — басты экран промо карточкасынан |
| `mobile/src/screens/DashboardScreen.tsx` | Басты экран: 99 есім промо карточкасы (`asmaPromoRow`) |
| `mobile/src/screens/SettingsScreen.tsx` | Баптаулар: үстінде аккаунт (API қосылғанда), астында **жобаға үлес**; `getRaqatDonationUrl()` ← `EXPO_PUBLIC_RAQAT_DONATION_URL` / `app.json` extra |
| `mobile/src/config/raqatDonationUrl.ts` | Донат/қолдау URL (опция) |
| `data/hadith_kk_glossary.md` | Хадис KK терминдері — редакциялық глоссарий каркасы |
| `data/hadith_kk_editorial_batches.md` | Сахих id ауқымдары бойынша батчтар, SQL, чеклист |

---

## Платформаның негізгі инженерлік шешімдері (қысқа бриф)

Жүйе қазіргі уақытта SQLite-тен PostgreSQL-ге **көшу фазасында**. Төмендегі құжаттың **§1** (өнім, дерекқор, identity, метадеректер) және **§5** (API) ішінде толық техникалық мәтін бар. Көшу жоспары: `docs/MIGRATION_SQLITE_TO_POSTGRES.md`.

### Өнім басымдықтары: acquisition → retention

| Басымдық | Мазмұны |
|----------|--------|
| **Acquisition (қазіргі ең басты олқылық)** | Активті пайдаланушы базасы әлі қалыптаспаған — сондықтан инженерлік жұмыс (DB cutover, JWT, linking, мобильді синхрон) **алдымен сенімді onboarding және тұрақты қолжетімділік** арқылы «алғашқы пайдаланушыны» қабылдауға бағытталуы тиіс. |
| **Retention** | Пайдаланушы келгеннен кейін **қайта оралу** және **күнде қолдану** — өнімдік ілмектер: басты экрандағы **үш тірек** (намаз · күнделікті аят · бір сұрақ AI), **хабарламалар** (намаз уақыты), бот пен мобильдіде **бір тұлға** (`platform_identities` + ортақ `platform_ai_chat_messages` тарихы). Толық стратегия: `docs/RAQAT_PLATFORM.md` (USER / VALUE / UX). |

Инженерлік шешімдер (төмен §1.1–1.3, инкременттік синхрон, ops) retention-ды **қолдайды**, бірақ олардың өзі пайдаланушы әкелмейді — маркетинг, контент және UX бірге жұмыс істеуі керек.

### 1.1 Дерекқор абстракциясы (Hybrid Storage)

`db/get_db.py` бұл процесті **жұмсақ** етеді:

| Тақырып | Сипат |
|---------|--------|
| **Context manager** | Барлық код **`with get_db() as conn:`** (немесе `get_db_reader()` / `get_db_writer()`) арқылы бір интерфейстен жұмыс істейді. |
| **Lazy pooling** | PostgreSQL қосылғанда ғана **`psycopg_pool`** іске қосылады (**`RAQAT_PG_USE_POOL=1`**); әйтпесе `psycopg.connect` сессиясы. |
| **Dialect awareness** | SQLite **`?`** пен PostgreSQL **`%s`**, уақыт, `INSERT OR IGNORE` / `ON CONFLICT` — **`db/dialect_sql.py`** және модульдік `_exec` үлгісі. |

Толығырақ: төмен **§1.1**, `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §4.

### 1.2 Identity & Linking (бірыңғай сәйкестендіру)

RAQAT-тың ең үлкен артықшылығы — пайдаланушыны барлық интерфейсте тану:

- **UUID жүйесі:** Telegram `user_id` платформалық UUID-ге байланады (**`platform_identities`**).
- **JWT `sub`:** авторизация кезіндегі токен ішінде осы UUID (**`sub`**) жүреді.
- **Автоматты linking:** **`/start`** кезінде бот **`POST /api/v1/auth/link/telegram`** арқылы платформалық токенді алады (`handlers/start.py` → **`ensure_telegram_linked_on_platform`**, `RAQAT_PLATFORM_API_BASE` + **`RAQAT_BOT_LINK_SECRET`** орнатылғанда; жауап **`user_preferences.platform_token_bundle`**). Осылайша пайдаланушы ботпен сөйлессе де, ертең мобильді қолданбаны (Expo) жүктесе де, оның бүкіл тарихы **`platform_ai_chat_messages`** кестесінен бірдей оқылады (`source=telegram` / `source=api`).

#### 1.2.1 Бір жүйе — деректердің бір көзі (мақсат)

Біз **барлық интерфейсті** (Telegram бот, мобильді, `platform_api`, кейінгі веб) **бір логикалық жүйе** ретінде байлаймыз: пайдаланушының «кім екені» және **AI/профиль тарихы** үшін **шындық көзі** — платформа дерекқоры (`platform_identities` + `platform_ai_chat_messages` + JWT; аудит/ledger §21). Боттағы **SQLite** — негізінен **күй** (тіл, onboarding, `platform_token_bundle` / `_paused`, ops-журнал); **контент пен орталық AI** мақсатты режимде **тек API** арқылы: `RAQAT_BOT_API_ONLY=1`, `RAQAT_SINGLE_SOURCE_MODE=1` (тікелей клиенттік Gemini fallback өшірілген). Пайдаланушы мәзірдегі **«Бір дене»** түймесімен платформа JWT қосады немесе үзеді (`handlers/unified_body.py`).

Толығырақ: төмен **§1.2**, «Telegram → AI чат → API» кестесі; cutover: `docs/API_ONLY_ECOSYSTEM_CUTOVER.md`.

### 1.3 Орталық AI Proxy

Қауіпсіздік пен шығынды бақылау үшін **Gemini API кілті тек серверде** (`platform_api`, `GEMINI_API_KEY`) сақталады; мақсатты режимде клиенттерде кілт жоқ.

- **Multimodal:** сурет талдау (**halal check**), дауыс → мәтін және **TTS** орталықтандырылған — `/api/v1/ai/*` (`ai_routes.py`, `ai_proxy.py`, `ai_multimodal.py`).
- **Auth scopes:** AI-ға сұраныс жіберу үшін JWT ішінде арнайы **`ai`** рұқсаты (scope) болуы тиіс; немесе **`X-Raqat-Ai-Secret`** (`jwt_auth.py`, `ai_security.py`).
- **Жылдамдық / шығын:** `ai_proxy` — thinking өшіру, `max_output_tokens`; **Redis exact cache** (`/ai/chat` жауабында `cached`) — §21.2–21.3.

Толығырақ: төмен **§1** өткел (`RAQAT_PLATFORM_API_BASE` / `RAQAT_AI_PROXY_SECRET`), **§5.2**, **§10**, **§21**.

### 2. Инкременттік синхрондау механизмі

Мобильді қолданбалар трафикті үнемдеп, жылдам жұмыс істеуі үшін **`GET /api/v1/metadata/changes`** қолданылады:

- **ETag тексеру:** клиент хэш жібереді (`If-None-Match`), өзгеріс жоқ болса — **`304 Not Modified`**.
- **Since diff:** дерекқорда **`updated_at`** (миграция **005**) болса, клиент тек соңғы синхроннан бері өзгерген **id** тізімдерін алады. **Бүкіл корпусты қайта жүктеу қажеттілігін жояды.**

Толығырақ: төмен **§1.3** (метадеректер), мобильді: `contentSync.ts`.

### 3. Келесі қадамдар және интеграция

Соңғы құжаттар бойынша келесі фазаға дайындық:

| Бағыт | Мазмұны |
|--------|--------|
| **PostgreSQL cutover** | `docs/MIGRATION_SQLITE_TO_POSTGRES.md` нұсқаулығы бойынша **DSN ауыстыру** және **пулдарды баптау**; §15, сақтық көшірме. |
| **Placeholder audit** | `python scripts/audit_sql_placeholders.py` — барлық сұраныстарды жаңа базаға үйлесімді ету (`?` → `%s`, SQLite-спецификалық DDL т.б.). |
| **Identity linking** | Бот пен API арасындағы **`RAQAT_BOT_LINK_SECRET`** арқылы **толыққанды JWT айналымын** қамтамасыз ету (ботта `/start` link; мобильді/клиент өз токенін сақтайды). |
| **Локальды даму** | `bash scripts/dev_restart_platform.sh` — бүкіл инфрақұрылымды бір командамен қайта іске қосу (API 8787 + миграция; бот опциямен). Толығырақ: `docs/DEV_LOCAL_CHECKLIST.md`. |
| **Өндіріс мониторингі** | **`GET /health`** — liveness (процесс тірі). **`GET /ready`** — readiness: `get_db_reader()` + `SELECT 1` (SQLite немесе PostgreSQL); **503** = DB қосылмаған. **`GET /metrics`** — `uptime_seconds`, `http_5xx_total`, latency терезесі (in-process). `scripts/healthcheck_raqat.sh` — `/ready`, `/health`, **`/metrics`**. Cron: `scripts/nightly_maintenance.sh` (backup + журнал). Толық стек қадамдары: **`docs/OPERATIONS_STACK_CHECKLIST.md`**. |

---

## 1. Өнім мақсаты

RAQAT — исламдық контент пен құралдар: **Құран**, **хадис**, **намаз уақыты**, **құбыла**, **тәсбих**, **halal** (сурет), **дауыс + AI чат + TTS**.

**Адам үшін ұстаным:** RAQAT **адамға ең жеңіл** (түсінікті, аз басу), **ең оңай** (күнделікті іске қосуға ыңғайлы, шаршатпайтын) және **ең керек** (намаз · аят · дұға сияқты шын мәніндегі қажеттіліктерді бір орталықтан қамтамасыз ететін) **құрал** болуға тиіс. Күрделі мүмкіндіктерді де **қарапайым жолмен** жеткізу — жол картасы (**§24.0**, **§33–§38**) осы бағытты бекітуі керек.

### 1.0 Қолданбалар: ең күшті жақтары (RAQAT-қа қабылдау идеялары)

Төмендегі кесте — танымал ислам қолданбаларынан **UX/функция үздіктерін** қысқаша жинайды: копия емес, **өнім жол картасында** қай бағытты алуға болатынын талқылау үшін.

| Қолданба | Ең күшті жақтары (RAQAT-қа қабылдауға болады) |
|----------|------------------------------------------------|
| **Muslim Pro / Athan** | Дәл намаз уақыты (**8+ әдіс**), **Adhan** хабарламасы, **Құбыла**, мешіт / халал орындар іздеуі, **ислам күнтізбесі** |
| **Quran.com / Quran Majeed** | Таза оқу тәжірибесі, **көп аударма** (араб + **KK** + транслит), **тәпсір**, **сөз-сөз**, **бетбелгі**, **офлайн** |
| **Tarteel / Quranly** | **AI** оқу түзету (**тәжуид** кері байланыс), геймификация, күнделікті әдет **streak**, жаттау құралдары |
| **Pillars / Everyday Muslim** | Әдет трекері, намаз бақылауы, көрнекі прогресс, **Рамазан** фокусы |
| **IslamicFinder** | Қауымдастық, іс-шаралар, халал орындар, әлемдік мешіт дерекқоры |

**Мақсатты архитектура:** клиенттерде Gemini кілті болмайды; сұраулар **орталық `platform_api`** арқылы.  
**Қазіргі өткел:** `.env`-те `RAQAT_PLATFORM_API_BASE` және `RAQAT_AI_PROXY_SECRET` толтырылса, боттағы **барлық AI** (чат, halal сурет, дауыс транскрипциясы, TTS) **API арқылы** жүреді; әйтпесе ботта **`GEMINI_API_KEY`** тікелей `google-genai` қолданылады.

**Платформа пайдаланушысы:** Telegram `user_id` ↔ тұрақты **`platform_user_id`** (uuid), JWT ішінде `sub` / `telegram_user_id`. AI чат тарихы **бір кестеде** (`platform_ai_chat_messages`) — SQLite немесе PostgreSQL DSN бойынша; бот (`source=telegram`) мен API (`source=api`) бір JSON схемасымен оқылады.

### 1.1 Дерекқор абстракциясы (`db/get_db.py`)

**Негізгі идея:** өтпелі кезеңде бір **`with get_db() as conn:`** контекст менеджері — қосымша код **бір интерфейстен** (`conn.execute`, `fetchone`, …) жұмыс істейді; артқы жағы SQLite немесе PostgreSQL.

Нақты код (жалпы скетчтен айырмашылықтар):

| Тақырып | Реализация |
|---------|------------|
| PG қашан қосылады | `DATABASE_URL` **немесе** `DATABASE_URL_WRITER` мәнінің **`postgresql://...`** префиксі (`is_postgresql_configured()`). |
| DSN | **`postgresql_dsn()`** — алдымен `DATABASE_URL_WRITER`, содан `DATABASE_URL`. |
| Пул | **Әдепкі өшіқ**; `RAQAT_PG_USE_POOL=1` болғанда ғана **ленивті** `psycopg_pool.ConnectionPool` (`threading.Lock`, `RAQAT_PG_POOL_MIN` / `MAX`). |
| PG қосылым | Пулсыз: `psycopg.connect(dsn, row_factory=dict_row)`; барлығы контекст ішінде commit/close. |
| SQLite | Тікелей `sqlite3.connect` емес — **`db.connection.db_conn(sqlite_database_path())`**: WAL, `foreign_keys=ON`, `busy_timeout`. |
| Оқу/жазу бөлінісі | **`get_db_reader()`** / **`get_db_writer()`** — келешекте `DATABASE_URL_READER` / writer; қазір writer = `get_db()`. |
| Shutdown | **`close_postgresql_pools()`** — uvicorn lifespan / тест соңы. |
| SQL диалектісі | **`db/dialect_sql.py`** — плейсхолдер (`?` ↔ `%s`), уақыт, `INSERT OR IGNORE` / `ON CONFLICT` үйлесімі (PG көшуі). |

```mermaid
flowchart TD
  G[get_db] --> P{postgres DSN?}
  P -->|иә| Q{RAQAT_PG_USE_POOL?}
  Q -->|иә| R[ConnectionPool + connection]
  Q -->|жоқ| S[psycopg.connect dict_row]
  P -->|жоқ| T[db_conn sqlite_database_path WAL FK]
```

Толығырақ: `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §4.

### 1.2 Сәйкестендіру және байлау (Identity & Linking)

**Экожүйенің тірегі:** Telegram `user_id` ↔ **`platform_user_id`** (uuid) ↔ JWT **`sub`** ↔ `platform_identities` / `platform_ai_chat_messages`.

| Қадам | Сипат |
|-------|--------|
| UUID құру/табу | `db/platform_identity_chat.ensure_platform_user_for_telegram` — кестеде жол жоқ болса uuid INSERT; қайталау race-інде unique constraint + қайта оқу. **PostgreSQL:** `DATABASE_URL` болса `_platform_db` → `get_db_writer()` (sqlite `db_path` елемейді); әйтпесе `db_conn(db_path)`. |
| JWT + tg бір уақытта | **`POST /api/v1/auth/link/telegram`**: дене `{ "telegram_user_id": int }`, header **`X-Raqat-Bot-Link-Secret`** = ортадағы `RAQAT_BOT_LINK_SECRET` — жауапта **access (+ refresh)**, `sub` = uuid, `telegram_user_id` claim. |
| Боттағы чат | `handlers/ai_chat.py` → **`append_telegram_ai_turn`** → сол uuid кеңістігінде хабарламалар (`source=telegram`). |
| API чат | `POST /api/v1/ai/chat` (JWT uuid `sub` болса) → **`append_ai_exchange`** (`source=api`). |

**Мақсатты сценарий (мобильді / бот интеграциясы):** `/start` кезінде бот **`RAQAT_PLATFORM_API_BASE`** + **`RAQAT_BOT_LINK_SECRET`** орнатылғанда **`POST /api/v1/auth/link/telegram`** шақырады (`services/platform_link_service.py`) — identity құрылады/табылады, **JWT** жауабы `user_preferences.platform_token_bundle`-да сақталады. Мобильді клиент өз JWT-сін алғанда **сол uuid** бойынша `/users/me/history` қолдана алады.

#### Telegram → AI чат → API (бір қолданушы ағыны)

| Қадам | Не болады |
|-------|-----------|
| 1. `/start` | `log_event` → **`ensure_telegram_linked_on_platform`** (опция): API **`ensure_platform_user_for_telegram`** + JWT; тіл таңдау / меню / onboarding. |
| 2. AI чатқа кіру + хабарлама | `handlers/ai_chat.py`: rate limit → `ask_genai` → **`append_telegram_ai_turn`**. |
| 3. Жүйе: identity | Егер §1 қадам link орындалған болса — uuid бұрыннан бар; әйтпесе **`append_telegram_ai_turn`** ішінде **`ensure_platform_user_for_telegram`**. |
| 4. Жүйе: тарих | `append_ai_exchange`: **`platform_ai_chat_messages`** — `user` және `assistant`, **`source=telegram`**. |
| 5. API: JWT | `/start` link сәтті болса — жауап сақталған **`access_token`** (немесе қолмен **`POST /auth/link/telegram`**). |
| 6. API: профиль | **`GET /api/v1/users/me`** (Bearer) — `platform_user_id`, `telegram_user_id`, scopes т.б. |
| 7. API: тарих | **`GET /api/v1/users/me/history`** — сол uuid бойынша хабарламалар (`items`, `next_before_id`). |

Ескертпе: **`RAQAT_PLATFORM_API_BASE` / `RAQAT_BOT_LINK_SECRET` бос болса**, link өтпейді — identity+тарих әлі де AI алғашқы айналымынан кейін пайда болады, JWT ботта сақталмайды. Синтетикалық тексеру: `scripts/dev_verify_platform_flow.py`.

Код: `platform_api/auth_routes.py`, `db/platform_identity_chat.py`, `db/dialect_sql.py`.

### 1.3 Метадеректер синхроны (`GET /api/v1/metadata/changes`)

Офлайн / инкременттік жаңарту үшін **incremental diff** (мобильді: `contentSync.ts`, `If-None-Match` + `since`).

| Параметр / тақырып | Сипат |
|--------------------|--------|
| **ETag** | Дерекқор күйінің қысқа хэші; клиент **`If-None-Match`** жіберсе, өзгеріс жоқ болса **`304 Not Modified`**. |
| **Last-Modified** | Соңғы өзгеріс уақыты (күй хэшімен бірге). |
| **`since` (query)** | ISO8601; DB-да `quran`/`hadith` **`updated_at`** болса, жауапта **`since_normalized_sqlite`**, **`incremental_diff_available`**, өзгерген id тізімдері: **`quran_changed`**, **`hadith_changed`**. |
| **Diff** | Толық мәтін емес — **өзгерген сүрелер/хадис id-лері** (желінің көлемін азайту). |

Код: `platform_api/content_routes.py`, `content_reader.py`.

---

## 2. Репозиторий құрылымы

| Қалта | Рөлі |
|-------|------|
| `bot_main.py`, `handlers/`, `services/`, `keyboards/`, `state/`, `config/` | Telegram бот (**aiogram 3**) |
| `global_clean.db` | SQLite; жол **`db/get_db.py` → `sqlite_database_path()`** (env `RAQAT_DB_PATH` / `DB_PATH`, содан `config.settings.DB_PATH`, әйтпесе репо түбі) |
| `db/get_db.py` | `get_db()` / `get_db_writer()` — postgres: psycopg, опция `RAQAT_PG_USE_POOL` → pool; `close_postgresql_pools()`; SQLite fallback; `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §4, §Архитектуралық ағым |
| `db/migrations.py`, `db/platform_identity_chat.py`, `db/dialect_sql.py` | Миграциялар; платформа uuid, AI тарих; SQL `?`/уақыт psycopg үшін |
| `platform_api/` | **FastAPI**, әдепкі порт **8787** — `bash scripts/run_platform_api.sh` (`main.py` репо түбін `sys.path`-қа қосады — `db` импортталады) |
| `platform_api/app/` | **Жаңа модульдік v1 қабаты**: `app/main.py` (entrypoint), `app/api/v1/*` (auth/users/quran/hadith/ai/worship/halal), `app/core/*`, `app/infrastructure/*` |
| `web/` | Статикалық MVP (`index.html`, `styles.css`) |
| `mobile/` | **Expo SDK 54** (`expo` ~54), React Native 0.81.x; әдепкі entry: `expo/AppEntry.js` |
| `scripts/` | Импорт, FTS, платформа API, хадис синкі, healthcheck, backup, түнгі maintenance |
| `platform_api/db_reader.py` | `get_content_stats()` (SQLite файл), **`readiness_ping()`** — гибрид DSN үшін readiness |

---

## 3. Telegram бот (`handlers/`)

| Модуль | Функция |
|--------|---------|
| `start.py` | /start, мәзір |
| `quran.py` | Сүре, мәтін, аудио, іздеу, тәжвид, хатм |
| `hadith.py` | Хадис, іздеу |
| `prayer.py`, `qibla.py`, `tasbih.py` | Намаз, құбыла, тәсбих |
| `halal.py` | Сурет → `analyze_halal_photo` (API немесе тікелей Gemini) |
| `voice.py` | Дауыс, `transcribe_voice_command`, `ask_genai` |
| `ai_chat.py` | RAQAT AI чат, `ask_genai`; жауаптан кейін **`append_telegram_ai_turn`** → `platform_ai_chat_messages` |
| `services/tts_reply.py` | `synthesize_speech` |
| `language.py`, `translation.py`, `onboarding.py` | Тіл, нұсқаулық |
| `feedback.py`, `admin.py` | Кері байланыс, әкімші |
| `services/genai_service.py` | Орталық API ↔ Gemini |

---

## 4. Конфигурация (түбір `.env` + `config/settings.py`)

| Айнымалы | Қайда қолданылады |
|----------|-------------------|
| `BOT_TOKEN` | Telegram |
| `GEMINI_API_KEY` | Ботта тікелей Gemini **немесе** API серверінде орталық AI |
| `DB_PATH` / `RAQAT_DB_PATH` | SQLite жолы; `platform_api/db_reader.resolve_db_path()` = `db.get_db.sqlite_database_path()` |
| `DATABASE_URL` | Келешек PostgreSQL DSN (`config/settings.py`, құжат: `MIGRATION_SQLITE_TO_POSTGRES.md`) |
| `RAQAT_PLATFORM_API_BASE` | Мысалы `http://127.0.0.1:8787` — бот HTTP AI шақырулары |
| `RAQAT_AI_PROXY_SECRET` | Бот ↔ API: **`X-Raqat-Ai-Secret`** **немесе** JWT scope **`ai`** |
| `RAQAT_CONTENT_READ_SECRET` | Контент GET қорғалса: **`X-Raqat-Content-Secret`** **немесе** JWT scope **`content`** |
| `RAQAT_JWT_SECRET` | Кемінде 32 символ — JWT шығару/тексеру (`platform_api`) |
| `RAQAT_AUTH_USERNAME`, `RAQAT_AUTH_PASSWORD` / `RAQAT_AUTH_PASSWORD_BCRYPT` | Bootstrap `POST /auth/login` |
| `RAQAT_JWT_EXPIRE_MINUTES` | Access token TTL |
| `RAQAT_BOT_LINK_SECRET` | `POST /auth/link/telegram` + header **`X-Raqat-Bot-Link-Secret`** (Telegram id → JWT, `sub` = uuid) |
| `QURAN_TRANSLIT_STYLE` | `default` \| `pedagogical` |
| `AI_RATE_LIMIT_SECONDS`, `AI_MODEL_CANDIDATES`, `ADMIN_USER_IDS`, `CITY_NAME`, … | Бот логикасы |

Мысал: `.env.example`.

---

## 5. Платформа API (`platform_api/`)

Дерекқор: `RAQAT_DB_PATH` немесе `DB_PATH`, әйтпесе `../global_clean.db`. Жазу: миграциялар, `platform_identities`, `platform_ai_chat_messages`, AI чат логы.

### 5.1 Жалпы

| Метод | Жол |
|--------|------|
| GET | `/health` — **liveness**: `{ status, service, version }` (дерекқорсыз да 200) |
| GET | `/ready` — **readiness**: `readiness_ping()` → `backend`: `sqlite` \| `postgresql`; қатеде **503** + `error`. Kubernetes: liveness=`/health`, readiness=`/ready` |
| GET | `/metrics` — **in-process мониторинг**: `uptime_seconds`, `uptime_human`, **`http_5xx_total`**, соңғы сұраныстар терезесінің latency (p50/p95/p99), slow count; логтар middleware `http_request` арқылы |
| GET | `/api/v1/info` — уақыт, сілтемелер, `note_kk` (қысқа нұсқау) |
| GET | `/api/v1/stats/content` — қатарлар саны, `text_kk` толықтығы (**тек SQLite файл** арқылы; PG-only ортада бұл жол статистика үшін бөлек келешекте үйлестірілуі мүмкін) |

### 5.2 Орталық AI (`X-Raqat-Ai-Secret` **немесе** JWT scope `ai`; серверде `GEMINI_API_KEY`)

| Метод | Жол | Дене (қысқа) |
|--------|-----|----------------|
| POST | `/api/v1/ai/chat` | `prompt`, опция `user_id` → `text`. **`async_mode`: true** болса — жауапта `task_id`, `poll_path` (Celery кезегі; Redis broker). Bearer-да uuid `sub` болса, синхронда жауап **тарихқа** жазылады (`source=api`); async тапсырма worker ішінде жазады. |
| GET | `/api/v1/ai/task/{task_id}` | Celery **`AsyncResult`** күйі: `state`, `ready`, `result` (сәтті болса). Auth: сол AI rate limit / JWT немесе `X-Raqat-Ai-Secret`. |
| POST | `/api/v1/ai/analyze-image` | `image_b64`, `mime_type`, `lang`; опция **`async_mode`** (фонда `raqat.ai.analyze_image`) |
| POST | `/api/v1/ai/transcribe-voice` | `audio_b64`, `mime_type`, `preferred_lang`; опция **`async_mode`** (`raqat.ai.transcribe`) |
| POST | `/api/v1/ai/tts` | `text`, `lang` → `audio_b64`, `mime_type`, `filename`; опция **`async_mode`** (`raqat.ai.tts`) |

Код: `ai_routes.py`, `ai_proxy.py`, `ai_multimodal.py`, `celery_tasks.py`, `celery_app.py`, `ai_security.py`, `jwt_auth.py`. Кезек: `app/infrastructure/queue.py` → `celery_app.send_task`. Орта: **`RAQAT_QUEUE_BACKEND=celery`**, **`RAQAT_REDIS_URL`**, worker: `celery -A celery_app worker`.

### 5.3 Оқу-only контент (құпия толтырылса: header **немесе** JWT scope `content`)

| Метод | Жол | Ескертпе |
|--------|-----|----------|
| GET | `/api/v1/quran/surahs` | 114 сүре |
| GET | `/api/v1/quran/{surah}` | Query: `from_ayah`, `to_ayah`; max **400** жол |
| GET | `/api/v1/quran/{surah}/{ayah}` | Бір аят |
| GET | `/api/v1/hadith/{hadith_id}` | Бір хадис |
| GET | `/api/v1/genealogy/clans` | Шежіре: children (`?parent=slug`); parent жоқ → 3 жүз — **§45.3** |
| GET | `/api/v1/genealogy/clans/{slug}` | Ру/жүз detail + breadcrumbs + source refs |
| GET | `/api/v1/metadata/changes` | **`ETag`**, **`Last-Modified`**, **`If-None-Match`** → **304**; query **`since`** (ISO8601) — DB-да `updated_at` бар болса **`incremental_diff_available`**, **`quran_changed`**, **`hadith_changed`**, **`since_normalized_sqlite`**; fingerprint-те max `updated_at` |

Код: `content_routes.py`, `content_reader.py`, **`genealogy_routes.py`** (**§45**).

### 5.4 Auth, байлау, профиль, тарих

| Метод | Жол | Сипат |
|--------|-----|--------|
| POST | `/api/v1/auth/login` | Bootstrap: `username` / `password` → **`access_token`**; JWT ішінде **`sub` = тұрақты `platform_user_id` (uuid)** — `ensure_platform_user_for_password_username` → `platform_identities` + **`platform_password_logins`** (`db/password_login.py`; DDL: **`db/user_data_schema.py`**, миграция **012**, жөндеу **014**). |
| POST | `/api/v1/auth/link/telegram` | **Бот:** `X-Raqat-Bot-Link-Secret` + `{ "telegram_user_id": int }` → JWT, `sub` = **`platform_user_id`**, кестеде жол жасалады. **Клиент:** Bearer access — `jwt_auth.platform_user_id_from_payload()` uuid алады (**`sub`** немесе claim **`platform_user_id`**); uuid табылмаса → **400** `SUB_NOT_PLATFORM_UUID`. Сәтті болса tg бекітіледі, жаңа JWT жұбы қайтарылады. |
| GET | `/api/v1/users/me` | `sub`, `platform_user_id`, `telegram_user_id`, `scopes`, опция `apple_sub` / `google_sub` (JWT claim) |
| GET | `/api/v1/users/me/history` | `limit` (1–200), `before_id`, `role` — `items[]`: `id`, `role`, `body`, `source`, `client_id`, `created_at`; `next_before_id` |

Код: `auth_routes.py`, `jwt_deps.py`, `roadmap_routes.py`, `db/platform_identity_chat.py`.

OpenAPI: **`/docs`**.

---

## 6. Мобильді (`mobile/`)

- **Негізгі стек:** Expo SDK **54**; намаз уақыты: **Aladhan**.  
- **Платформа API базасы:** **`EXPO_PUBLIC_RAQAT_API_BASE`** немесе `app.json` → `expo.extra.raqatApiBase` (`src/config/raqatApiBase.ts`). Бос болса — сыртқы fallback қалған күйде жұмыс істейді (мысалы Құран тізімі/сүре үшін).  
- **Контент құпиясы (опция):** **`EXPO_PUBLIC_RAQAT_CONTENT_SECRET`** немесе `extra.raqatContentSecret` — API **`RAQAT_CONTENT_READ_SECRET`** сәйкес (немесе JWT **`content`** scope). `src/config/raqatContentSecret.ts`.
- **AI чат (мобильді):** **`EXPO_PUBLIC_RAQAT_AI_SECRET`** немесе `extra.raqatAiSecret` — API **`RAQAT_AI_PROXY_SECRET`** сәйкес (`X-Raqat-Ai-Secret`). `src/config/raqatAiSecret.ts`. Өндірісте JWT (scope **`ai`**) қолдану ұсынылады.

### 6.0 Басты экран және «үш тірек» (UX)

- **`DashboardScreen`:** «Бүгінгі үш тірек» — **намаз уақыты** (карта → `PrayerTimes`), **күнделікті аят** (`DailyAyah`), **бір сұрақ AI** (`RaqatAI` → чат). Төменде құбыла, содан «Тағы мазмұн» (Құран тізімі, хадис, дұға, хатым, халал).
- **`DailyAyahScreen`:** күнге байланысты глобалды аят (6236 цикл); алдымен **`/api/v1/quran/{s}/{a}`**, резерв **alquran.cloud** `/v1/ayah/{global}`. Дерек: `src/data/quranAyahCounts.ts`.
- **`RaqatAIChatScreen`:** **`POST /api/v1/ai/chat`**, `fetchPlatformAiChat` — хабарламалар `AsyncStorage` (`raqat_ai_chat_messages_v1`).

### 6.1 HTTP клиент (`src/services/platformApiClient.ts`)

| Функция | Мақсаты |
|---------|---------|
| `fetchPlatformHealth` | `GET /health` |
| `fetchPlatformReadiness` | `GET /ready` — **503** денесін тастамайды; DB дайындығы + `backend` |
| `fetchContentStats` | `GET /api/v1/stats/content` |
| `fetchPlatformAiChat` | `POST /api/v1/ai/chat` — **`X-Raqat-Ai-Secret`** немесе Bearer JWT (**`ai`**) |
| `fetchQuranSurahs` | `GET /api/v1/quran/surahs` |
| `fetchPlatformQuranSurah` | `GET /api/v1/quran/{surah}` — толық сүре (`text_ar`, `text_kk`, `translit`) |
| `fetchPlatformQuranAyah` / `fetchPlatformHadith` | Бір аят / бір хадис |
| `fetchMetadataChanges` | **ETag** / **304** → `null`; query **`since`**; header **`authorizationBearer`** |

### 6.2 Құран экрандары (бір дерек көзі)

- **`QuranListScreen`**, **`QuranSurahScreen`:** егер **`raqatApiBase` орнатылған** болса, алдымен **platform_api** (`fetchQuranSurahs` / `fetchPlatformQuranSurah`); сәтсіздік немесе база бос болса — **`api.alquran.cloud`** резерві.  
- **Кэш:** `quranListCache.ts`, `quranSurahCache.ts` — `CachedAyah` ішінде араб **`text`**, бар болса **`textKk`** (қазақша екінші жол UI-да).  
- **Офлайн бандл сидинг:** `bundledQuranSeed.ts` — AsyncStorage-қа толық Құран; сидинг **алдымен** `InteractionManager` + `requestAnimationFrame` (`uiDefer.ts`) кейін іске қосылады; **кеш толық болса** сидинг фонда (`void`), желіні күтпей UI босатылады.  
- **Инкременттік жаңарту:** `contentSync.ts` — `applyIncrementalContentPatches` аятты **`cachedAyahFromRow`** арқылы сақтайды (араб негізгі, `text_kk` бөлек).

### 6.2.0 Күнделікті аят (офлайн)

- **`DailyAyahScreen`:** араб мәтіні кеште бар болса, ауыр бандл сидингі шақырылмайды (күнделікті экран қатып қалмасын).

### 6.2.1 Хадис (мобильді)

- **`HadithListScreen`**, **`HadithDetailScreen`:** офлайн корпус (`bundledHadithSeed.ts`, `hadith-from-db.json` → AsyncStorage); API орнатылғанда **`GET /api/v1/hadith/{id}`** мәтінді жаңарта алады (`fetchPlatformHadith`). Деталь экранда: **араб түпнұсқа**, **қазақша мағына** (`text_kk`), рауи, дәлел; **араб мәтінінің қазақ әрпімен автотранскрипциясы көрсетілмейді** (тек түпнұсқа + аударма).

### 6.2.2 Шежіре (genealogy, 2026-05-25)

- **`GenealogyClansScreen`:** FlatList accordion + breadcrumb stack; API **`/api/v1/genealogy/clans`** (`genealogyApi.ts`); offline — **`genealogy-p0.json`** (14 node).  
- **Кіру:** «Дін мен дәстүр» → «Шежіре ашу» (`KazakhTraditionScreen`); deep link **`imamai://more/genealogy`**.  
- Толығы: **§45.4**, handoff **`docs/handoff/genealogy-p0-handoff.md`**.

### 6.3 Баптаулар

- **`SettingsScreen`:** платформа URL, **`/health` + `/ready` + stats** бір мезгілде тексеріледі; дерекқор дайын болса «SQLite / PostgreSQL (ready)»; DB қатесінде `/ready` хабарламасы.  
- **Офлайн/метадерек:** `contentSync.ts` — AsyncStorage **etag** + **`since_normalized_sqlite`**, `runContentMetadataSync` (`If-None-Match` + `since`).

### 6.4 Сілтемелер

- Бот: `TelegramInfoScreen.tsx` (`t.me/...`).  
- Толығырақ: `mobile/README.md`.

---

## 7. Веб (`web/`)

Статикалық бет; `web/README.md`.

---

## 8. Деректер мен скрипттер

- **Құран / транскрипция / импорт** — `docs/QURAN_GPT_HANDOFF.md`, `scripts/audit_quran_translit.py`, `import_quran_translit_json.py`, т.б.  
- **Хадис**, FTS — `create_hadith_fts.py`, `hadith_corpus_sync.py`.  
- **`quran_kk_provenance`** — қазақша мағына дереккөзі жолы.  
- **Миграциялар (`db/migrations.py`):** мысалы **005** — `quran`/`hadith` **`updated_at`** + индекстер; **006** — **`platform_identities`**, **`platform_ai_chat_messages`**; **012** — пароль логин және хатым: **`platform_password_logins`**, **`platform_hatim_read`** (`ensure_user_data_tables`); **013** — OAuth/телефон кестелері; **014** — **жөндеу**: кейбір `global_clean.db` снапшоттарында 012 «қолданылды» деп жазылғанымен кестелер жоқ болуы мүмкін — 014 кестелер жоқ болса қайта құрады (`CREATE IF NOT EXISTS`); **020** — **`genealogy_clans`** + **`genealogy_source_refs`** (P0 шежіре — **§45.1**). API SQLite режимінде lifespan ішінде **`run_schema_migrations`** шақырылады; жаңа ортада барлық нұсқа тізбегі кідіртпей орындалады. **A1 PG genealogy:** Alembic **`001_genealogy_ltree`** (`alembic.ini`) — **§45.2**. Толығырақ: **§23**, **§45**.
- **Локальды API + бот «басынан»:** `bash scripts/dev_restart_platform.sh` — 8787 портындағы процесті тоқтатады (`RAQAT_DEV_KILL_API_PORT=0` болса өшірмейді), миграцияны іске қосады, `uvicorn`-ды `.logs/platform_api.log`-қа жазады. Бот: екінші терминалда `python bot_main.py` немесе `RAQAT_DEV_START_BOT=1 bash scripts/dev_restart_platform.sh`.
- **Серверде сенімділік (SQLite файл сақталған орта):** `bash scripts/backup_sqlite.sh` — `RAQAT_BACKUP_DIR` (әдепкі `backups/`); `bash scripts/healthcheck_raqat.sh` — DB файлы + `/ready` + `/health` + `bot_main.py`; `bash scripts/nightly_maintenance.sh` — екеуін `.logs/nightly_maintenance.log`-қа жинақтайды. Репо: `backups/` `.gitignore`-да.
- **Контент импорты (SQLite ↔ PostgreSQL / толық көшіру):** `scripts/copy_quran_hadith_full.sh` — `migrate_sqlite_to_postgres.py` орамын қолданады (`--bootstrap-ddl`, `--with-quran-hadith`, т.б.); толығырақ `docs/MIGRATION_SQLITE_TO_POSTGRES.md`, `import_content_pipeline.sh`.
- **Нақты қолмен тест (Telegram → `platform_identities` / `platform_ai_chat_messages` → `GET /users/me`, `/history`):** `docs/DEV_LOCAL_CHECKLIST.md` — «Нақты тест: Telegram → DB → API».

---

## 9. Сыртқы сервистер

| Сервис | Қолдану |
|--------|---------|
| Telegram Bot API | Бот |
| Google Gemini | `platform_api` (орталық) және/немесе бот (fallback) |
| Aladhan | Намаз |
| koran.kz trnc | Транскрипция импорты (скрипт) |
| everyayah | `QURAN_AUDIO_BASE` — аудио URL |

---

## 10. Қауіпсіздік

- `.env` репоға **емес**.  
- AI: **`X-Raqat-Ai-Secret`** **немесе** JWT (**`RAQAT_JWT_SECRET`**, scope **`ai`**).  
- Оқу-only: опция **`X-Raqat-Content-Secret`** **немесе** JWT scope **`content`**.  
- **Telegram → JWT шығару:** **`RAQAT_BOT_LINK_SECRET`** тек серверде; `X-Raqat-Bot-Link-Secret` клиентке таратпау.  
- Bootstrap пароль: өндірісте **`RAQAT_AUTH_PASSWORD_BCRYPT`**; plaintext тек dev.  
- Діни мәтін + AI: фиқһтық үкім емес — disclaimer (`RAQAT_PLATFORM.md`).

Cutover / rollback / нұсқа жауаптар (A·sync·pool·FTS): `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §15.

---

## 11. Тесттер

**Соңғы бекітілген сандар (2026-05-25, жергілікті іске қосу):** `mobile/` — **`npm run test:full`** (`lint` + **`jest --ci`**) → **375+ suite/test PASS** (preflight **85** + hatim **23**; **§44.8**); **genealogy bundled** — **`genealogyBundledP0.test.ts`** **2 PASS** (**§45.5**). **`npm run test:full`** = `lint` + `jest --ci`. AsyncStorage mock — **§39.1**. Репо түбі — **`python -m pytest tests`** → **112+ passed** (2026-05-11 baseline); **genealogy** — **`tests/test_genealogy_*.py`** **11 PASS** (**§45.5**). **Windows PowerShell + CI** — **§24.0.1**.

- `tests/test_platform_api.py` — **health**, **`/ready`** (200 немесе 503), info, stats, AI (mock + JWT), metadata **ETag/304** және **since diff** (көшірілген DB + миграция), контент secret/JWT, **auth/login**, **auth/link/telegram**, **users/me/history**, AI чат тарихқа жазу.  
- **`tests/test_genealogy_api.py`**, **`test_genealogy_repository.py`**, **`test_genealogy_uuid.py`**, **`test_genealogy_cycle_detector.py`**, **`test_genealogy_schema.py`** — шежіре P0/A1 (**§45.5**).
- `tests/test_migrations.py` — миграциялар тізбегі және кестелер (соның ішінде **006**, **020** genealogy).
- `tests/test_auth_link.py` — `POST /auth/link/telegram` (бот құпиясы, 401/503, идемпотенттілік); **uuid емес `sub`** бар қолдан жасалған access JWT → **400** `SUB_NOT_PLATFORM_UUID`. `tests/conftest.py`: **`RAQAT_REDIS_REQUIRED=0`** — Redis міндетті startup API импорты үшін өшіріледі.
- **`mobile/` Jest** — `npm run lint` (`tsc --noEmit`), содан `jest` / `jest --ci`; конфиг: `mobile/jest.config.js` (e2e: `mobile/e2e/jest.config.js`).

---

## 12. GPT-ке тапсырма мысалы

> RAQAT: FastAPI `platform_api` (8787) — **`GET /health`**, **`GET /ready`**, **`GET /metrics`** (uptime, 5xx count). Орталық AI: `/api/v1/ai/*` (**X-Raqat-Ai-Secret** немесе JWT **`ai`**); опция **`async_mode`** + **`GET /api/v1/ai/task/{id}`** (Celery+Redis); опция semantic cache: **`RAQAT_AI_SEMANTIC_CACHE`**. Мобильді: **`EXPO_PUBLIC_RAQAT_API_BASE`**, контент **`EXPO_PUBLIC_RAQAT_CONTENT_SECRET`**, AI чат **`EXPO_PUBLIC_RAQAT_AI_SECRET`** (сервер `RAQAT_AI_PROXY_SECRET`); басты экран үш тірек + `DailyAyahScreen` + `RaqatAIChatScreen` (`fetchPlatformAiChat`). Оқу-only: Құран/хадис + `/metadata/changes` (**ETag**, **`since`**, миграция **005**). Auth: **`/auth/login`** → JWT **`sub` = platform uuid** (`platform_password_logins`); `/auth/link/telegram` (бот құпиясы немесе Bearer uuid); `/users/me`, `/users/me/history`. Кестелер: `platform_identities`, `platform_password_logins`, `platform_ai_chat_messages`; миграция **014** ескі снапшоттарды жөндейді. Ops: `OPERATIONS_STACK_CHECKLIST.md`, healthcheck, backup, nightly. Мен сенен: [конкретті өзгеріс].

---

## 13. Жылдам анықтама (жиі сұрақтар)

| Сұрақ | Жауап |
|--------|--------|
| Өнімнің бірінші шегі не? | **`docs/RAQAT_PLATFORM.md`** — «Солтүстік жұлдыз»: USER (proof/growth), күнделікті VALUE (намаз · аят · AI), SIMPLE UX (бір басу → нәтиже). Acquisition пен retention қысқаша: жоғарыдағы **«Өнім басымдықтары: acquisition → retention»** кестесі. |
| Жол картасы (фазалар 1–3, MVP) қайда? | **§24.0** (индекс кесте + mermaid), толық мәтін **§33**–**§38**. |
| «Адамға ең жеңіл, оңай, керек» қайда жазылған? | **§1** (ұстаным абзацы), **§38** (позициялау), **§24.1** сілтеме жолы. |
| Тест санын қайдан білемін? | **§11** (жалпы), **§25.5** (`mobile/`), **§39.1** (Jest AsyncStorage mock), **§24.0.1** (қалай іске қосу). |
| P0/P1/P2 басымдық не істеу керек? | **§41** |
| Пайдаланушы бот пен API арасында қалай бірікті? | `POST /auth/link/telegram` + `platform_identities`; JWT `sub` = uuid; ботта `platform_token_bundle`. |
| AI кілті клиентте бар ма? | Жоқ — мақсат **`platform_api`** + `GEMINI_API_KEY` серверде. |
| Мобильді Құран қайдан алынады? | Орнатылған **`raqatApiBase`** болса — **`/api/v1/quran/*`** (text_kk қоса); әйтпесе alquran.cloud. |
| Мобильді хадис экранында транскрипция бар ма? | **Жоқ** — `HadithDetailScreen` тек арабша + қазақша мағына; автотранскрипция алынып тасталған. |
| Мобильді AI чат қалай қосылады? | **`EXPO_PUBLIC_RAQAT_AI_SECRET`** + `fetchPlatformAiChat` → **`POST /api/v1/ai/chat`**; JWT жолы — `PLATFORM_ROADMAP_API_AI_USERS.md`. |
| Көшірме мен түнгі тексеру? | `backup_sqlite.sh`, `nightly_maintenance.sh`, журнал `.logs/`. |
| PostgreSQL қашан? | `DATABASE_URL` / `DATABASE_URL_WRITER` — `db/get_db.py`, нұсқау `MIGRATION_SQLITE_TO_POSTGRES.md`. |
| Redis + Celery + PG + DNS бірден? | `docs/OPERATIONS_STACK_CHECKLIST.md`, төмен **§22.1**. |
| Async AI (`task_id`)? | Денеде `async_mode: true`, **`GET /api/v1/ai/task/{id}`** — төмен §5.2, **§22.2**. |
| `POST /auth/login` ішінде `sub` не? | **Uuid (`platform_user_id`)** — логин аты тұрақты кілтке (`platform_password_logins.login_key`) байланысты; ескі «username = sub» емес. |
| `global_clean.db` кестелері толық па? | Миграция **014** ескі снапшоттарды жөндейді; күмән болса **`run_schema_migrations`** немесе API іске қосу (SQLite lifespan). **§23**. |
| Semantic AI cache? | **`RAQAT_AI_SEMANTIC_CACHE=1`** өндірісте ұсынылады (`ai_semantic_cache.py`, worker ішінде де); шығын: embedding. Толығы: **`PRODUCTION_POSTURE.md` §4**, **§21.2**. |
| Өндірісте SQLite бола ма? | **Жоқ** — тек PostgreSQL; SQLite әзірлеу/тест. **`PRODUCTION_POSTURE.md` §1**. |
| Redis өндірісте optional па? | **Жоқ** — міндетті; `RAQAT_REDIS_REQUIRED=0` **тек pytest**. **`PRODUCTION_POSTURE.md` §2**. |
| Шежіре (genealogy) API және mobile қайда? | **§45**; `GET /api/v1/genealogy/clans`, `GenealogyClansScreen`, bundled `genealogy-p0.json`; handoff **`docs/handoff/genealogy-p0-handoff.md`**. |

---

*Файл жолы: `docs/archive/PLATFORM_GPT_HANDOFF_2026-05.md`. Құран тереңдігі: `docs/QURAN_GPT_HANDOFF.md`. Өнім жол картасы: `docs/RAQAT_PLATFORM.md` (XI–XII). Жинақтау: **§22** (ops) · **§23** (auth/DB) · **§24** (карта) · **§26** (мобильді хатым/Құран мұсаф/бағыт) · **§26.7** · **§26.8** · **§29** · **§30** · **§31** · **§42** · **§43** · **§44** (2026-05-24: Device QA, FlashList, hooks, VPS cron) · **§45** (2026-05-25: шежіре P0/A1); өндіріс шегі: **`PRODUCTION_POSTURE.md`**.*

---

## 14. Ағымдағы статус-отчет (2026-04-14)

Төмендегі бөлім — осы күнгі нақты операциялық күй мен жасалған өзгерістердің толық есебі.

### 14.1 Орындалған жұмыстар (Done)

| Бағыт | Нәтиже |
|------|--------|
| **Платформаны басынан іске қосу** | API қайта көтерілді (`platform_api`, port `8787`), бот процесі қайта іске қосылды (`bot_main.py`). |
| **API тексерісі (телефон)** | Телефон браузерінде `http://<server-ip>:8787/docs` ашылды; OpenAPI тізімі толық жүктелді (auth, ai, content, usage, roadmap). |
| **Health/readiness** | `/health` жауап берді: `{"status":"ok","service":"RAQAT Platform API","version":"0.1.0"}`; `/ready` бұған дейін 200 қайтарған. |
| **Expo Go тест ортасы** | `mobile` ішінде Metro көтерілді (`npm run start:vps`), хост: `5.75.162.140`, Expo URL: `exp://5.75.162.140:8081`. |
| **UI өзгерісі (сұралған)** | Басты экрандағы Құбыла блогы кішірейтілді (`mobile/src/screens/DashboardScreen.tsx`): компас `68 -> 56`, мәтін және аралықтар азайтылды. |
| **Expo қайта жаңарту** | UI өзгерісінен кейін Metro қайта старт жасалды, телефоннан reload арқылы жаңа көрініс тексеруге дайын. |

### 14.2 Сервер/желілік нақты күй

| Тексеру | Нәтиже |
|--------|--------|
| `ss -ltnp` port `8787` | Тыңдап тұр (`0.0.0.0:8787`, uvicorn процесі бар). |
| Firewall (`ufw`) | `Status: inactive` (локаль блок көрінбейді). |
| `iptables` INPUT саясаты | `ACCEPT` (порт firewall-де тікелей жабылып тұрған белгі жоқ). |
| Сервер IPv4 | `5.75.162.140` |
| API docs (телефон) | Ашылды, endpoint тізімі көрінді. |

### 14.3 Табылған мәселе / тәуекел

| Мәселе | Әсері | Ұсыныс |
|-------|------|--------|
| **Telegram DNS тұрақсыздығы** (`api.telegram.org` resolve уақытша қате) | Бот кейде polling кезінде үзіліп қалуы мүмкін (`Temporary failure in name resolution`). | DNS серверлерін тұрақтандыру (`/etc/resolv.conf`, `systemd-resolved`, провайдер DNS); мониторингпен қайта тексеру. |
| Expo offline warning (well-known versions endpoint) | Dev режимде dependency валидациясы ескерту бере алады, бірақ Metro жұмысын тоқтатпайды. | Интернет/DNS тұрақтанған соң Expo толық online режимде қайта тексеру. |

### 14.4 Мобильді/Expo үшін практикалық нұсқаулық (операторға)

1. Телефондағы Expo Go ашу.
2. URL арқылы кіру: `exp://5.75.162.140:8081`.
3. Қосымша ашылғаннан кейін Home-да Құбыла блогының ықшам нұсқасын тексеру.
4. Егер ескі UI тұрса: Expo Go ішінде `Reload`.
5. Егер қосылмаса: `timeout`/`connection refused` типін белгілеу (желілік диагностика үшін).

### 14.5 Auth smoke-test (Swagger)

`POST /api/v1/auth/login` үшін минимал дене:

```json
{
  "username": "admin",
  "password": "YOUR_PASSWORD"
}
```

Ескерту:
- `username` — `RAQAT_AUTH_USERNAME` (әдепкіде `admin` болуы мүмкін).
- `password` — `RAQAT_AUTH_PASSWORD` (немесе `RAQAT_AUTH_PASSWORD_BCRYPT`-ке сәйкес нақты пароль).
- Токен алған соң `Authorize` арқылы `GET /api/v1/users/me` тексеріледі.

### 14.6 Өзгертілген файлдар (осы сессия)

- `mobile/src/screens/DashboardScreen.tsx` — Құбыла блогын визуалды кішірейту.
- `docs/PLATFORM_GPT_HANDOFF.md` — осы толық статус-отчет бөлімі қосылды.

### 14.7 Келесі қадамдар (ұсыныс)

1. DNS мәселесін түбегейлі түзету (бот тұрақтылығы үшін міндетті).
2. Expo Go арқылы нақты user flow smoke test: Home → Prayer Times → Qibla → AI Chat.
3. Swagger арқылы auth + protected endpoint (`/users/me`) бекіту.
4. Қажет болса осы өзгерістерді бір commit-пен бекіту.

### 14.8 Схема жөндеу (2026-04-18) — миграция 014 + auth тесті

| Тақырып | Мазмұны |
|---------|--------|
| **Мәселе** | Кейбір SQLite снапшоттарда `schema_migrations` ішінде **12** нұсқа қолданылған деп тұрғанымен **`platform_password_logins`** / **`platform_hatim_read`** кестелері жоқ болды — `POST /auth/login` **`IDENTITY_ISSUE_FAILED`** немесе «no such table» беруі мүмкін еді. |
| **Шешім** | Миграция **014** (`repair_user_data_tables_if_missing`): кестелердің біреуі жоқ болса `ensure_user_data_tables()` қайта шақырылады. Репо **`global_clean.db`** жаңартылды. |
| **Документтелген мінез** | Bootstrap **`/auth/login`** JWT **`sub` = uuid** (`platform_user_id`); `/auth/link/telegram` клиент тармағында uuid табылмаса — **400** `SUB_NOT_PLATFORM_UUID`. |
| **Тест** | `tests/test_auth_link.py` — legacy access JWT (uuid емес `sub`) арқылы осы 400 кодын тексереді. |

Толығырақ: **§23**.

---

## 15. Орындау пакеті (A / Ә / Б / В)

Бұл бөлім — бірден орындауға дайын командалар мен конфигурациялар.

### A) DNS мәселесін шешу (бот тұрақтылығы)

Қауіпсіз dry-run:

```bash
bash scripts/fix_dns_resolved.sh
```

Нақты apply:

```bash
sudo bash scripts/fix_dns_resolved.sh --apply
```

Скрипт не істейді:
- `systemd-resolved` үшін override жазады: `DNS=1.1.1.1 8.8.8.8`, `FallbackDNS=9.9.9.9 1.0.0.1`;
- `systemctl restart systemd-resolved`;
- `api.telegram.org` DNS resolve + HTTPS reachability smoke-test.

### Ә) Auth/JWT интеграциясы (Identity Linking end-to-end)

Flow тексеру:

```bash
bash scripts/verify_identity_linking.sh
```

Басқа тест Telegram id-мен:

```bash
TG_TEST_USER_ID=777000001 bash scripts/verify_identity_linking.sh
```

Тексерілетін толық тізбек:
1. `POST /api/v1/auth/link/telegram`
2. `POST /api/v1/ai/chat` (dev verify ішінде mock)
3. `GET /api/v1/users/me/history`
4. DB кестелерінде сәйкестік (`platform_identities`, `platform_ai_chat_messages`)

### Б) PostgreSQL Cutover (audit + migrate)

Аудит нәтижесі (`scripts/audit_sql_placeholders.py`):
- **12 файлда** SQL `?`/f-string review нүктелері табылды.
- Негізгі аймақтар: `db/*`, `platform_api/content_reader.py`, `services/*`, `handlers/*`.
- Бұл күтілетін нәтиже (SQLite-үйлесімді код). Cutover кезінде `db/dialect_sql.py` және migrate қабаты арқылы кезең-кезеңімен көшу керек.

Толық cutover wrapper (`docs/OPERATIONS_RUNBOOK_5_TRACKS.md`):

```bash
export PG_DSN='postgresql://user:pass@host:5432/dbname'
bash scripts/run_pg_cutover.sh --validate-only   # тек аудит + жол саны (көшірмесіз)
bash scripts/run_pg_cutover.sh                    # немесе --apply: backup + migrate
```

Скрипт реттілігі (`--apply`):
1. placeholder audit
2. SQLite backup
3. `migrate_sqlite_to_postgres.py --bootstrap-ddl --with-quran-hadith --validate`
4. `--validate-only` қайталап тексеру

Лог файлы: `.logs/pg_cutover_YYYYmmdd_HHMMSS.log`

### В) UI/UX жақсарту (Expo)

Осы пакеттің ішінде Home экраны жақсартылды:
- «Басты модульдер» (`focusTitle`) тақырыбы қосылды;
- «Бүгінгі аят» CTA картасы Home-ға қосылды (Prayer + Daily Ayah + AI үштігі айқынырақ болды);
- Құбыла hero блогы алдыңғы сұраныс бойынша ықшам күйде қалдырылды.

Файл:
- `mobile/src/screens/DashboardScreen.tsx`

Expo жаңарту:

```bash
cd mobile
npm run start:vps
```

Телефон: `exp://<server-ip>:8081` → Reload.

### Экожүйе релизі (жаңа артефакттар)

- `scripts/release_content_pipeline.sh` — import → API validate → mobile sync smoke.
- `scripts/validate_content_release.py` — health/ready/content + metadata ETag/304 + incremental fetch smoke.
- `docs/API_ONLY_ECOSYSTEM_CUTOVER.md` — bot/app/web үшін API-only cutover runbook.

### Bot API-first hardening (handlers/hadith.py, handlers/quran.py)

`RAQAT_BOT_API_ONLY=1` режимі үшін боттың контент read-path-тары күшейтілді:

- `handlers/hadith.py`:
  - random hadith және hadith search логикасы API-first (`platform_api`) жолына көшірілді;
  - API сәтсіздігінде DB fallback қолданылмайды;
  - пайдаланушыға "табылмады" орнына API қолжетімсіздігі туралы анық хабар беріледі.

- `handlers/quran.py`:
  - Quran search және surah read-path API-first режимде API-дан оқиды;
  - API сәтсіз болған жағдайда user-friendly alert/мәтін қайтарылады;
  - API-only кезінде DB fallback read-path енді пайдаланылмайды.

Қолдау үшін API-да жаңа endpoint-тер қосылды:

- `GET /api/v1/hadith/random`
- `GET /api/v1/hadith/search`
- `GET /api/v1/quran/search`

Ескерту:
- dynamic route қақтығысын болдырмау үшін `content_routes.py` ішінде route order түзетілді
  (`/hadith/random`, `/hadith/search`, `/quran/search` жолдары parameterized route-тардан бұрын жарияланды).

### Bot API-only smoke automation (жаңартылды)

Bot handler-лердің API-only read-path-тарын тұрақты тексеру үшін жаңа smoke script қосылды:

- `scripts/smoke_bot_api_only_content.py`
  - `/ready`
  - `/api/v1/hadith/random`
  - `/api/v1/hadith/search`
  - `/api/v1/quran/search`
  - `/api/v1/quran/{surah}`

Қолмен іске қосу:

```bash
set -a; source .env; set +a
.venv/bin/python scripts/smoke_bot_api_only_content.py \
  --api-base "${RAQAT_PLATFORM_API_BASE:-http://127.0.0.1:8787}" \
  --content-secret "${RAQAT_CONTENT_READ_SECRET:-}"
```

Қосымша hardening:

- `services/platform_content_service.py` ішінде API қателері екіге бөлінді:
  - `not_found` (контент шын мәнінде жоқ),
  - `unavailable` (API/желілік мәселе).
- Осы статустар `handlers/hadith.py` және `handlers/quran.py` ішінде бөлек өңделеді:
  - `not_found` → табиғи “табылмады” жауабы,
  - `unavailable` → user-friendly “API уақытша қолжетімсіз” хабарламасы.

### Nightly maintenance интеграциясы (жаңартылды)

`scripts/nightly_maintenance.sh` енді келесі реттілікпен жүреді:

1. `backup_sqlite.sh`
2. `healthcheck_raqat.sh`
3. `validate_content_release.py`
4. `smoke_bot_api_only_content.py`

Лог:
- `.logs/nightly_maintenance.log`

Соңғы run нәтижесі:
- бот API-only smoke endpoint-тері `200 OK` арқылы өтті.

---

## 16. Архитектура update (2026-04-16) — жаңа `platform_api/app` қабаты

Бұл бөлім соңғы енгізілген өзгерістерді (қазіргі сәттегі актуал күйді) бекітеді.

### 16.1 Не қосылды

`platform_api` ішінде жаңа модульдік қабат құрылды:

- `platform_api/app/main.py` — жаңа FastAPI entrypoint
- `platform_api/app/core/config.py` — env-конфигурация (`RAQAT_API_PREFIX`, `CORS_ORIGINS`, `RAQAT_DB_PATH`)
- `platform_api/app/core/response.py` — unified success/error envelope
- `platform_api/app/infrastructure/db.py` — readiness ping
- `platform_api/app/api/v1/router.py` — домендік роутер композициясы
- `platform_api/app/api/v1/endpoints/*` — auth/users/quran/hadith/ai/worship/halal

Қосымша құжат:

- `docs/RAQAT_V1_TECHNICAL_ARCHITECTURE.md` — layered архитектура, AI contract, security/reliability ережелері, next steps.

### 16.2 Үйлесімділік саясаты (compatibility)

Қазіргі production-модель бұзылған жоқ:

- `platform_api/main.py` (ескі MVP entrypoint) сақталды;
- жаңа архитектура параллель енгізілді (`platform_api/app/*`);
- көшу стратегиясы: endpoint-терді кезең-кезеңімен `app/` қабатына тасымалдау.

### 16.3 Жаңа v1 endpoint-тер (қазір жұмыс істейді)

Base: `http://<host>:8788/api/v1` (жаңа entrypoint қолданғанда)

| Метод | Жол | Күйі |
|--------|-----|------|
| POST | `/auth/login` | Жұмыс істейді (bootstrap credentials + JWT pair) |
| POST | `/auth/refresh` | Жұмыс істейді (refresh decode + jti revocation check + rotate) |
| GET | `/users/me` | Жұмыс істейді (Bearer access token claims) |
| GET | `/quran/surahs` | Жұмыс істейді |
| GET | `/quran/search` | Жұмыс істейді |
| GET | `/quran/surahs/{surah}/ayahs` | Жұмыс істейді |
| GET | `/quran/surahs/{surah}/ayahs/{ayah}` | Жұмыс істейді |
| GET | `/hadith/collections` | Placeholder list (v1 scaffold) |
| GET | `/hadith/search` | Жұмыс істейді |
| GET | `/hadith/{hadith_id}` | Жұмыс істейді |

Сервис health/readiness:

- `GET /health`
- `GET /ready`

### 16.4 Auth/identity техникалық деталь

Жаңа `app` auth endpoint-тері бар ортақ механизмдермен жұмыс істейді:

- `auth_credentials.py` — bootstrap credential verify
- `jwt_auth.py` — access/refresh issue/decode
- `db/governance_store.py` — refresh JTI revoke/prune
- `db_reader.resolve_db_path()` — DB орналасуын біріздендіру

Яғни жаңа қабат existing security/data механизмін қайта қолданады (duplicate logic жасалмаған).

### 16.5 Іске қосу командалары (жаңа қабат)

Репо түбінен:

```bash
cd platform_api
uvicorn app.main:app --host 0.0.0.0 --port 8788
```

Тексеру:

- `GET http://127.0.0.1:8788/health`
- `GET http://127.0.0.1:8788/ready`
- `GET http://127.0.0.1:8788/docs`

Ескерту:

- `8787` — legacy `main.py`;
- `8788` — жаңа modular `app.main`.

### 16.6 Қай файлдар нақты қосылды (2026-04-16)

- `docs/RAQAT_V1_TECHNICAL_ARCHITECTURE.md`
- `platform_api/app/__init__.py`
- `platform_api/app/main.py`
- `platform_api/app/core/config.py`
- `platform_api/app/core/response.py`
- `platform_api/app/infrastructure/db.py`
- `platform_api/app/api/v1/router.py`
- `platform_api/app/api/v1/endpoints/auth.py`
- `platform_api/app/api/v1/endpoints/users.py`
- `platform_api/app/api/v1/endpoints/quran.py`
- `platform_api/app/api/v1/endpoints/hadith.py`
- `platform_api/app/api/v1/endpoints/ai.py`
- `platform_api/app/api/v1/endpoints/worship.py`
- `platform_api/app/api/v1/endpoints/halal.py`

### 16.7 Келесі міндетті қадамдар (implementation backlog)

1. `app` қабатына толық JWT deps/policies қосу (scope-level guards).
2. `/ai/chat` — retrieval-grounded pipeline (`ai_proxy.py`) кеңейту, semantic cache (кейін).
3. SQLAlchemy + Alembic (PostgreSQL-first schema) — `docs/ALEMBIC_BOOTSTRAP.md`.
4. `platform_users / sessions / refresh_tokens` толық домен модельдері; **audit:** SQLite миграциясы **010** `audit_events` + `append_audit_event` (`db/governance_store.py`) іске қосылды.
5. **Redis:** AI rate limit multi-worker (`platform_api/ai_rate_limit.py`, `RAQAT_AI_RL_USE_REDIS`), `/ready` ішінде `redis` күйі (`db_reader.readiness_ping`, `app/infrastructure/db.py`); **exact AI cache** (`platform_api/ai_exact_cache.py`, `ai_routes` → `cached` өрісі).
6. **Celery:** `celery_tasks.py` (AI chat / сурет / TTS / transcribe), `ai_routes` **`async_mode`** + **`GET /ai/task/{id}`** — төмен **§21.5**, **§22.2**. Скелет `raqat.ping` + нақты тапсырмалар.
7. `platform_api/main.py` → `app.main` cutover runbook (zero-downtime) — әлі backlog.

Толығырақ жаңа өзгерістер: төмен **§21**, жинақ **§22**.

---

## 17. Scale Hardening Mandates (2026-04-16)

Төмендегі 4 принцип RAQAT үшін **міндетті архитектуралық талап** ретінде бекітілсін.

### 17.1 Stateless API (ең маңызды)

API instance жадысында (in-memory/local state) бизнес-күй сақталмайды.

Міндетті:

- session/auth күйі — token + DB/Redis
- rate-limit counters — Redis
- қысқа AI жад/кэш — Redis
- фондық task күйі — queue backend

Нәтиже: горизонталь масштаб (`N` instance) кезінде consistency сақталады.

### 17.2 Redis (mandatory infrastructure)

Redis енді v1 target stack-тың міндетті бөлігі:

- AI rate limiting (**ZSET**, multi-worker — `ai_rate_limit.py`, §21.2)
- session/cache layer
- prayer/halal/AI short cache
- **AI exact chat cache** (`ai_exact_cache.py`, §21.2)
- queue coordination (broker/backend; Celery скелеті §21.5)

Критерий:

- Redis жоқ болса, сервис degraded деп белгіленуі тиіс;
- critical path DB-only режимінде қалмауы керек.

Толық env және файл жолдары: **§21.2–21.5**.

### 17.3 Queue System (async-first for heavy work)

Heavy процестер synchronous request жолынан шығарылады:

- AI heavy inference
- image analysis
- TTS generation
- notifications
- analytics aggregation

Ұсынылған стек:

- Celery + Redis (қазіргі baseline)
- болашақта қажет болса RabbitMQ/Kafka

### 17.4 Failover / Fallback policy

Бір сервистің ақауы бүкіл экожүйені құлатпауға тиіс:

- AI down -> Qur'an/Hadith read API жалғасады
- queue down -> sync fallback немесе graceful "accepted/degraded" жауап
- Redis down -> қысқа мерзім degraded mode (alert), critical flows continue
- API down -> bot limited fallback mode (read-only/basic)

SLO-ға әсер ететін барлық деградация audit/monitoring арқылы тіркелуі тиіс.

### 17.5 Қазіргі код базасына енгізілген минимал база

`platform_api/app` ішінде бастапқы hardening scaffold қосылған:

- `app/infrastructure/redis_client.py`
- `app/infrastructure/cache.py`
- `app/infrastructure/queue.py`
- `app/api/v1/endpoints/ai.py` (`async_mode`, queue attempt, graceful fallback, short cache)
- `app/core/config.py` (`RAQAT_REDIS_URL`, `RAQAT_QUEUE_BACKEND`, `RAQAT_FAILOVER_MODE`)

Ескерту: бұл — foundation layer; нақты **`ai_routes`** (`async_mode`, Celery) және **`/metrics`** production жолында; `app/api/v1/endpoints/ai.py` — scaffold/queue үлгісі. Толық hardening: policy guards, circuit breaker, retries, Sentry — келесі фаза. Толығырақ: **§22**.

---

## 18. Hadith KK Translation — Resume Runbook (2026-04-16)

Сахих хадистерді (Bukhari + Muslim) аударуды тоқтаған жерінен қауіпсіз жалғастыру үшін осы бөлім бекітілді.

### 18.1 Ағымдағы статус (операциялық)

- DB: `global_clean.db`
- Hadith total: `33,738`
- `text_kk` filled: `6,581` (~`19.5%`)
- Missing: `27,157`

Ескерту: алдыңғы тоқтау себептері:

- `403 PERMISSION_DENIED` (project/model access)
- `404 NOT_FOUND` (ескі модель `gemini-1.5-flash`)
- кейде `503 UNAVAILABLE` (model high demand, retry қажет)

### 18.2 Safe resume скрипті

Жаңа скрипт:

- `scripts/run_hadith_kk_safe_resume.sh`

Не істейді:

- `.env` жүктейді
- `AI_MODEL_CANDIDATES` дефолтын modern модельдерге қояды:
  - `gemini-2.5-flash,gemini-2.5-flash-lite`
- `translate_hadith_kk_batch.py`-ды conservative retry/sleep параметрлерімен іске қосады
- `FROM_ID` арқылы resume қолдайды
- backup жасайды

### 18.3 Іске қосу командалары

Қысқа smoke:

```bash
LIMIT=20 SLEEP_SEC=4 MAX_ERRORS=5 bash scripts/run_hadith_kk_safe_resume.sh
```

Ұзақ run (resume):

```bash
FROM_ID=107803 LIMIT=0 SLEEP_SEC=4 MAX_ERRORS=20 bash scripts/run_hadith_kk_safe_resume.sh
```

Background режим:

```bash
nohup bash scripts/run_hadith_kk_safe_resume.sh > hadith_kk.log 2>&1 &
```

### 18.4 Прогресс тексеру

```bash
python3 -c "from platform_api.db_reader import get_content_stats; import json; print(json.dumps(get_content_stats(), ensure_ascii=False, indent=2))"
```

### 18.5 Міндетті ескертулер (SRE)

- `503 UNAVAILABLE` — уақытша, retry арқылы жалғасады.
- `403 PERMISSION_DENIED` тұрақты болса, бұл код қатесі емес; Gemini project access/quotas түзету керек.
- Әр run алдында backup жасалғанына көз жеткізу керек.
- FTS қолданылса, толықтырудан кейін: `python create_hadith_fts.py`.

---

## 19. Integration Completed — Bot + Mobile = One Platform (2026-04-16)

Бұл бөлімде экожүйені бір орталыққа біріктіру статусы бекітіледі.

### 19.1 Негізгі принцип

RAQAT-та бот пен мобильді клиенттің барлық негізгі дерегі мен AI логикасы бір көзден келуі керек:

- **Single source of truth:** `platform_api`
- Клиенттер: Telegram bot + Mobile app + Web
- Бір identity кеңістігі: `platform_user_id` / JWT

### 19.2 Іске асқан өзгерістер

Код деңгейінде бір орталық режим қосылды:

- `config/settings.py`
  - `RAQAT_BOT_API_ONLY` дефолты -> `1`
  - жаңа `RAQAT_SINGLE_SOURCE_MODE` дефолты -> `1`
- `services/genai_service.py`
  - AI/TTS/voice/image үшін боттағы тікелей Gemini fallback single-source режимде өшірілді
  - жол: Bot -> Platform API -> Gemini/provider
- `.env.example`
  - `RAQAT_SINGLE_SOURCE_MODE=1` құжаты қосылды

### 19.3 Smoke валидация (өткен)

API-only bot content smoke нәтижесі:

- `GET /ready` -> 200
- `GET /api/v1/hadith/random` -> 200
- `GET /api/v1/hadith/search` -> 200
- `GET /api/v1/quran/search` -> 200
- `GET /api/v1/quran/{surah}` -> 200

### 19.4 Known operational risk

- Telegram Bot API жағына DNS тұрақсыздығы байқалған:
  - `api.telegram.org` resolution intermittent failure
- Бұл архитектура қатесі емес, infra/network reliability мәселесі.

---

## 20. Production Checklist — Unified Platform Mode

Бұл чеклист біріккен режимді production-ға қауіпсіз шығару үшін.

### 20.1 Required env (must-have)

- `RAQAT_PLATFORM_API_BASE`
- `RAQAT_AI_PROXY_SECRET`
- `RAQAT_BOT_API_ONLY=1`
- `RAQAT_SINGLE_SOURCE_MODE=1`
- `RAQAT_JWT_SECRET` (>=32)
- `DATABASE_URL` (production DSN)

### 20.2 Service baseline

- Platform API (`8787`) up
- PostgreSQL healthy
- Redis healthy (cache/rate-limit/queue)
- Worker queue healthy (Celery/RQ)
- Bot process healthy and polling

### 20.3 Health gates (release blocker)

Release тек мына шарттар орындалса ғана:

1. `/health` -> 200
2. `/ready` -> 200
3. API-only smoke endpoints -> 200
4. `auth/login` және `users/me` smoke -> OK
5. Bot -> AI -> response flow -> OK

### 20.4 Reliability controls

- Structured logs + request_id
- Error tracking (Sentry немесе ұқсас)
- Alerting:
  - `/ready` fail
  - queue backlog high
  - AI 5xx rate high
  - Telegram DNS/connect failures

### 20.5 Security controls

- Secrets rotation policy
- `RAQAT_AI_PROXY_SECRET` тек серверде
- RBAC + audit logs enabled
- Admin әрекеттері толық журналданады

### 20.6 Backup / recovery

- Nightly backup (`scripts/backup_sqlite.sh` немесе PG backup policy)
- Restore drill аптасына кемінде 1 рет
- `scripts/nightly_maintenance.sh` cron арқылы қосулы

### 20.7 Go-live command set (reference)

```bash
set -a; source .env; set +a
export RAQAT_BOT_API_ONLY=1
export RAQAT_SINGLE_SOURCE_MODE=1
bash scripts/dev_restart_platform.sh
.venv/bin/python scripts/smoke_bot_api_only_content.py --api-base "${RAQAT_PLATFORM_API_BASE:-http://127.0.0.1:8787}" --content-secret "${RAQAT_CONTENT_READ_SECRET:-}"
```

Ескерту: production-та `dev_restart_platform.sh` орнына systemd/docker orchestration ұсынылады.

---

## 21. Экожүйе, Redis, AI cache, audit, Celery, Telegram күту (2026-04-16 жаңарту)

Бұл бөлім GPT/инженер үшін **соңғы код күйін** бекітеді: репо құрылымы, орталық API оптимизациясы, боттың сынбауы мен ұзақ күтпеуі.

### 21.1 Репозиторий картасы (modular monolithқа дайындық)

| Элемент | Сипат |
|---------|--------|
| `ECOSYSTEM.md` | Түбірде: қалталар кестесі, Docker, build order сілтемесі |
| `apps/` | Blueprint карта: `apps/api/README.md` → нақты `platform_api/`, `apps/bot`, `apps/mobile` → `mobile/`, т.б. |
| `packages/` | Келешек Python домен пакеттері (қазір `.gitkeep` + `README.md`) |
| `infra/docker/docker-compose.yml` | PostgreSQL 16 + Redis 7; **Celery** `celery-worker` сервисі профиль **`workers`** |
| `docs/PRODUCTION_BLUEPRINT_2M_USERS.md` | 2M+ user архитектуралық карта |
| `docs/ALEMBIC_BOOTSTRAP.md` | Alembic бастау, PG үшін `audit_events` DDL |

### 21.2 Redis (platform_api)

| Айнымалы / файл | Мазмұны |
|------------------|---------|
| `RAQAT_REDIS_URL` | Әдепкі `redis://127.0.0.1:6379/0`; `app/core/config.py` → `settings.redis_url` |
| `platform_api/app/infrastructure/redis_client.py` | `get_redis_client()`, ping сәтті болса клиент кэште |
| `platform_api/ai_rate_limit.py` | Redis **ZSET** sliding window (`raqat:ai_rl:v1:…`); `RAQAT_AI_RL_USE_REDIS=0` → in-memory fallback |
| `platform_api/db_reader.py` → `/ready` | Жауапқа **`redis`** блогы (`ok` / `unavailable`); `RAQAT_READINESS_REQUIRE_REDIS=1` болса Redis жоқта **`ok: false`** |
| `platform_api/ai_exact_cache.py` | L1 **exact** prompt→жауап кэші; `RAQAT_AI_EXACT_CACHE`, `RAQAT_AI_CACHE_TTL_SECONDS`, `RAQAT_AI_CACHE_MAX_CHARS` |
| `platform_api/ai_routes.py` | `/ai/chat` алдымен кеш, содан `generate_ai_reply`; жауапта **`cached`: bool** |

### 21.3 AI proxy жылдамдығы (Gemini)

| Файл | Өзгеріс |
|------|---------|
| `platform_api/ai_proxy.py` | `thinking_budget=0`, `RAQAT_AI_MAX_OUTPUT_TOKENS`, Google Search өшік кезде де `GenerateContentConfig`; қысқартылған structure rules |
| `services/genai_service.py` | Тікелей Gemini шақыруда да сол thinking + max_output; `RAQAT_AI_MAX_OUTPUT_TOKENS` |

### 21.4 Audit (SQLite миграция 010)

| Элемент | Сипат |
|---------|--------|
| `db/migrations.py` | `_migration_010_audit_events` — кесте `audit_events` + индекстер |
| `db/governance_store.py` | `append_audit_event(...)` — AI чат соңында шақырылады |
| PostgreSQL | Кестені қолмен/Alembic қосу: `docs/ALEMBIC_BOOTSTRAP.md` ішіндегі DDL мысалы |

### 21.5 Celery

| Элемент | Сипат |
|---------|--------|
| `platform_api/celery_app.py` | `Celery("raqat")`, broker=`RAQAT_CELERY_BROKER_URL` \| `RAQAT_REDIS_URL`, result backend, task **`raqat.ping`** (smoke), `task_track_started`, уақыт шектеулері |
| `platform_api/celery_tasks.py` | **`raqat.ai.chat`**, **`raqat.ai.analyze_image`**, **`raqat.ai.tts`**, **`raqat.ai.transcribe`** — Gemini/кэш/audit worker ішінде |
| `platform_api/app/infrastructure/queue.py` | Бір ортақ `celery_app.send_task` (бұрынғы жаңа `Celery()` дубликаты жойылған) |
| `ai_routes.py` | Денеде **`async_mode`: true** → `task_id`; **`GET /api/v1/ai/task/{task_id}`** — нәтиже |
| `infra/docker/docker-compose.yml` | `celery-worker` профиль **`workers`**, `RAQAT_QUEUE_BACKEND=celery` |
| `.env.example` | `RAQAT_QUEUE_BACKEND`, `RAQAT_CELERY_BROKER_URL`, `RAQAT_CELERY_RESULT_BACKEND` |
| `docs/OPERATIONS_STACK_CHECKLIST.md` | Worker іске қосу, GEMINI/DB ортасының worker-де де болуы |

### 21.6 Telegram бот — сынбау және ұзақ күтпеу

| Файл | Мазмұны |
|------|---------|
| `services/telegram_ai.py` | `ask_genai_telegram` — `asyncio.wait_for` + timeout/exception жұмсақ жауап |
| `config/settings.py` | `RAQAT_PLATFORM_AI_HTTP_TIMEOUT` (httpx оқу, әдепкі ~52 с), `RAQAT_BOT_AI_WAIT_TOTAL` (бот, әдепкі ~68 с) |
| `services/genai_service.py` | Platform `/ai/chat` шақыруы осы HTTP timeout-пен шектеледі |
| `handlers/ai_chat.py`, `handlers/halal.py`, `handlers/voice.py` | Барлығы `ask_genai_telegram` пайдаланады; күту хабарламасы: **«Жауап дайындалуда…»** |
| `handlers/ai_chat.py` | `append_telegram_ai_turn` және жауап жіберу бөлек try/except |

### 21.7 Expo / мобильді (қысқа)

| Тақырып | Файл |
|---------|------|
| Вебте браузер «артқа» | `mobile/App.tsx` → `linking={raqatLinking}`, `mobile/src/navigation/linking.ts` |
| Құран сүре атауы KK | `mobile/src/constants/surahTitleKk.ts`, `surahBundledMeta.ts` |
| `QuranSurah` deep link | `route.params.englishName` / `arabicName` опциялы; `useLayoutEffect` title |
| Офлайн Құран + UI жауаптығы | `bundledQuranSeed.ts` (`runWhenHeavyWorkAllowed` → `utils/uiDefer.ts`), тізім/сүре: кеш барда фондық сидинг |
| Күнделікті аят | `DailyAyahScreen` — араб кеште болса сидингсіз |

### 21.8 Тазалау (репо)

- Логтар (`*.log`, `.logs/`, `logs/`), `__pycache__` жойылды; `.gitignore` → `logs/`.
- **`reset_working_bot.sh`**, **`setup_raqat.sh`** жойылды (ескі scaffold, нақты файлдарды үстінен жазатын болған).

### 21.9 Келесі инженерлік басымдық (қысқа)

1. Semantic AI cache — **опциялық қосылған**: `RAQAT_AI_SEMANTIC_CACHE`, embedding/Gemini ортасы; `ai_semantic_cache.py`, `OPERATIONS_STACK_CHECKLIST.md`.  
2. PostgreSQL толық cutover + Alembic ревизиялары (`run_pg_cutover.sh`, `OPERATIONS_STACK_CHECKLIST.md`).  
3. `platform_api/main.py` → `app.main` өндіріс cutover runbook.  
4. Бот/мобильді клиенттерде **`async_mode`** + poll (`/ai/task/...`) — қажет болса өндіріс UX-ге қосу (API дайын).

---

## 22. Жинақтау нұсқауы (2026-04-18) — GPT / SRE үшін бір сурет

Бұл бөлім жоғарыдағы **§1–§21** мен тыс құжаттарды **бір экранға** жинайды; SQLite auth/схема нақтылығы үшін **§23**; барлық тақырып бойынша **толық сілтеме картасы** — **§24**; соңғы мобильді mushaf/хатым/rotation — **§26**; Құран оқудың соңғы нақты қадамдары — **§26.7** және мұсаф рефактор/жестер — **§26.8**; **келесі sprint тізімі** — **§29**. Жаңа сессияда **§22 + §23 + §24** (+ мобильді UX үшін **§26**, **§26.7**, **§26.8**, **§29**, қажет болса) және **`PRODUCTION_POSTURE.md`** жеткілікті.

### 22.1 Бір бетте не бар

| Мақсат | Қайда |
|--------|--------|
| **Өндіріс позициясы (SQLite жоқ, Redis міндетті, Grafana жол картасы)** | `docs/PRODUCTION_POSTURE.md` |
| **Ops стек (Redis, PG, Celery, DNS, тексеру)** | `docs/OPERATIONS_STACK_CHECKLIST.md`, `scripts/ops_stack_checklist.sh` |
| **PG cutover** | `scripts/run_pg_cutover.sh` — аяқтағаннан кейін `.env` → `DATABASE_URL` / `DATABASE_URL_WRITER` = `PG_DSN` |
| **DNS** | `scripts/fix_dns_resolved.sh --apply` |
| **Сервистер** | `infra/docker/docker-compose.yml` — Postgres 16, Redis 7, `celery-worker` (`--profile workers`) |
| **Мониторинг (минимум)** | `GET /metrics` (`uptime_seconds`, `http_5xx_total`, latency), `GET /health`, `GET /ready`, `scripts/healthcheck_raqat.sh`; Prometheus scrape мысалы — `OPERATIONS_STACK_CHECKLIST.md` §5 |

### 22.2 API жағы (орталық AI + async)

| Тақырып | Мазмұны |
|---------|---------|
| Синхрон AI | `POST /api/v1/ai/chat` және т.б. — бұрынғыдай |
| Async | Денеде **`async_mode`: true** → `task_id`; **`GET /api/v1/ai/task/{task_id}`** |
| Код | `ai_routes.py`, `celery_tasks.py`, `celery_app.py`, `queue.py` |
| Орта | `RAQAT_REDIS_URL`, `RAQAT_QUEUE_BACKEND=celery`, worker ішінде де `GEMINI_API_KEY` + DB |

### 22.3 Мобильді жағы (офлайн + UI жауаптығы)

| Тақырып | Мазмұны |
|---------|---------|
| Құран бандлы | `seedBundledQuranCachesIfNeeded` — mutex + `runWhenHeavyWorkAllowed` (`utils/uiDefer.ts`) |
| Тізім/сүре | Кеш толық болса сидинг **фонда**; бос кеште офлайн үшін күту сақталады |
| Күнделікті аят | Кеште араб бар болса ауыр сидинг **шақырылмайды** |

### 22.4 Модельге жіберу тәртібі

1. **Минимум:** осы `PLATFORM_GPT_HANDOFF.md` (**§22** жинақтау, **§23** DB/auth, **§24** карта).  
2. **+ өндіріс шегі / аудит:** `PRODUCTION_POSTURE.md` (PG міндетті, Redis міндетті, monitoring, semantic cache, Celery).  
3. **+ өндіріс орнату:** `OPERATIONS_STACK_CHECKLIST.md`.  
4. **+ Құран мазмұны:** `QURAN_GPT_HANDOFF.md`.  
5. **+ PG:** `MIGRATION_SQLITE_TO_POSTGRES.md`.  
6. **+ хадис KK редакциясы:** `HADITH_DATA_PROVENANCE.md` §9, `data/hadith_kk_glossary.md`, `data/hadith_kk_editorial_batches.md`.

### 22.5 Ескерту

- **§16** жаңа `platform_api/app` қабаты (8788) **параллель** entrypoint; **негізгі өндіріс** әлі **`main.py` (8787)** — `ai_routes`, `auth_routes` т.б.  
- **§17–§21** принциптер мен Redis/Celery/audit сипаттамалары **§22**-мен толықтырылады, қайталау керек емес — қайта сұрақта **§22.1–22.3** жеткілікті.
- SQLite **`global_clean.db`** / көшірме файлдар: миграция **014** және bootstrap auth нақты күйі — **§23**.
- **Толық сілтеме кестесі (барлық тақырып):** **§24**.

---

## 23. SQLite схемасы, пароль логин және миграция жөндеуі (2026-04-18)

Бұл бөлім **GPT / SRE / жаңа әзірлеуші** үшін дерекқор шындығын бекітеді: платформа uuid, пароль арқылы кіру кестелері, ескі снапшоттарды қалпына келтіру.

### 23.1 Платформа identity және «пароль → uuid»

| Кесте / модуль | Мазмұны |
|----------------|--------|
| **`platform_identities`** | Тұрақты **`platform_user_id`** (uuid), опция **`telegram_user_id`**. Миграция **006** + `db/platform_identity_chat.py`. |
| **`platform_password_logins`** | `login_key` = `lower(strip(username))` → **`platform_user_id`**. Алғашқы кіруде uuid жасалады да, identity жолымен бірге жазылады. `db/password_login.py` → `ensure_platform_user_for_password_username`. |
| **`platform_hatim_read`** | Серверлік хатым прогресі (сурелер JSON). DDL екеуі де: **`db/user_data_schema.py`** → `ensure_user_data_tables(conn)`. |
| **PostgreSQL режимі** | `platform_api/main.py` lifespan: SQLite миграция өткізілмейді, бірақ **`ensure_user_data_tables`** (және community/oauth кестелері) `get_db()` арқылы шақырылады. |

### 23.2 Миграция нөмірлері (тізбек)

| Версия | Аты (қысқа) | Мазмұны |
|--------|-------------|---------|
| **012** | `user_hatim_and_password_login` | `ensure_user_data_tables` — пароль/хатым кестелері. |
| **013** | `oauth_and_phone_login` | OAuth/телефон кестелері (`db/oauth_phone_schema.py`). |
| **014** | `repair_user_data_tables_if_missing` | Егер **`platform_password_logins`** немесе **`platform_hatim_read`** жоқ болса қайта құрады (ескі снапшоттардағы сәйкессіздік үшін). |

Функция: `db/migrations.py` → `run_schema_migrations(db_path)`.

### 23.3 `POST /api/v1/auth/login` (bootstrap) нақты контракт

- Сәтті жауап: **`access_token` / `refresh_token`**, **`platform_user_id`** денеде; JWT ішінде **`sub` = uuid** (логин аты емес).
- Кесте жоқ / identity қатесі: **503** `IDENTITY_ISSUE_FAILED` (хабарлама қысқартылған).
- Swagger smoke: **§14.5**; `/users/me` үшін сол токенді Bearer ретінде қолдану.

### 23.4 `POST /api/v1/auth/link/telegram` (клиент Bearer тармағы)

- `jwt_auth.platform_user_id_from_payload`: алдымен **`platform_user_id`** claim (uuid), содан **`sub`** (uuid).
- Екеуі де uuid емес → **400** `SUB_NOT_PLATFORM_UUID` — ескі клиент токендері немесе қате шығарылған JWT үшін.
- Бот жолы (`X-Raqat-Bot-Link-Secret`) осы тексеруден бөлек: тікелей `ensure_platform_user_for_telegram` + жаңа жұп.

### 23.5 Тесттер және pytest ортасы

| Файл | Мазмұны |
|------|--------|
| `tests/conftest.py` | **`RAQAT_REDIS_REQUIRED=0`** — Redis міндетті startup API импортында өшіріледі (жергілікті pytest). |
| `tests/test_auth_link.py` | Бот құпиясы, идемпотенттілік, 401/503; **legacy JWT** (`sub` string) → **400** `SUB_NOT_PLATFORM_UUID`. |

### 23.6 Операторға: күмәнді SQLite файл

1. API іске қосу (SQLite) — lifespan **`run_schema_migrations`** орындайды.  
2. Немесе қолмен: `python -c "from db.migrations import run_schema_migrations; run_schema_migrations('/path/to/file.db')"`.  
3. **014** қолданылғаннан кейін `schema_migrations` кестесінде **14** жолы пайда болады; **`platform_password_logins`** бар екенін тексеруге болады.

Сілтеме: `docs/OPERATIONS_STACK_CHECKLIST.md` — Redis → API → Celery → Prometheus тізбегі; **§22.1**.

---

## 24. Жинақ картасы — тақырып бойынша барлық негізгі сілтемелер (2026)

Бұл бөлім **бір кестеде** жинақтайды: қай сұраққа қай құжат немесе жол; GPT / SRE / жаңа әзірлеуші **§24**-ті скринхоттап немесе көшіріп алса, репо бойынша навигация жасай алады. **Өнім жол картасы (§33–§38)** үшін алдымен **§24.0** қараңыз.

### 24.0 Өнім жол картасы — индекс (§33–§38)

Бұл кесте **фазаларды бір жерден** көру үшін: толық мәтін файлда **§31** бөлімінен кейін **§33** басталады (іздеу: `## 33.`).

| § | Атауы | Мерзім / түрі | Негізгі мазмұн |
|---|--------|---------------|----------------|
| **§33** | Фаза 1: Core Polish | 1–2 ай | Мұсаф, хатым, last read + streaks, намаз/құбыла, UI polish; **§29** спринттерімен сәйкес (**§33.6**) |
| **§34** | Фаза 2: All-in-One Retention | 2–4 ай | Dashboard хаб, тәсбих, Halal+, AI контекст, community lite |
| **§35** | Фаза 3: Advanced + Scale | 4–8 ай | AI терең, gamification, offline-first, PWA+Telegram, monetization |
| **§36** | Техникалық ұсыныстар | қосалқы | Mobile (**§31**), backend (PG/Redis/Celery), data, privacy, performance |
| **§37** | MVP boost | ~2 апта | Шұғыл 5 тапсырма; **§33**-пен **қатар** жүргізуге болады |
| **§38** | Болашақ позициялау | тұрақты | RAQAT образы; **§36** тірегі, **§37** + **§33** алғашқы қадам; **§1** адам ұстанымымен үйлесім |

**Ағымдық байланыс (логикалық):** §37 шұғыл пакеті §33 ядросына сіңеді; §33 → §34 → §35 реті ұзақ мерзімді өнім жолы; §36 барлық фазаларға инженерлік тірек; §38 стратегиялық нүкте.

```mermaid
flowchart TB
  A37["§37 MVP\n~2 апта"]
  A33["§33 Фаза 1\n1–2 ай"]
  A34["§34 Фаза 2\n2–4 ай"]
  A35["§35 Фаза 3\n4–8 ай"]
  A36["§36 Техника"]
  A38["§38 Образ"]
  A37 --> A33
  A33 --> A34
  A34 --> A35
  A36 -.-> A33
  A36 -.-> A34
  A36 -.-> A35
  A38 --> A36
```

### 24.0.1 Жергілікті тексеру және CI

**PowerShell (Windows):** `cmd` стиліндегі `&&` / `cd /d` **жұмыс істемейді** — бір каталогта `Set-Location` + нүктелі үтір (`;`) қолданыңыз.

| Орта | Команда мысалы |
|------|----------------|
| **Mobile** | `Set-Location d:\opt\raqat-ai\mobile; npm run lint; npx jest --ci` |
| **Python** | `Set-Location d:\opt\raqat-ai; .\.venv\Scripts\python.exe -m pytest tests -q` |
| **Бірге** | `npm run test:full` тек `mobile/` ішінен (**`package.json`**) |

**GitHub Actions:** `.github/workflows/refactor-smoke.yml` — PR / `workflow_dispatch`: `py_compile` (бот + `platform_api`), нысаналы **`pytest tests/test_platform_api.py -k ...`**, содан **`api-content-smoke`** (SQLite / PostgreSQL матрицасы, uvicorn + `validate_content_release.py`, `/metrics` p95 тексеруі). `.github/workflows/content-release-smoke.yml` — күн сайынғы cron + қолмен іске қосу; контент шығарылымына арналған smoke. Толығы workflow файлдарында.

### 24.1 Өнім және стратегия

| Сұрақ | Қайда |
|--------|--------|
| Барлық фазалар **бір кестеде** (шолу) | **§24.0** |
| Солтүстік жұлдыз, USER/VALUE/UX, XI–XII | `docs/RAQAT_PLATFORM.md` |
| Экожүйе карта, Docker, build order | `ECOSYSTEM.md`, `docs/PRODUCTION_BLUEPRINT_2M_USERS.md`, `infra/docker/docker-compose.yml` |
| Бәсекелес қолданбалардың ең күшті жақтары (RAQAT-қа идея ретінде) | **§1.0** |
| **Адамға жеңіл · оңай · керек** өнім ұстанымы | **§1** (кіріспе абзац), **§38** (позициялау) |
| Жол картасы: Фаза 1–3, техника, 2 апта MVP, позициялау (детальды мәтін) | **§24.0** (индекс + диаграмма), содан **§33**–**§38** |

### 24.2 Дерекқор және көшу

| Сұрақ | Қайда |
|--------|--------|
| SQLite → PostgreSQL, DSN, пул, placeholder | `docs/MIGRATION_SQLITE_TO_POSTGRES.md`, `db/get_db.py`, `db/dialect_sql.py` |
| Өндірісте SQLite емес | **`docs/PRODUCTION_POSTURE.md` §1**, `OPERATIONS_STACK_CHECKLIST.md` §2 |
| Alembic, PG DDL мысалдары | `docs/ALEMBIC_BOOTSTRAP.md` |
| SQLite миграция 012–014, bootstrap login | **§23**, `db/migrations.py` |

### 24.3 Redis, Celery, AI, бақылау

| Сұрақ | Қайда |
|--------|--------|
| Redis міндетті / тест `REQUIRED=0` | **`PRODUCTION_POSTURE.md` §2**, `tests/conftest.py` |
| Кезек, retry, timeout, DLQ жол картасы | **`PRODUCTION_POSTURE.md` §5**, `platform_api/celery_app.py`, `celery_tasks.py` |
| Орнату тізбегі | `OPERATIONS_STACK_CHECKLIST.md`, `scripts/ops_stack_checklist.sh` |
| `/metrics`, Prometheus, Grafana идеясы | **`PRODUCTION_POSTURE.md` §3**, `OPERATIONS_STACK_CHECKLIST.md` §5 |
| Exact + семантикалық AI кэш | **`PRODUCTION_POSTURE.md` §4**, `ai_exact_cache.py`, `ai_semantic_cache.py`, `RAQAT_AI_SEMANTIC_CACHE` |

### 24.4 Auth, JWT, Telegram link

| Сұрақ | Қайда |
|--------|--------|
| `/auth/login`, `/auth/link/telegram`, uuid `sub` | **§5.4**, **§23**, `platform_api/auth_routes.py`, `jwt_auth.py` |
| Тесттер | `tests/test_auth_link.py`, **§11** |

### 24.5 Құран / хадис мазмұны

| Сұрақ | Қайда |
|--------|--------|
| Құран импорт, транслит | `docs/QURAN_GPT_HANDOFF.md` |
| Хадис `source`, KK аударма, редакция | `docs/HADITH_DATA_PROVENANCE.md` (§9 редакция), `data/hadith_kk_glossary.md`, `data/hadith_kk_editorial_batches.md` |
| Ислам білім базасы / RAG (платформа + мобильді контекст) | **`docs/RAQAT_ISLAMIC_KNOWLEDGE_RAG.md`**; нақты модуль + env — **§42.5** (байланысы: **§39.6** дәстүр экраны) |
| Шежіре (genealogy) дереккөздер, P0/A1 schema | **`sources/genealogy_sources.md`**, **`docs/genealogy_schema.md`**, **`docs/genealogy_a1_production_lock.md`** — **§45** |

### 24.6 Мобильді (Expo)

| Сұрақ | Қайда |
|--------|--------|
| Jest + lint сандары (соңғы бекіту) | **§11** (және **§25.5** `mobile/` кестесі); **AsyncStorage mock** — **§39.1** |
| API base, құпиялар | `mobile/src/config/raqatApiBase.ts`, `app.config.js`, `PLATFORM_GPT_HANDOFF` §6 |
| 99 есім UI (басты промо + экран) | `DashboardScreen.tsx` (промо), `AsmaAlHusnaScreen.tsx`; таб ортасы жоқ |
| Баптаулар, логин, донат URL | `SettingsScreen.tsx`, `raqatDonationUrl.ts`, `app.json` extra |
| Офлайн Құран, UI defer | **§22.3**, `utils/uiDefer.ts` |
| Хатым кітап UI, Құран мұсаф, аудио скролл, last read, RNGH, компонент бөлу | **§26**, **§26.7**, **§26.8**, **§32** (сызықты мұсаф, джуз, шапка, ассеттер), `HatimScreen.tsx`, `MoreStack.tsx`, `QuranSurahScreen.tsx`, `QuranListScreen.tsx`, `SettingsScreen.tsx`, `DashboardScreen.tsx`, `mobile/src/storage/quranLastRead.ts`, `mobile/src/storage/quranReaderPrefs.ts`, `mobile/src/config/mushafConfig.ts`, `mobile/src/config/quranArabicFontPresets.ts`, `mobile/src/quran/mushafTypography.ts`, `mobile/src/quran/useMushafStyles.ts`, `mobile/src/quran/mushafAyahArabicLineHeight.ts`, `mobile/src/components/quran/MushafAyah.tsx`, `mobile/src/components/quran/AyahContextMenuSheet.tsx`, `mobile/src/components/quran/MushafAyahRow.tsx`, `mobile/src/components/KazakhOrnamentBand.tsx`, `App.tsx`, `expo-screen-orientation`, `react-native-gesture-handler` |
| Мұсаф бет нөмірі (Хафс 604), жергілікті PageList | **§30.2**, **§32.1** (prefs жоқ; тек `mushafDisplayPageFromGlobalAyahOneBased`), `quranMushafPageByGlobalAyah.ts`, `quranHafsPageFromGlobalAyah.ts`, `quranHafsPageStarts.generated.json`, `quranHizbBoundaries.ts` |
| Мұсаф келесі sprint (Polish, audio, FlashList интеграциясы) | **§29** (1- және 2-спринт deliverables), FlashList нұсқасы — **§30.3** |
| Өнім жол картасы (фазалар 1–3, MVP 2 апта, техника, образ) | **§24.0** (индекс), толық мәтін **§33**–**§38**; ядро мобильді жинақ — **§26**–**§32** + **§29**; **2026-05-13 — 2026-05-15** — **§39** (**§39.6–39.8**); **2026-05-16** — **§42** (Құрбан айт, құбыла иін, шапка, ислам KB); **2026-05-17 — 2026-05-19** — **§43** (KB-only AI, Halal клиент, products API, Hajj layout, APK); **2026-05-20 — 2026-05-24** — **§44** (Device QA, FlashList/hooks, prod hardening, Hatim sync); **2026-05-24 — 2026-05-25** — **§45** (шежіре P0/A1) |
| Құрбан айт нұсқаулығы, басты бет карточкасы, тақырыптар панелі | **§42.1** — `KurbanAitScreen`, `KurbanAitTopicsPanel`, `DashboardKurbanAitCard`, `kurbanAitGuideContent.ts` |
| Құбыла оюлы PNG иін, бұру геометриясы | **§42.2**, **§25.3** жаңарту — `qiblaArrowGeometry.ts`, `QiblaArrowPointer` `ornamentArrow` |
| Басты бет шапкасы (RAQAT оңға, баптаулар жиегі) | **§42.3** (§32.5 ескірген схема) |
| Мұсаф бет `#EFEFEF` | **§42.4** |
| Ислам KB RAG (`platform_api/islamic_kb`, API, мобильді sources) | **§42.5**, **§43.1–§43.2**, `docs/RAQAT_ISLAMIC_KNOWLEDGE_RAG.md` |
| Halal Damu прокси, products API бос, клиент түзетулері | **§43.3**, `docs/operations/halaldamu-products-api-empty-2026-05.md` |
| KB-only AI (`RAQAT_AI_KB_ONLY`), `RaqatKbStatusBar`, Islamic KB search | **§43.2** |
| Hajj Muftyat екі баған (KK сол / оқылуы оң) | **§43.4** |
| Release APK (~154 МБ), Halal bootstrap | **§43.7**; **§44.8** — ~**155 MB** `raqat-release-latest.apk`, Device QA preflight |
| Device QA чеклист (§1–§4), FlashList B2, hook split, VPS cron | **§44** |
| Hadith hub (KK excerpts + Sahih), CI KK skip policy | **§44.5**, **§44.7** |
| Dashboard inline header, күн форматы KK | **§44.3** |
| Prod `RAQAT_AI_ALLOW_ANONYMOUS=0`, cron smoke, Celery worker fix | **§44.1**, **§44.9** |
| Hatim sync API + Jest + manual QA | **§44.6**, **`docs/mobile/changelog/2026-05-24-device-qa.md`** |
| Шежіре (genealogy): API, mobile, bundled, A1 PG lock | **§45**; **`docs/handoff/genealogy-p0-handoff.md`**, **`docs/genealogy_a1_production_lock.md`**, QA **`docs/mobile/changelog/2026-05-25-genealogy-p0-qa.md`** |
| Android намаз home screen виджеттері, debug APK жолы | **§39.2**, **§39.1**, **§32.7** |
| «Дін мен дәстүр» экран құрылымы (кітаптар жоғарыда), Expo web JPEG/PNG ассет қатесі, AppState `inactive` | **§39.6**, **§39.7**, **§39.8** |
| `platform_api` сыртқа HTTPS (VPS, tunnel) | **`docs/VPS_PRODUCTION_PLATFORM_API.md`** (**§39.4**), **`docs/PRODUCTION_POSTURE.md`** |
| PostgreSQL cutover тәуекелі, SQLite шегі, async/Alembic/repository/RW абстракция | **§27.1**, **§40.1** |
| `QuranSurahScreen` техника қарызы, hook-декомпозиция (useQuranReader, т.б.) | **§40.2**, **§44.2** (3 hook орындалды), **§31** |
| AsyncStorage шоғырлануы, MMKV / Zustand persist / жергілікті SQLite | **§40.3** |
| **P0 / P1 / P2 басымдық матрицасы** (Backend, Mobile, Product) | **§41** |
| Mobile `src/` рефактор: features/quran, zustand, спринт тізбегі | **§31** (ұсыныс; кодта әлі міндетті түрде іске аспаған) |

### 24.7 Runbook және ops біріктірілген

| Сұрақ | Қайда |
|--------|--------|
| 5 track: PG + JWT + Redis + mobile + app.main | `docs/OPERATIONS_RUNBOOK_5_TRACKS.md` |
| Локальды тексеру | `docs/DEV_LOCAL_CHECKLIST.md` (**§6** genealogy seed/export — **§45**) |
| Python `pytest` (`tests/`) | **§11**, түбірде `pytest tests`; hadith KK — **§44.7** (6 skipped by default); genealogy — **§45.5** (`test_genealogy_*.py`) |
| VPS cron smoke, Device QA preflight | **§44.1**, **§44.8**, `scripts/mobile_device_qa_preflight.ps1` |
| GitHub Actions (PR smoke, контент smoke) | **§24.0.1**, `.github/workflows/refactor-smoke.yml`, `content-release-smoke.yml` |

### 24.8 Жинақты модельге қалай жіберу

1. Осы файлдың **§22–§24** + `PRODUCTION_POSTURE.md` (немесе толық `PLATFORM_GPT_HANDOFF.md`). **Жол картасын бір шолу:** **§24.0**.  
2. Нақты тапсырма: мысалы «PG cutover», «хадис батч B-01», «мобильді донат URL» — **§24.1–24.7** кестесінен жол таңдау; **басымдық тәртібі** — **§41**; **өнім жолы (барлық фазалар)** — алдымен **§24.0**, содан **§33**–**§38**; **бәсекелес UX идеялары** — **§1.0**; **мұсаф sprint** — **§29**; **Хафс 604 JSON / PageList** — **§30.2**; **мұсаф UI + хатым джуз + басты бет (соңғы)** — **§32**; **Jest / виджет / VPS API құжаты / Halal / дәстүр экраны / web asset / AppState** — **§39** (тіпті мәлімет **§39.6–39.8**); **Құрбан айт / құбыла иін / шапка / ислам KB** — **§42**; **KB-only AI / Halal клиент / products API / Hajj / APK (2026-05-19)** — **§43**; **Device QA / FlashList / hooks / prod hardening / Hatim sync (2026-05-24)** — **§44**; **шежіре P0/A1 (2026-05-25)** — **§45**; **PG алдындағы платформа қабаты + QuranSurahScreen hook-тар + AsyncStorage траекториясы** — **§40**; **mobile/src Feature-Sliced көшіру** — **§31**.  
3. Терең мәтін қажет болса: кестедегі файлды толық оқу.  
4. **Жергілікті / Windows / CI:** **§24.0.1**.  
5. **Өнім принципі (адамға жеңіл · оңай · керек):** **§1**, **§38**.  
6. **Соңғы мобильді + platform:** **§42** (2026-05-16) · **§43** (2026-05-17 — 19) · **§44** (2026-05-20 — 24: Device QA, FlashList, hooks, VPS cron, Hatim sync) · **§45** (2026-05-24 — 25: шежіре P0/A1, API, mobile bundled).

---
