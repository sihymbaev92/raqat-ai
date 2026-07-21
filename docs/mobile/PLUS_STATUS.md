# Minuses → Pluses status (2026-07-17)

## Converted this session

| Was minus | Now (plus) |
|-----------|------------|
| Generative AI chat / Gemini image | **Removed** — no ImamAI screen, no `/ai/chat`, no photo analyze |
| Dashboard tile labeled AI | **`kmdb`** — opens ҚМДБ Fatua/Muftyat hub |
| Broken SMS login UI (503) | **Hidden** — Google / Apple only; dead `PhoneAuthBlock` deleted |
| Quran KK meaning CDN-only | **Bundled in APK** (`quran-kk-from-db.json` inline) |
| Hatim Arabic / translit / tajweed CDN-only | **Bundled in APK** (~8 MB) — offline Quran reader works first launch |
| Android page-turn flat | **3D curl + peek underlay** on all platforms |
| Tajweed letter audio CDN-only | **Bundled** (~0.5 MB) |
| CDN verify fails on 521 | **Fallback-aware** (AlQuran + GitHub QCF4) |
| AI moderation / AI P0 risks | **N/A** — feature removed |
| Hadith without KK meaning (1200 sourceOnly) | **Deleted** — seed = 98 kz-trusted with `textKk`; seed logic matches |
| UI i18n CDN-only (~36 MB) | **APK slim** `offline-auto-translations-apk.json` (~0.6 MB) for ru/en/ky/uz/tr/ar |
| Kyrgyz broken Latin mixes | **Fixed** namaz/prayer/settings Ky copy |
| Kyrgyz APK pack short (1195 vs 1470) | **Filled** +214 ky strings; APK pack parity **1467** all locales |
| Shared 192 kk UI gaps (all 6 locales) | **Filled** +192 × ru/en/ky/uz/tr/ar; APK pack **1659/1659** |
| Stub locales zh/fa/id/ms/hi/ku | **Removed** from AppLocale, UI patches, Quran locale maps, core i18n (~5.6 MB) |
| Auth empty Android build | **Honest guest hint** when Google not configured |
| Account sync false success | **Typed result** (`ok` / `partial` / `failed` / `skipped`) |
| Deep link `imamai` primary | **`raqat://` primary**; `imamai://` kept as legacy |
| OEM brand detection gaps | **Redmi/Poco/Honor/Infinix brand** + battery permission in Expo config |
| Stale preflight “1200 sourceOnly” | **Updated** manual gates text |
| Multi-lang Quran on CDN (~18 MB) | **APK-bundled** ru/en/tr/uz/ky only (~5 MB); native editions (not gtx) |
| Hadith bodies in UI MT pack | **Excluded** — pack = chrome/guides only; hadith uses fawaz/HadeethEnc/kz-trusted |

## Still external / honest gates

| Item | Why not faked | Status 2026-07-21 |
|------|----------------|-------------------|
| VPS CDN origin 521 | Needs SSH deploy (`deploy_mushaf_cdn_assets.ps1`) | **Blocked:** host key rotated; `Permission denied (publickey)` — install key via Hetzner Console (see `docs/mobile/CDN_DEPLOY_SSH.md`) |
| Play Internal upload | Manual Console upload | AAB built locally — upload still manual |
| Scholar sign-off | `approvedForPublicRelease` stays **false** until real reviewer | Unchanged |
| Azan 3×3 OEM QA | Physical devices (code/OEM helpers improved) | UX copy improved (tap notification when screen on / FSI denied) |
| Account cross-device sync reliability | Backend + network dependent | API host down until VPS restored |
| iOS Apple Developer | Paid Program + EAS | Unchanged |
| Guide prose MT quality (duas/namaz/hajj) | gtx + banner; patches override chrome | Human patches grow over time |

## Metrics

| Metric | Value |
|--------|-------|
| Generative AI entry points | **0** |
| APK budget | ~55 MB est. (target 80) after Quran pack bundle |
| Auth | Google / Apple (+ dev password) |
| Hadith KK seed | **98** curated |
| Quran editions (ru/en/tr/uz/ky) | **APK** ~5 MB |
| Preflight | `npm run release:minuses-preflight` |
