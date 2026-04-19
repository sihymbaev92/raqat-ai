# API-only экожүйе Cutover (bot/app/web)

Мақсат: **бір шындық көзі** — `platform_api` + master PostgreSQL.  
Барлық клиент (`bot`, `mobile`, `web`) контент/identity/chat үшін **API арқылы ғана** жұмыс істейді.

---

## 1) Контент релиз pipeline (import → validate → mobile smoke)

### 1.1 Pipeline командасы

```bash
bash scripts/release_content_pipeline.sh \
  --import-cmd ".venv/bin/python scripts/hadith_corpus_sync.py import-json --db ./global_clean.db --input ./hadith-from-db.json --allow-errors" \
  --import-cmd ".venv/bin/python scripts/import_quran_kk_verified.py --db ./global_clean.db --input ./quran_kk_verified.json"
```

Не тексереді:
- миграциялар,
- импорт командалары,
- API health/ready/content,
- `/metadata/changes` + `ETag -> 304`,
- incremental smoke (`quran_changed`/`hadith_changed` болса, сол ID-ларды API-дан тартып көру).

### 1.2 Тек smoke/validate

```bash
.venv/bin/python scripts/validate_content_release.py --api-base http://127.0.0.1:8787
```

Локаль matrix smoke (SQLite + optional PostgreSQL):

```bash
bash scripts/local_content_smoke_matrix.sh
# PostgreSQL бар болса:
PG_DSN=postgresql://user:pass@127.0.0.1:5432/raqat bash scripts/local_content_smoke_matrix.sh
```

Қорғалған контент болса:

```bash
RAQAT_CONTENT_READ_SECRET=... \
.venv/bin/python scripts/validate_content_release.py --api-base http://127.0.0.1:8787 --content-secret "$RAQAT_CONTENT_READ_SECRET"
```

---

## 2) PostgreSQL master cutover (операциялық рет)

1. **PG дайындау**  
   `PG_DSN` орнату, backup жасау.

2. **Көшіру**  
   Алдымен dry-run: `bash scripts/run_pg_cutover.sh --validate-only`  
   Көшірме: `bash scripts/run_pg_cutover.sh` немесе `bash scripts/run_pg_cutover.sh --apply`  
   Толық нұсқау: `docs/OPERATIONS_RUNBOOK_5_TRACKS.md`

3. **Config ауыстыру (master)**  
   `.env`/service env:
   - `DATABASE_URL=<PG_DSN>`
   - (қажет болса) `DATABASE_URL_WRITER=<PG_DSN>`
   - `RAQAT_PG_USE_POOL=1`

4. **Қызметтерді қайта қосу**  
   `platform_api`, `bot`, `web` backend (егер бар болса).

5. **Smoke**  
   - `GET /health`
   - `GET /ready` (`backend: postgresql`)
   - `POST /auth/link/telegram`
   - `GET /users/me/history`
   - `scripts/validate_content_release.py`

6. **Rollback readiness**  
   cutover терезесінде SQLite backup және rollback env алдын ала дайын болсын.

---

## 3) Bot/App/Web-ті API-only ету

### Bot
- `RAQAT_PLATFORM_API_BASE` міндетті.
- `RAQAT_BOT_API_ONLY=1` (prod): API-only бақылау режимі қосылады.
- `RAQAT_BOT_LINK_SECRET`, `RAQAT_JWT_SECRET`, `RAQAT_AI_PROXY_SECRET` міндетті.
- Тікелей DB оқитын жерлерді кезең-кезеңімен API read endpoint-теріне көшіру.

### Mobile
- `EXPO_PUBLIC_RAQAT_API_BASE` міндетті.
- `EXPO_PUBLIC_RAQAT_API_ONLY=1` (prod): сыртқы fallback-тарды өшіру.
- Content/AI үшін secret немесе JWT scope (`content`, `ai`).
- Продта fallback дереккөздерді feature-flag арқылы өшіру (API жоқ кезде ғана авариялық режим).

### Web
- Контентті тікелей DB емес, `platform_api` арқылы алу.
- Auth/JWT scope-тарды mobile/bot-пен бірдей модельде ұстау.

---

## 4) Бірыңғай бақылау (parity)

Апталық немесе релиз сайын:
- API stats (`/api/v1/stats/content`) vs bot күткен counts;
- sample parity: `quran 1:1`, `quran 2:255`, random hadith IDs;
- identity parity: `platform_identities` өсімі және `/users/me/history` қолжетімділігі;
- DNS/Telegram reachability (`scripts/fix_dns_resolved.sh` smoke).

---

## 5) Минималды Definition of Done

- Контент релиз pipeline жасыл (green).
- `/ready` = `postgresql`.
- Telegram → AI → DB → API history → mobile visibility end-to-end дәлелденген.
- Bot/App/Web production трафигі API-only режимінде.
