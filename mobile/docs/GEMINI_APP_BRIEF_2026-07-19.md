# RAHAT OMIR / RAQAT — Gemini-ге арналған толық қолданба брифі

**Мақсат:** осы құжатты Gemini-ге беріп, қолданбаны толық түсінуі және соңғы өзгерістерді ескеруі үшін.  
**Күні:** 2026-07-19  
**Платформа:** Android (негізгі QA құрылғы: Samsung SM-G965F)  
**Пакет:** `kz.raqat.app`  
**Нұсқа:** **1.1.1** (versionCode **11**)  
**Бренд / UI атауы:** RAHAT OMIR  
**Deep link:** `raqat://` (legacy: `imamai://`)  
**Репо:** `raqat-ai` · mobile → `mobile/` · branch контекст: `checkpoint/mobile-release-prep-2026-07-05`  
**Стек:** Expo / React Native · native Android (Kotlin) виджеттер, азан, құбыла

---

## 1. Өнімнің мәні (бір сөйлем)

Қазақстан мұсылмандарына арналған **офлайн-бірінші** исламдық компаньон: намаз уақыты + азан, Құран/хатым, тәжуид, намаз жетектеуі, хадис, дұға, зікір, құбыла, ҚМДБ/халал және қазақ дәстүрі — **AI чат жоқ** (алынып тасталған).

---

## 2. Негізгі модульдер (экраны бойынша)

### Басты бет (Dashboard)
- Үлкен намаз карточкасы: келесі намаз, кері санақ, 6 уақыт (таң…құптан + күн), қала, ауа, хижри.
- **12 тайл:** Құран, Хадис, Намаз, Тәжуид, Сира, Қажылық, Зікірлер, Дұғалар, Алланың 99 есімі, ҚМДБ, Халал, Дін мен дәстүр.
- Тіл: қолданба тілі (`kk` әдепкі; ru/en/ky/uz/tr/ar).

### Намаз уақыты / азан
- Кесте: Muftyat (ҚР) басым, fallback Aladhan.
- **Азан жеткізу (Android):** толық экран азан беті + дыбыс; **tray/FSI хабарлама жоқ** (тек бет ашылады).
- Native alarm: `PRAYER_AZAN_FULLSCREEN`.
- Азан мәтіні: араб + транскрипция + қазақша мағына.

### Бастапқы экран виджеті (Android only — бастапқы беттен бөлек)
**Төбе:** сол — келесі намаз · орта — қалған уақыт · оң — мекенжай, содан ауа райы.  
**Асты:** 5 парыз (иконкасыз): Таң / Бесін / Екінті / Ақшам / Құптан + уақыт.  
**Тіл:** қолданба тілінен `labels` payload (`kk.prayer.*Short`, `kk.dashboard.nextPrayer`) — жүйе тіліне тәуелді емес.  
**Үлкен жазу (соңғы QA):** атау ~15sp, уақыт ~16sp; төбе: келесі ~13/17sp, қала ~14sp, ауа ~15sp, санақ ~20sp.

### Намаз жетек / сәжде компаньоны
- Жол: Намаз → Оқу картасы → **5 уақыт намаз** → **Сәжде жетектеуі**.
- 5 намаз үшін қадамдық сессия (тәкбір → қиям → рукуғ → сәжде → сәлем).
- Бөлек экран/роут жоқ — гайд ішінде ендірілген.

### Құран / хатым
- Сүре/джуз тізімі, іздеу, соңғы оқу, хатым прогресі.
- Мұсхаф (QCF4 / офлайн seed), тәжуид түстері (Al Quran Cloud тегтері + хатым офлайн).
- Аударма дауысы / қари CDN; KK мағына APK ішінде.

