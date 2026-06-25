# Azan 3-Day Device QA — locked screen

**Күйі:** міндетті P0 (soft launch алдында)  
**Байланыс:** `RELEASE_5_STEP_STRATEGY.md` §2

## Мақсаты

Таң (Fajr) немесе QA alarm кезінде **экран құлыптаулы** тұрғанда азан экраны + дыбыс **3 күн қатарынан** жұмыс істеуін растау.

## Құрылғылар (минимум)

| # | OEM | Модель | Android | Serial |
|---|-----|--------|---------|--------|
| A | Samsung | | | |
| B | Xiaomi / Redmi / POCO | | | |
| C | Басқа (Huawei, Honor, …) | | | |

## Әр құрылғыда бір рет (setup)

1. Fresh install немесе соңғы release APK
2. Намаз хабарламалары **ON**
3. Exact alarm + Full-screen intent рұқсаттары
4. **Батареяны үнемдеуден босату** (Баптаулар → намаз → «Батареяны үнемдеуден босату»)
5. Samsung: Unrestricted battery; Xiaomi: No restrictions + Autostart
6. `Locked-screen QA (90 сек)` — PASS жазбасы

## 3 күн кесте

Әр күн **бір құрылғыда** нақты Fajr **немесе** кешкі QA alarm (office test):

| Күн | Құрылғы | Уақыт | Экран | Дыбыс | Azan UI | Жазба |
|-----|---------|-------|-------|-------|---------|-------|
| 1 | A | | locked | ✓/✗ | ✓/✗ | |
| 2 | B | | locked | ✓/✗ | ✓/✗ | |
| 3 | C | | locked | ✓/✗ | ✓/✗ | |

**PASS:** барлық ұяшықта ✓; бір ✗ болса — OEM log + fix, кестені қайта бастау.

## Жазба форматы

Нәтижені сақтау: `docs/mobile/changelog/YYYY-MM-DD-azan-3day-qa.md`

```markdown
## Device A — Samsung SM-…
- Battery exempt: yes
- Day 1 Fajr: PASS — screen on, native audio, full-screen UI
- Logs: (adb logcat snippet if fail)
```

## ADB көмек

```powershell
# Барлық телефондарды бірден тексеру (+ опция: APK орнату)
powershell -ExecutionPolicy Bypass -File scripts/verify_phones.ps1
powershell -ExecutionPolicy Bypass -File scripts/verify_phones.ps1 -InstallApk

# Нәтиже: docs/mobile/changelog/phone-verification-YYYY-MM-DD.json

adb devices
adb -s SERIAL install -r mobile/apk-download/raqat-release-latest.apk
adb logcat -s PrayerAzanAlarmReceiver PrayerAzanAlarmScheduler
```
