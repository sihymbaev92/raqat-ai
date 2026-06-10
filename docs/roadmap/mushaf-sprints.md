# Mushaf / Hatim — sprint жоспары

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

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
