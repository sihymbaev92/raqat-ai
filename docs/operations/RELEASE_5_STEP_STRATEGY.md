# RAQAT — 5 қадамды soft launch стратегиясы

**Күні:** 2026-06-23  
**Нұсқа:** mobile `1.1.0` (versionCode 10)  
**Статус:** Feature freeze белсенді — `docs/operations/FEATURE_FREEZE.md`

Бұл құжат — өнім + техникалық орындау жоспары. Gemini / GPT / команда handoff: `docs/GEMINI_HANDOFF.md`.

---

## 1-ҚАДАМ: Feature Freeze

**Мақсат:** жаңа модуль қоспай, тек P0 тұрақтылық пен қауіпсіздік.

| Тапсырма | Күй | Иесi |
|----------|-----|------|
| Feature freeze саясаты құжатта | ✅ | `FEATURE_FREEZE.md` |
| Dashboard 12 тайл — өзгертпеу | 🔒 | Product |
| Жаңа PR-лар freeze scope review | ⏳ | Tech lead |

---

## 2-ҚАДАМ: Azan Guarantee («Темірдей» азан)

**Мақсат:** Таң намазына уақытында 100% ояту (OEM battery + exact alarm + FSI).

### Код (енгізілді)

| Компонент | Файл |
|-----------|------|
| Батарея гиді (Samsung/Xiaomi) | `SettingsPrayerNotificationsSection.tsx` |
| Жүйе экранын ашу | `PrayerWidgetModule.openBatteryOptimizationSettings` |
| TS wrapper | `prayerNotifications.openAndroidBatteryOptimizationSettings` |
| Exact alarm + FSI | `prayerAzanPermissions.ts`, `PrayerAzanAlarmScheduler.kt` |
| Locked-screen QA 90с | Баптаулар → намаз хабарламалары |

### Қолмен QA (міндетті)

`docs/operations/AZAN_3DAY_DEVICE_QA.md` — **3 күн**, **кемінде 3 әртүрлі Android** (Samsung, Xiaomi, +1), экран **құлыптаулы**, нақты немесе QA alarm.

| Күн | Тексеру | Жазба |
|-----|---------|-------|
| 1 | Device A — Fajr QA + battery exempt | `docs/mobile/changelog/` |
| 2 | Device B — Fajr QA | |
| 3 | Device C — Fajr QA + reboot test | |

**PASS шарты:** азан экраны + дыбыс, 3/3 күн, 3/3 құрылғы.

---

## 3-ҚАДАМ: Scholar & Legal Cover

**Мақсат:** заңдық/діни тәуекелді азайту.

### Scholar

| Тапсырма | Күй | Құжат |
|----------|-----|-------|
| Нұр-Мүбарак / ҚМДБ кеңесші тарту | ⏳ | `religious-content-review-packet-2026-06.md` |
| `namazContent.ts` review | ⏳ | сол пакет §Files |
| Ханафи жазбаша/аудио мақұлдау | ⏳ | `docs/operations/` архивке PDF/скан |

### AI disclaimer (енгізілді)

| UI | Мәтін |
|----|-------|
| AI чат — ірі footer | «Бұл AI көмекші — фетва бермейді… Fatua.kz» |
| Файл | `RaqatAIChatScreen.tsx`, `kk.ts` → `heroDisclaimer` |

### Басқа legal

- Play Data Safety / Privacy form — толтыру
- Hadith source-only саясаты — сақтау (`HADITH_DATA_PROVENANCE.md`)

---

## 4-ҚАДАМ: Soft Launch (Play Internal Testing)

**Мақсат:** бүкіл KZ жарнамасыз, **~100 белсенді** пайдаланушы.

| Тапсырма | Күй | Команда |
|----------|-----|---------|
| AAB жинау | `npm run build:aab` | Mobile |
| `release:play:check` | ⏳ | Mobile |
| Play Console → **Internal testing** | ⏳ | Owner |
| Сілтеме тек таныстар / 100 адам | ⏳ | Community |
| **Жарнама / featuring жоқ** | 🔒 | Product |

### Аналитика (backend)

| Тапсырма | Күй |
|----------|-----|
| VPS `.env` → `RAQAT_USAGE_STATS_SECRET` | ⏳ |
| `python scripts/print_pg_usage_stats.py` | ⏳ күнде |
| Retention / crash | Play Console + `/api/v1/monitoring/usage` |

`.env.example` § `RAQAT_USAGE_STATS_SECRET` — құпия тек VPS.

---

## 5-ҚАДАМ: Asset Pruning (диета)

**Мақсат:** APK **119 MB → ≤ 70 MB** (soft launch кейін де жалғасады).

### Ағымдағы топ asset (`print-asset-size-report.cjs`)

| Өлшем | Файл | Әрекет |
|-------|------|--------|
| 36 MB | `offline-auto-translations-core.json` | Network/cache; bundle shrink |
| 18 MB | `quran-translations-offline.json` | Lazy locale load |
| ~4 MB × N | `prayer_azan_user_*.mp3` | 1 default + CDN optional |
| ~2 MB × 50+ | `assets/quran/qcf4/fonts/*.ttf` | **CDN-only**, page font dynamic load |
| 2.3 MB | `azan-background-generated.png` | WebP compress |

### Техникалық бағыт

1. QCF4 TTF — APK-дан шығару; `qcf4FontLoader` CDN + disk cache (хатым ашылғанда жүктеу)
2. Tajweed/COLR — тек қажет кезде (freeze кезінде plan-only)
3. Hajj hero PNG → WebP
4. Release build asset audit: `node mobile/scripts/print-asset-size-report.cjs`

**Freeze кезінде:** pruning — тек өлшем, функцияны бұзбай.

---

## Release verdict (ағымдағы)

| Критерий | Күй |
|----------|-----|
| Feature freeze | ✅ құжат |
| Azan battery guide | ✅ код |
| AI hero disclaimer | ✅ код |
| 3-day azan QA | ❌ күтуде |
| Scholar sign-off | ❌ күтуде |
| Internal Testing live | ❌ күтуде |
| APK ≤ 70 MB | ❌ ~119 MB |
| Web deploy prod | ❌ SSH blocker |

**Шешім:** **Go with conditions** — Internal Testing-ке тек P0 (azan QA + scholar + stats) жабылғаннан кейін.

---

## Байланысты командалар

```powershell
# APK
cd mobile && npm run build:apk

# Play AAB
cd mobile && npm run build:aab && npm run release:play:check

# Asset audit
cd mobile && node scripts/print-asset-size-report.cjs

# Usage stats (VPS, secret қажет)
python scripts/print_pg_usage_stats.py

# Web deploy
powershell -File scripts/vps_deploy_web.ps1 -SkipBuild
```
