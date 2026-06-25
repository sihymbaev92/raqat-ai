# Clean baseline — тек қолданылатын мазмұн (2026-06-17)

**Git tag:** `checkpoint/clean-baseline-v1`  
**Мақсат:** Қолданылмайтын экрандар, скрейп мәтін, заңсыз азан және үшінші тарап DOM инъекциясы алынып тасталды.

## Алынып тасталған

| Санат | Не жойылды |
|--------|------------|
| Қолданылмайтын UI | Community Dua, MainTabBar, DashboardDailyHub, SpiritLiftButton, DashboardHeroQiblaCard, т.б. |
| Офлайн скрейп хадис | `scraped-hadith-muftyat.json`, `extracted-hadith-muftyat.json`, `external-hadith-kk.json` + экрандар |
| Halal WebView инъекция | `HALAL_DAMU_APP_PROMO_TO_TOP_INJECT` (halaldamu.kz DOM өзгерту) |
| Азан (SkySound) | `prayer_azan_user_*.mp3` → Wikimedia Commons (`npm run fetch:azan`) |

## Қалған (ресми / лицензияланған)

- **Хадис:** `hadith-sahih-seed.json` (fawazahmed0 API, `HADITH_DATA_PROVENANCE.md`) + ресми сайт сілтемелері
- **Хадис hub:** Fatua/Muftyat/Islam.kz — тек браузерде ашу
- **Halal:** halaldamu.kz WebView (инъекциясыз) + disclaimer
- **Құран:** OFL қаріптер, streaming audio CDN (қолдану шарттарына бағыну)

## Тест

```powershell
cd mobile
npm run lint
npm run test:auto-location
npx jest src/components/__tests__/embeddedOfficialSiteNavigation.test.ts --ci
```

## Азанды қайта жүктеу (лицензиялы)

```powershell
cd mobile
npm run fetch:azan
```

## Оралу

```powershell
git show checkpoint/clean-baseline-v1 --stat
```

Автоматты орын checkpoint: `checkpoint/auto-location-v1`, `scripts/restore-auto-location-checkpoint.ps1`
