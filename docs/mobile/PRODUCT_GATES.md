# Release product gates (2026-07-17)

Decisions that cannot be faked in code. Engineering implements UX around these gates.

## 1. Scholar sign-off (Namaz learning)

| Field | Value |
|-------|--------|
| **Decision** | Do **not** set `approvedForPublicRelease: true` until a named scholar signs off |
| **Owner** | Product + religious review |
| **Code** | `ScholarContentNotice` on Namaz guide; `NAMAZ_CONTENT_REVIEW.approvedForPublicRelease: false` |
| **Unblock** | Fill `reviewerName`, `reviewedAtIso`, set flag `true` after Hanafi checklist sign-off |

## 2. Hadith KK meanings

| Field | Value |
|-------|--------|
| **Decision** | Ship **only hadiths with in-app Kazakh meaning** (kz-trusted catalog → seed). Rows without `textKk` / `sourceOnly` **deleted** |
| **Owner** | Content |
| **Code** | `hadith-from-db-seed.json` (~98 curated KK); `filterHadithCorpusKkOnly` / `hadithHasKkMeaning`. No unreviewed MT KK in catalog. |
| **Unblock** | To grow catalog: expand `kz-trusted-hadith-catalog.json` then regenerate seed |

## 3. SMS phone auth

| Field | Value |
|-------|--------|
| **Decision** | SMS login **removed from UI** (Twilio not configured) — Google / Apple only |
| **Owner** | Product |
| **Code** | `SettingsAccountLoginSection` — no `PhoneAuthBlock` |
| **Unblock** | If SMS needed later: configure Twilio + restore phone expand UI |

## 3b. Generative AI

| Field | Value |
|-------|--------|
| **Decision** | **Removed** from mobile (2026-07-17) — no chat, no Gemini image analyze |
| **Kept** | Official KB browse (`/api/v1/ai/kb/*`), KmdbHub WebViews, dashboard `kmdb` tile |
| **Code** | No `ImamAI` / `RaqatAIChatScreen`; no `fetchPlatformAiChat` |

## 4. Slim APK + CDN dependency

| Field | Value |
|-------|--------|
| **Decision** | Release APK — Arabic + KK + translit + tajweed + **ru/en/tr/uz/ky Quran editions (~5 MB)** + UI i18n bundled. No CDN required for mushaf meaning. |
| **Fallbacks** | AlQuran API + GitHub QCF4 when `rahatomir.com` 521 |
| **Owner** | DevOps |
| **Deploy** | `powershell -File scripts/deploy_mushaf_cdn_assets.ps1` after VPS/SSH fix |
| **Verify** | `cd mobile && npm run verify:cdn-assets` (primary + fallbacks) |
| **Preflight** | `cd mobile && npm run release:minuses-preflight` |

## 5. Play Internal Testing

| Field | Value |
|-------|--------|
| **Artifact** | `mobile/android/app/build/outputs/bundle/release/app-release.aab` (54.65 MB) |
| **Check** | `npm run release:play:check` |
| **Upload** | Play Console → Testing → Internal testing (manual; no API key in repo) |
