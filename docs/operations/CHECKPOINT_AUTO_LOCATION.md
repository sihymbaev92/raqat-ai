# Checkpoint — автоматты орын (GPS / Wi‑Fi / интернет)

**Күні:** 2026-06-17  
**Git tag:** `checkpoint/auto-location-v1`  
**Мақсат:** Қала, намаз кестесі, ауа райы және құбыла бір `devicePrayerLocation` сервисіне байланған. Бір нәрсе бұзылса, осы нүктеге оралу.

## Не сақталған

| Файл | Рөлі |
|------|------|
| `mobile/src/services/devicePrayerLocation.ts` | GPS/Wi‑Fi координат, `resolvePrayerScheduleLocation()` |
| `mobile/src/services/__tests__/devicePrayerLocation.test.ts` | Регрессия тесті |
| `mobile/src/constants/kzCities.ts` | `findNearestKzCityPreset`, `isInKazakhstanBBox` |
| `mobile/src/storage/prefs.ts` | `prayerLocationAuto` (әдепкі: қосулы) |
| `mobile/src/screens/DashboardScreen.tsx` | Басты бет: қала + ауа райы координаты |
| `mobile/src/screens/PrayerTimesScreen.tsx` | Намаз экраны |
| `mobile/src/components/settings/SettingsPrayerLocationSection.tsx` | «Автоматты орын» ауыстырғышы |
| `mobile/src/context/QiblaSensorContext.tsx` | Құбыла: auto ON → `readDeviceCoords()` |
| `mobile/src/i18n/kk.ts` | KK мәтін |

## Тест (жылдам тексеру)

```powershell
cd mobile
npm run test:auto-location
```

## Осы checkpoint-ке оралу

### Барлық файлды бірден қалпына келтіру (Windows)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/restore-auto-location-checkpoint.ps1
```

### Қолмен (кез келген ОС)

```bash
git restore --source checkpoint/auto-location-v1 -- \
  mobile/src/services/devicePrayerLocation.ts \
  mobile/src/services/__tests__/devicePrayerLocation.test.ts \
  mobile/src/constants/kzCities.ts \
  mobile/src/storage/prefs.ts \
  mobile/src/screens/DashboardScreen.tsx \
  mobile/src/screens/PrayerTimesScreen.tsx \
  mobile/src/components/settings/SettingsPrayerLocationSection.tsx \
  mobile/src/context/QiblaSensorContext.tsx \
  mobile/src/i18n/kk.ts
```

### Толық коммитті cherry-pick

```bash
git log checkpoint/auto-location-v1 -1 --oneline
git cherry-pick <commit-sha>
```

## Ереже (бұзбау)

- `getPrayerLocationAutoEnabled()` әдепкі **true** — жаңа пайдаланушы GPS арқылы алады.
- Қолмен қала таңдағанда `disablePrayerLocationAutoFromManualPick()` шақырылады.
- Ауа райы: `weatherCoordOverride` әрқашан `resolvePrayerScheduleLocation()` нәтижесінен.
- Құбыла: auto OFF болса тек сақталған қала координаты; auto ON болса `readDeviceCoords()`.

## Web deploy күйі

Соңғы deploy: `rv=1782353282973` (2026-06-17). Жаңарту: `scripts/vps_deploy_web.ps1`
