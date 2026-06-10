# Widget boot regression — freeze §3.4

**Package:** `kz.raqat.app`  
**Code:** `PrayerWidgetBootReceiver.kt` → `updateAllWidgets` + `PrayerWidgetAlarmScheduler.scheduleNext`

---

## Автомат (adb)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/widget_boot_regression_adb.ps1
```

Телефон: USB debugging + **Allow** this PC.

---

## Manual (release APK)

| # | Сценарий | Нәтиже | Ескертпе |
|---|----------|--------|----------|
| 1 | Home screen-ке **Prayer times** widget қосу | MANUAL | strip / full / next |
| 2 | App ашу → namaz уақыты widget-ка sync | MANUAL | |
| 3 | **Reboot** телефон | MANUAL | |
| 4 | Reboot кейін widget уақыттары жаңарған | MANUAL | BOOT_COMPLETED |
| 5 | Countdown / next prayer tick (1–2 мин) | MANUAL | AlarmScheduler |
| 6 | Qibla strip widget (opt.) | MANUAL | `QiblaWidgetSensorService` |

**adb (2026-05-24, R58R54KA0FE):** reboot орындалды; post-boot adb **SKIP** (USB reconnect керек). Алдымен: `widget_boot_regression_adb.ps1`

**§Widget қорытынды:** home widget pin + reboot verify — **MANUAL** (1–6)

---

## Fail

| ID | Сипаттама |
|----|-----------|
| | |

[← feature-freeze-2026-06.md](../../roadmap/feature-freeze-2026-06.md)
