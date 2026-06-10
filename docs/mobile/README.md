# Mobile (Expo SDK 54)

`mobile/` — React Native, басты бет, Құран/мұсаф, хатым, құбыла, AI чат.

## Changelog (хронология)

| Күн | Файл | Мазмұн |
|-----|------|--------|
| 2026-05-19 | [changelog/2026-05-19.md](changelog/2026-05-19.md) | KB-only AI, Halal клиент, products API, Hajj layout, APK |
| 2026-05-16 | [changelog/2026-05-16.md](changelog/2026-05-16.md) | Құрбан айт, құбыла иін, шапка, islamic KB |
| 2026-05-13 — 15 | [changelog/2026-05-13-15.md](changelog/2026-05-13-15.md) | Jest, Android виджеттер, Halal, дәстүр, web asset |
| 2026-05-11 | [changelog/2026-05-11.md](changelog/2026-05-11.md) | Мұсаф Хафс 604, хатым джуз, басты бет |
| 2026-05-09 | [changelog/2026-05-09.md](changelog/2026-05-09.md) | Хатым кітап UI, экран бұру, мұсаф тығыздығы |
| 2026-04-20 | [changelog/2026-04-20.md](changelog/2026-04-20.md) | Halal, штрихкод, Qibla, APK (тарихи) |

## Тақырып бойынша

| Тақырып | Қайда |
|---------|--------|
| Мұсаф / хатым sprint жоспары | [../roadmap/mushaf-sprints.md](../roadmap/mushaf-sprints.md) |
| Feature-Sliced рефактор (жоспар) | [../roadmap/feature-sliced-plan.md](../roadmap/feature-sliced-plan.md) |
| P0 mobile тапсырмалар | [../roadmap/priorities-p0-p2.md](../roadmap/priorities-p0-p2.md) |

## API клиент

[handoff-api-client.md](handoff-api-client.md) — `platformApiClient`, контент синк; жаңа өзгерістер — `changelog/`.

## Негізгі код

| Тақырып | Жол |
|---------|-----|
| Басты бет | `src/screens/DashboardScreen.tsx` |
| Құран оқу | `src/screens/QuranSurahScreen.tsx` |
| Хатым | `src/screens/HatimScreen.tsx` |
| Құбыла | `src/screens/QiblaScreen.tsx`, `components/QiblaArrowPointer.tsx` |
| API base | `src/config/raqatApiBase.ts`, `app.config.js` |

## Тест және build

```bash
cd mobile
npm run test:full
npm run build:apk:debug
# release: scripts/assemble-android-release-phone.ps1
```

§ картасы: [handoff/section-map.md](../handoff/section-map.md)

[← docs/README.md](../README.md)
