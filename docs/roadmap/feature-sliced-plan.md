# Mobile Feature-Sliced (жоспар)

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

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