### Тәжуид
- Әліпби торы (28 әріп, жуан/жіңішке).
- **Әріп аудиосы:** [arabic-online.ru алфавит](https://arabic-online.ru/arabskie-bukvy/arabskiy-alfavit) — `harfNameSound` (тек әріп атауы, мысал сөзсіз).
- 65 беттік Muftyat оқулығы (тараулар).

### Басқа
- Хадис: ~98 KK-trusted сахих (машиналық аударма жоқ).
- Дұға / зікір / 99 есім.
- Құбыла: компас + камера режимі.
- ҚМДБ хаб: Muftyat / Fatua / мешіттер (WebView).
- Халал, дәстүр, қажы, сира, сақталғандар, баптаулар (тіл, тема, аккаунт Google/Apple).

---

## 3. Навигация / deep link (қысқа)

Префикс: `raqat://`

| Path | Экран |
|------|--------|
| `` | Home |
| `prayer` | Намаз уақыты |
| `azan?...` | Азан толық экран |
| `qibla` | Құбыла |
| `more/quran` | Құран |
| `more/hatim` | Хатым |
| `more/tajweed` | Тәжуид |
| `more/namaz-guide` | Намаз гайд (+ компаньон ішінде) |
| `more/hadith` | Хадис |
| `duas` / `tasbih` | Дұға / зікір |
| `asma` | 99 есім |
| `more/kmdb` / `more/halal` / `more/tradition` / `more/hajj` | тиісті хабтар |
| `profile` / login | deep link **блокталған** (тек UI) |

Төменгі tab bar жоқ — native stack.

---

## 4. Соңғы өзгерістер (2026-07 сессия — Gemini үшін ең маңызды)

### Азан
- Android-та Expo prayer notification слоттары native alarm-нан кейін жоспарланбайды.
- `deliverAzan`: FSI/tray notify жоқ — activity + дыбыс + retry.
- Legacy cleaner: 904224 FSI енді **сақталмайды**, әрқашан тазаланады.

### Safe area / chrome
- App frame: status clock пен system back арасындағы padding қайтарылды.
- Көрінетін ← көп жерде алынып, hardware back қалды.
- Намаз модалдары: modal safe-area bottom.

### Сәжде компаньоны
- Контент + UI: `namazCompanionSession` / `NamazCompanionPanel`.
- **5 уақыт намаз** ішінде; бөлек экран/роут/CTA алынып тасталды.

### Тәжуид әріп дыбысы
- Edge-TTS орнына **arabic-online.ru** `harfNameSound` MP3 (28 әріп).
- TTS fallback: тек классикалық атау (بَاء), мысал «بَا» жоқ.
- Скрипт: `mobile/scripts/generate-tajweed-letter-audio.py`.

### Android намаз виджеті (тек виджет — бастапқы бетке тиіспеу)
1. Төбе реті: келесі намаз | санақ | қала → ауа.
2. Намаз жолында emoji иконкалар алынды.
3. Жазулар үлкейтілді (атау/уақыт + төбе мета).
4. Лейблдер қолданба тілінен JSON `labels` + `locale`.
5. Тіл ауысқанда виджет `syncNativePrayerWidgetFromStorage` арқылы жаңарады.

### Басқа релиз контекст
- AI чат толық алынып, dashboard `ai` → **ҚМДБ**.
- SMS кіру UI өшірілген; Google/Apple.
- Offline i18n slim pack APK ішінде.
- Құран KK / тәжуид / хадис seed бандлдалған.

---

## 5. Техникалық карта (файлдар)

| Тақырып | Жол |
|---------|-----|
| Азан delivery | `mobile/android/.../PrayerAzanDelivery.kt` |
| Notif cleaner | `PrayerLegacyNotificationCleaner.kt` |
| Виджет UI | `res/layout/widget_prayer_home_*.xml`, `widget_prayer_grid_5_strip.xml` |
| Виджет bind | `PrayerWidgetViews.kt`, `PrayerWidgetPayload.kt` |
| Виджет payload JS | `mobile/src/storage/prayerCache.ts` |
| Компаньон | `namazCompanionSession.ts`, `NamazCompanionPanel.tsx`, `ContentGuideScreens.tsx` |
| Тәжуид әріп | `tajweedAlphabet.ts`, `tajweedMuftyatSpeech.ts`, `assets/tajweed/letters/` |
| Linking | `mobile/src/navigation/linking.ts` |
| i18n | `mobile/src/i18n/kk.ts` + `runtime.ts` |

---

## 6. QA күйі (2026-07-19 құрылғы)

- **Өтті:** home, prayer, azan UI, qibla, quran, hatim, tajweed, namaz+компаньон picker, hadith, duas, tasbih, asma, kmdb, halal, tradition, hajj, seerah, settings — deep-link smoke, FATAL жоқ.
- **Назар:** хижри күн қолданба vs muftyat.kz бір күн айырмауы мүмкін; виджет өлшемін өзгерткенде кейде өшіріп қайта қосу керек.
- Скриншоттар: `mobile/qa-device-shots/full-smoke-2026-07-19/run3/`.

---

## 7. Шектеулер / сыртқы gate

- CDN (`rahatomir.com`) кейде 521 — slim APK fallback бар.
- Scholar sign-off намаз контентінде әлі `approvedForPublicRelease: false` болуы мүмкін.
- Play Internal upload — қолмен.
- Аккаунт sync желіге тәуелді.
- Виджет — тек Android home screen.

---

## 8. Gemini-ге нұсқау (қалай қолдану)

Сен **RAHAT OMIR / RAQAT** мобильді қолданбасының өнім/инженерлік көмекшісісің. Жоғарыдағы бриф — source of truth. Жауап бергенде:

1. **Бастапқы бет** пен **Android виджетті** араластырма — виджет өзгерістері home UI-ға тиіспеуі керек.
2. Азан = **хабарламасыз**, тек толық экран бет.
3. Тәжуид әріп дыбысы = **arabic-online.ru** атаулары, мысал сөз емес.
4. Компаньон = **5 уақыт намаз** ішінде.
5. Тіл = қолданба locale (виджет labels қоса).
6. Қазақша пайдаланушыға қысқа әрі нақты жауап бер; код ұсынсаң — нақты жолдарды көрсет.

---

## 9. Қысқа changelog (пайдаланушы тілі)

- Азан енді тек бет ретінде ашылады, хабарламасыз.
- Намаз жетектеуі «5 уақыт намаз» ішінде.
- Тәжуид әріптері arabic-online.ru дыбысымен.
- Үй экраны виджеті: келесі намаз · уақыт · қала · ауа; үлкен жазу; қолданба тілі.
- AI чат жоқ; ҚМДБ хаб бар.
