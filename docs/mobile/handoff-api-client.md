# Мобильді — API клиент (тарихи §6)

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

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

### 6.3 Баптаулар

- **`SettingsScreen`:** платформа URL, **`/health` + `/ready` + stats** бір мезгілде тексеріледі; дерекқор дайын болса «SQLite / PostgreSQL (ready)»; DB қатесінде `/ready` хабарламасы.  
- **Офлайн/метадерек:** `contentSync.ts` — AsyncStorage **etag** + **`since_normalized_sqlite`**, `runContentMetadataSync` (`If-None-Match` + `since`).

### 6.4 Сілтемелер

- Бот: `TelegramInfoScreen.tsx` (`t.me/...`).  
- Толығырақ: `mobile/README.md`.

---
