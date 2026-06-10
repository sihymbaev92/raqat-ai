# Hafs 604 Mushaf assets — RAQAT

CDN layout (deploy to `https://rahatomir.com/assets/quran/`):

```
assets/quran/
  svg/001.svg … 604.svg     — Mushaf Database ligature SVG (premium quality)
  pages/001.webp … 604.webp — raster fallback (PNG/WebP)
  qcf4/
    pages/001.json … 604.json
    fonts/QCF4_Hafs_01_W.ttf … (47 + QCF4_QBSML)
    fonts-woff2/…             — web
    font-map.json
    index.json
    verses.json
  ayah_map.json               — ayah tap hotspots (SVG/WebP)
```

## Backend (`EXPO_PUBLIC_MUSHAF_PAGE_BACKEND`)

| Value | Description | APK impact |
|-------|-------------|------------|
| `text-hafs` | Bundled Unicode + typography (default, offline) | smallest logic |
| `svg` | 604 SVG from CDN + ayah_map | assets on CDN |
| `webp` | Raster pages + ayah_map | assets on CDN |
| `qcf4` | QCF4 JSON + ~48 fonts, word-level tap | smallest CDN, best highlight |

## Sync scripts (repo root)

```powershell
# QCF4 (interactive, small APK — recommended for mobile)
powershell -ExecutionPolicy Bypass -File scripts/sync-mushaf-qcf4.ps1

# SVG (premium visual — recommended for web)
powershell -ExecutionPolicy Bypass -File scripts/sync-mushaf-svg.ps1

# ayah_map from QCF4 page JSON
node scripts/generate-ayah-map-from-qcf4.cjs
```

## Env (.env.production)

```
# Premium web (SVG):
# EXPO_PUBLIC_MUSHAF_PAGE_BACKEND=svg

# Interactive mobile (QCF4):
# EXPO_PUBLIC_MUSHAF_PAGE_BACKEND=qcf4

EXPO_PUBLIC_MUSHAF_PAGES_BASE=https://rahatomir.com/assets/quran
```

## Sources

- SVG: [MushafDatabase-Ligature-Based-SVG](https://github.com/mushafdatabase/MushafDatabase-Ligature-Based-SVG)
- QCF4: [MohamadHajjRabee/quran-qcf4](https://github.com/MohamadHajjRabee/quran-qcf4)
- Page boundaries: `mobile/src/data/quranHafsPageStarts.generated.json` (King Fahd 604)

## Deploy with web

After sync, copy `mobile/assets/quran` into web dist during deploy, or host on nginx static alias.
