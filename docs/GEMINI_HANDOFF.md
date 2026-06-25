# RAQAT / RAHAT OMIR — Gemini handoff

**Күйі:** 2026-06-23  
**Мақсаты:** Google Gemini (немесе басқа сыртқы LLM) агентіне жобаны **жалғастыру**, **бағалау** немесе **release** үшін берілетін қысқа, нақты handoff.  
**Құпиялық:** `.env`, API key, keystore, пароль, SSH private key **жоқ**. Тек public URL, архитектура, файл жолдары, командалар.

**Production URL (ашық):**
- Веб: `https://rahatomir.com`
- API: `https://api.rahatomir.com`
- Halal Damu: `https://halaldamu.kz`
- ҚМДБ: `https://muftyat.kz`, `https://fatua.kz`

**Толық бағалау пакеті (терең контекст):** `docs/GEMINI_PLATFORM_EVALUATION_FULL.md`  
**5 қадамды soft launch:** `docs/operations/RELEASE_5_STEP_STRATEGY.md`  
**Feature freeze:** `docs/operations/FEATURE_FREEZE.md`  
**Delta (18 маусым):** `docs/GEMINI_DELTA_2026-06-18.md`  
**GPT handoff (архитектура):** `docs/PLATFORM_GPT_HANDOFF.md`  
**Quran/Hatim терең:** `docs/QURAN_GPT_HANDOFF.md`

---

## 0. Gemini-ге тапсырма (қысқа)

1. Осы handoff + `GEMINI_PLATFORM_EVALUATION_FULL.md` §0 форматында платформаны бағала **немесе**
2. Төмендегі **ашық блокерлерді** жабу жоспарын ұсын (P0/P1)
3. Код өзгерткенде: **min scope**, `fead868` baseline конвенцияларын сақта, commit тек сұралғанда

Жауап форматы (бағалау): Executive summary → Strengths → Weaknesses → Risks → P0/P1/P2 → Release verdict (Go / No-Go / Go with conditions).

---

## 1. Ағымдағы snapshot (2026-06-23)

| Тармақ | Мән |
|--------|-----|
| **Git HEAD** | `fead868` — *Stop tracking local QA/tmp build artifacts in git.* (2026-06-18) |
| **`origin/main`** | `fead868` — синхрон |
| **Working tree** | таза |
| **Mobile нұсқа** | `1.1.0` (versionCode **10**) |
| **Jest** | **152 suites / 650 tests** — PASS (`npm test -- --ci`) |
| **Соңғы release APK** | `mobile/apk-download/raqat-release-latest.apk` (~119 MB) |
| **APK SHA256** | `3c3546f68057499334af9192dd236bee0dd69d5ed8572e7739e38311de3961e8` |
| **Web export (жергілікті)** | `mobile/dist/` — build ID `1782229941652` (deploy күтуде) |
| **Web deploy архив** | `mobile/dist-webdeploy.tar.gz` (~154 MB) |

### Не қайтарылды (жоқ күйде)

Пайдаланушы **20 маусым baseline** сұрады; git-те 20 маусымда commit жоқ — **`fead868` (18 маусым)** қалдырылды. **21 маусым** жұмысы толық жойылды:

- `hatimMushafLayoutPolicy.ts`, `useMushafBookAyahFocus.ts`
- Hatim ayah auto-focus, QCF4 edge clipping fixes
- QCF V4 COLR tajweed модулялары (`qcf4ColrFontLoader`, `qcf4ColrTheme`, …)
- Qibla compass fix (`51299ee` branch)
- Halal WebView cache, KMDB tab order, in-app «Артқа» жою, hatim font 1.07 — **барлығы жоқ**

### Ашық блокерлер (қазір)

| Блокер | Себебі | Келесі қадам |
|--------|--------|--------------|
| **Web deploy** | `ssh root@5.75.162.140:22` — Connection timed out (жергілікті желі) | SSH/firewall ашылғанда: `powershell -File scripts/vps_deploy_web.ps1 -SkipBuild` |
| **Locked-screen azan QA** | Samsung OEM + нақты намаз уақыты | `docs/mobile/changelog/2026-06-18-azan-locked-screen-qa.md` |
| **Scholar sign-off** | Діни мәтін reviewer gate ашық | `docs/operations/religious-content-review-packet-2026-06.md` |
| **Sajda-level tajweed** | QCF COLR интеграциясы baseline-та жоқ | API tag түстері ғана (сөз деңгейі) |

---

## 2. Технология стегі

| Қабат | Стек | Күй |
|-------|------|-----|
| Mobile | Expo SDK 54, RN 0.81.5, React 19 | Android release APK жиналады |
| Android native | Kotlin: azan alarm, widget, qibla | `mobile/android/app/src/main/java/kz/raqat/app/` |
| Web | Expo export → nginx `/var/www/raqat-web/dist` | Export OK; VPS sync күтуде |
| API | FastAPI, Celery, Redis, PostgreSQL | `api.rahatomir.com` |
| Bot | aiogram + Gemini (KB/RAG) | VPS |
| Offline | `mobile/assets/bundled/*.json` | Quran, hadith, duas, halal seed |

---

## 3. Бірінші оқылатын файлдар

| Рет | Файл | Неге |
|-----|------|------|
| 1 | `docs/GEMINI_HANDOFF.md` | Осы файл (ағымдағы күй) |
| 2 | `docs/GEMINI_PLATFORM_EVALUATION_FULL.md` | Толық бағалау + minuses калибрлеу |
| 3 | `docs/PLATFORM_GPT_HANDOFF.md` | Экрандар, native, API клиенттер |
| 4 | `docs/QURAN_GPT_HANDOFF.md` | Mushaf/QCF4/Hatim rendering |
| 5 | `docs/RELEASE_1MIN_CHECKLIST.md` | Release алдындағы 1 мин checklist |
| 6 | `docs/operations/web-app-deploy.md` | rahatomir.com deploy |
| 7 | `mobile/package.json` | Scripts (`build:apk`, `export:web`, test) |

