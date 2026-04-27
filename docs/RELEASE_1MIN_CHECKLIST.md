# Release 1-Minute Checklist

Use this right before deploy or APK handoff.

## 1) Git / branch
- `git status --short` is clean (or only intentional files).
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
- Mobile API base points to reachable host/IP.
- Smoke check: AI response, Qibla screen opens, Settings shows healthy backend.

## 5) Artifact sanity (APK/AAB)
- New artifact exists in `mobile/android/app/build/outputs/...`.
- Version/build number updated as intended.
- Install on device and run core smoke flow once.
