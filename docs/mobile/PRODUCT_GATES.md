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
| **Decision** | Ship **Sahih corpus Arabic-only** (`sourceOnly: true`) until licensed KK/RU meanings are imported |
| **Owner** | Content / legal |
| **Code** | `HadithListScreen` `corpusArabicOnlyBadge`; `hadithTextForLocale` returns "" for non-ar when `sourceOnly` |
| **Unblock** | Run `npm run export:hadith-json:full` (or KK pipeline) → replace seed → remove `sourceOnly` on rows with `textKk` |

## 3. SMS phone auth

| Field | Value |
|-------|--------|
| **Decision** | SMS login **disabled** when platform API returns HTTP 503 (Twilio not configured) |
| **Owner** | Backend ops |
| **Code** | `PhoneAuthBlock` shows `phoneSmsUnavailable`; Google/Apple remain primary |
| **Unblock** | Configure Twilio on `platform_api`; remove 503 from `/auth/phone/start` |

## 4. Slim APK + CDN dependency

| Field | Value |
|-------|--------|
| **Decision** | Release APK **45 MB** — heavy assets on `https://rahatomir.com/assets/...` |
| **Owner** | DevOps |
| **Deploy** | `powershell -File scripts/deploy_mushaf_cdn_assets.ps1` after VPS/SSH fix |
| **Verify** | `cd mobile && npm run verify:cdn-assets` |

## 5. Play Internal Testing

| Field | Value |
|-------|--------|
| **Artifact** | `mobile/android/app/build/outputs/bundle/release/app-release.aab` (54.65 MB) |
| **Check** | `npm run release:play:check` |
| **Upload** | Play Console → Testing → Internal testing (manual; no API key in repo) |