---

## 4. Негізгі модульдер (қысқа)

### Dashboard
`mobile/src/screens/DashboardScreen.tsx` — намаз hero, 12 тайл (Quran, Hadith, Namaz, Tajweed, …), halal rotator, continue reading.

### Намаз / азан
- TS: `prayerTimes.ts`, `prayerNotifications.ts`, `prayerAzanPermissions.ts`, `PrayerAzanScreen.tsx`
- Kotlin: `PrayerAzanAlarmScheduler.kt`, `PrayerAzanAlarmReceiver.kt`, `PrayerWidgetModule.kt`
- P0: exact alarm, full-screen intent, OEM battery, locked-screen behavior

### Quran / Hatim
- `QuranListScreen`, `QuranSurahScreen`, `QuranMushafBookScreen`, `HatimScreen`
- QCF4: `MushafBookPageQcf4.tsx`, `loadQcf4Page.ts`, `mushafQcf4Layout.ts`
- Тәжуид: Al Quran Cloud `quran-tajweed` API + `alquranTajweedParse.ts` (COLR glyph жоқ baseline-та)

### Halal / ҚМДБ
- `HalalScreen.tsx`, `OfficialSiteFullWebView.tsx`, `KmdbHubScreen.tsx`
- Halal Damu proxy + bundled seed `halal-products-seed-kz.json`

### AI
- `RaqatAIChatScreen.tsx`, KB-only policy (`RAQAT_AI_KB_ONLY`), `platform_api/` RAG

---

## 5. Командалар (copy-paste)

```powershell
# Jest
cd mobile && npm test -- --ci

# Release APK
cd mobile && npm run build:apk
# Artifact: mobile/apk-download/raqat-release-latest.apk

# Web export + deploy (SSH керек)
powershell -ExecutionPolicy Bypass -File scripts/vps_deploy_web.ps1
# Тек жүктеу (dist дайын болса):
powershell -ExecutionPolicy Bypass -File scripts/vps_deploy_web.ps1 -SkipBuild

# Web health (deploy кейін)
powershell -ExecutionPolicy Bypass -File scripts/web-release-health.ps1

# Play AAB
cd mobile && npm run build:aab && npm run release:play:check
```

```bash
# API smoke (prod)
python scripts/smoke_platform_api.py --api-base https://api.rahatomir.com --auth-login
```

**Windows Gradle:** кириллица user path болса `GRADLE_USER_HOME=D:\gradle-home` (қараңыз `mobile/package.json` build scripts).

---

## 6. Deploy ағыны (web)

1. `cd mobile` → `npx expo export --platform web --output-dir dist` (+ `patch-web-boot-html.js`, bundled/quran asset copy)
2. `tar` → VPS `/var/www/raqat-web/dist`
3. `scripts/web-dist-postdeploy.sh` — prune + gzip
4. `nginx -t && systemctl reload nginx`
5. `scripts/web-release-health.ps1` — stale JS chunk тексеру

VPS: `5.75.162.140`, user `root`, web root `/var/www/raqat-web/dist`. Credentials — `.env.deploy` (git-те жоқ).

---

## 7. Release gate (қысқа)

| Gate | Күй |
|------|-----|
| Git clean / pushed | ✅ `fead868` = origin |
| Jest | ✅ 650 tests |
| APK build | ✅ (жергілікті artifact бар) |
| Web deploy prod | ❌ SSH timeout |
| Play Internal upload | AAB бар болса — Console қолмен |
| Scholar religious review | ❌ ашық |
| Device azan locked QA | ❌ ашық |
| Data Safety / Privacy | Play Console — толтыру керек |

Толық: `docs/RELEASE_1MIN_CHECKLIST.md`

---

## 8. Gemini-ге нақты сұрақтар (2026-06-23)

1. **`fead868` baseline** Play Internal Testing-ке шығуға дайын ба, әлде P0 (azan QA, scholar, deploy) кідірту керек пе?
2. **SSH/VPS deploy** сырттан қолжетімсіз — firewall альтернативасы (CI, Cloudflare, басқа порт) ұсын.
3. **Tajweed:** Sajda parity үшін QCF COLR қайта енгізу vs API-only — release risk салыстыру.
4. **APK ~119 MB** — asset pruning приоритеті (қандай каталогтар алдымен)?
5. **Қазақстан нарығы:** Muslim Pro / Sajda / Quran.com-мен дифференциация — 3 нақты USP.

---

## 9. Соңғы сессия хронологиясы (контекст)

| Күн | Оқиға |
|-----|-------|
| 2026-06-21 | Hatim layout + auto-focus commits (`930c025`, `9ee2f8f`) — кейін жойылды |
| 2026-06-23 | `git reset --hard fead868` + `git clean -fd` (20 маусым baseline сұрауы) |
| 2026-06-23 | Release APK жиналды (SHA256 жоғарыда) |
| 2026-06-23 | Web export OK; VPS deploy SSH timeout |

---

## 10. Құжат жаңарту ережесі

- Бұл файлды **release**, **reset**, **deploy** немесе **major feature** кейін жаңартыңыз.
- Толық бағалау мәтіні — `GEMINI_PLATFORM_EVALUATION_FULL.md` (күнін §1 verification-мен синхрондаңыз).
- Delta өзгерістер — `docs/GEMINI_DELTA_YYYY-MM-DD.md` қосымша файлы (қажет болса).
