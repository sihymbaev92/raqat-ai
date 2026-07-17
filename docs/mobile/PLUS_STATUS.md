# Minuses → Pluses status (2026-07-17)

## Resolved in code (this session)

| Was minus | Now |
|-----------|-----|
| Tajweed letter audio CDN-only | **Bundled in slim APK** (~0.5 MB, 28 mp3) — `generate-tajweed-letter-asset-map.cjs` |
| CDN verify fails when origin 521 | **Fallback-aware** `verify:cdn-assets` (AlQuran + GitHub QCF4) |
| Hatim/tajweed no CDN path | **Multi-URL fallbacks** in `loadBundledJson`, `loadQcf4Page`, `quranTajweedAsset` |
| No release preflight for gates | **`npm run release:minuses-preflight`** |
| Muftyat images no cache | **`tajweedMuftyatImageCache.ts`** — FileSystem cache on first load |
| VPS SSH bootstrap manual only | **`vps_install_ssh_key.ps1` + `.py`** |

## Still manual / external (cannot fake)

| Minus | Unblock |
|-------|---------|
| VPS CDN deploy | `.env.deploy` → `RAQAT_VPS_SSH_PASSWORD` → deploy script |
| Play Internal upload | Upload `raqat-play-release-latest.aab` |
| Scholar sign-off | Real reviewer → `approvedForPublicRelease: true` |
| Hadith KK (1200 sourceOnly) | Licensed import pipeline |
| SMS login | Twilio on platform_api |
| Azan 3×3 OEM QA | Physical devices + `npm run qa:azan:oem` |
| Device QA SKIP rows | Hands-on §1–§4 on device |

## Metrics

| Metric | Value |
|--------|-------|
| APK | 45.39 MB (target 80) |
| Jest | 1000/1000 |
| `release:play:check` | PASS |
| Azan OEM QA | Samsung Day 1 PASS (1/9) |
