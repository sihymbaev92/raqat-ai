# Release 1-Minute Checklist

Use this right before deploy or APK handoff.

## 1) Git / branch
- `git status --short` is clean (or only intentional files).
- Generated artifacts/work caches are not dirty in git: `mobile/raqat-*-latest.apk`, `mobile/*.aab`, `mobile/*.tar.gz`, `.tmp/`, `.gradle-user-home/`.
- If `mobile/raqat-release-latest.apk` or `mobile/raqat-debug-latest.apk` appears as modified, do not hand off release yet; move artifacts outside git or remove them from tracking in a dedicated cleanup.
- Latest commit is pushed: `git push origin main`.

## 2) API readiness
- `GET /health` returns `status: ok`.
- `GET /ready` returns `ok: true`.
- Backend is expected (`postgresql` for production).

## 3) DB and env
- `DATABASE_URL` points to real DB name (not placeholders).
- Secrets are not in tracked files (`.env` stays untracked).
- If Redis is required in this env, `/ready` includes Redis OK.

## 4) Bot and mobile connectivity
- `bot_main.py` process is running (if bot release includes backend updates).
- **One `BOT_TOKEN` => one polling bot** (stop the bot on VPS or locally — not both).
- Windows: `powershell -ExecutionPolicy Bypass -File .\scripts\diagnostics_raqat_processes.ps1` if you see duplicate `uvicorn` / `bot_main` (do not mass-kill; parent/child PIDs may be linked).
- Mobile API base points to reachable host/IP.
- Smoke check: AI response, Qibla screen opens, Settings shows healthy backend.

## 5) Artifact sanity (APK/AAB)
- New artifact exists in `mobile/android/app/build/outputs/...`.
- Version/build number updated as intended.
- Install on a real device and run core smoke flow once.
- If Android reports `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, the installed app uses a different signing key. Use the matching release keystore, or uninstall/reinstall only when losing local app data is acceptable.
- Build Play artifact first: `cd mobile && npm run build:aab`.
- Confirm release check passes after the AAB exists: `cd mobile && npm run release:play:check`.

## 6) Play Internal Testing
- Verify artifact hash/size printed by build script; keep it in release notes.
- Confirm `mobile/android/keystore.properties` exists locally and points to the intended upload key/JKS.
- Upload `mobile/android/app/build/outputs/bundle/release/app-release.aab` to **Play Console → Testing → Internal testing**.
- Permissions declaration matches app use:
  - `POST_NOTIFICATIONS`: namaz/hatim reminders.
  - `SCHEDULE_EXACT_ALARM`: exact prayer-time alarms.
  - `USE_FULL_SCREEN_INTENT`: namaz time opens the full-screen Azan page; user can stop playback manually.
  - `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`: qibla bearing and local prayer times.
  - `CAMERA`: qibla AR/barcode/product label checks.
- Data safety / privacy:
  - Location is used for qibla/prayer times and can be city/manual fallback.
  - Camera/photos are used only for user-initiated halal/product checks.
  - AI/API requests may send user-entered text to the Raqat backend.
  - No secrets are bundled in the client; production API is HTTPS.
- Internal testers smoke: fresh install, onboarding, settings login/API state, namaz diagnostics, Quran list/surah/mushaf/Hatim, Halal barcode/photo/map/products, Qibla sensor, offline content.
- Real-device Azan QA: screen locked + app backgrounded + battery saver off/on. Confirm full-screen Azan page opens, audio fades in, no duplicate notification sound plays, and `Азанды тоқтату` stops playback.
- Web smoke after deploy: `scripts/web-release-health.ps1` passes for `/`, `/more/quran`, `/more/surah/1`, `/more/mushaf-book/1`, and API `/health`.

## 7) Play Release Notes (kk)
```text
RAHAT OMIR v1.1.0 ішкі тест нұсқасы:
- Басты беттегі намаз карточкасының фоны сапалырақ, пикселдену азайтылды.
- Намаз уақыты мен азан экраны тұрақтандырылды: намаз атауы, уақыт және азан мәтіні анық көрсетіледі.
- Құбыла баптауында тұрақты режим сақталып, Settings crash түзетілді.
- Dashboard суреттері жеңілірек жүктеледі, негізгі экрандар телефонда crash-free тексерілді.
```
