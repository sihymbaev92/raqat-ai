# Azan locked-screen device QA (2026-06-18)

**Device:** Samsung SM-A515F (API 33), serial `RZ8R10K8ZJV`

## Automated script

```powershell
cd mobile
npm run build:apk:debug
npm run qa:azan:locked                    # schedule 90s + lock + screenshot
npm run qa:azan:locked -- -ImmediateBroadcast   # instant receiver test
```

## Settings (in-app)

Баптаулар → Намаз хабарламалары:
- **Full-screen intent баптауын ашу** (Android 14+)
- **Locked-screen QA (90 сек)** — test alarm жоспарлайды

## Manual checklist

1. Exact alarm: `SCHEDULE_EXACT_ALARM: allow` (adb appops)
2. Full-screen intent: Android 14+ жүйе баптауынан қосу
3. Battery: unrestricted / whitelist
4. Экран құлыптау → 90 сек күту
5. Күтілетін: азan дыбысы + full-screen `PrayerAzanScreen` + «Азанды тоқтату»

## 2026-06-18 immediate broadcast test

| Step | Result |
|------|--------|
| `adb broadcast` → `PrayerAzanAlarmReceiver` | OK (`Broadcast completed`) |
| Log `PrayerAzanNativePlayer: Started native azan audio` | OK |
| Log `PrayerAzanAlarm: Started azan activity` | OK |
| Screenshot on lock screen | **Azan UI көрінбеді** — тек lock screen (FSI / show-when-locked тексеру керек) |

## Next

- [ ] Grant full-screen intent (Samsung Settings → Apps → RAQAT)
- [ ] Re-run `npm run qa:azan:locked` (90s scheduled AlarmManager path)
- [ ] Real prayer time confirmation
