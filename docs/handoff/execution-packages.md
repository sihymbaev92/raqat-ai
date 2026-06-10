# Орындау пакеті A/Ә/Б/В

> Ағымдағы құжат. Архив: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](section-map.md).

---

## 15. Орындау пакеті (A / Ә / Б / В)

Бұл бөлім — бірден орындауға дайын командалар мен конфигурациялар.

### A) DNS мәселесін шешу (бот тұрақтылығы)

Қауіпсіз dry-run:

```bash
bash scripts/fix_dns_resolved.sh
```

Нақты apply:

```bash
sudo bash scripts/fix_dns_resolved.sh --apply
```

Скрипт не істейді:
- `systemd-resolved` үшін override жазады: `DNS=1.1.1.1 8.8.8.8`, `FallbackDNS=9.9.9.9 1.0.0.1`;
- `systemctl restart systemd-resolved`;
- `api.telegram.org` DNS resolve + HTTPS reachability smoke-test.

### Ә) Auth/JWT интеграциясы (Identity Linking end-to-end)

Flow тексеру:

```bash
bash scripts/verify_identity_linking.sh
```

Басқа тест Telegram id-мен:

```bash
TG_TEST_USER_ID=777000001 bash scripts/verify_identity_linking.sh
```

Тексерілетін толық тізбек:
1. `POST /api/v1/auth/link/telegram`
2. `POST /api/v1/ai/chat` (dev verify ішінде mock)
3. `GET /api/v1/users/me/history`
4. DB кестелерінде сәйкестік (`platform_identities`, `platform_ai_chat_messages`)

### Б) PostgreSQL Cutover (audit + migrate)

Аудит нәтижесі (`scripts/audit_sql_placeholders.py`):
- **12 файлда** SQL `?`/f-string review нүктелері табылды.
- Негізгі аймақтар: `db/*`, `platform_api/content_reader.py`, `services/*`, `handlers/*`.
- Бұл күтілетін нәтиже (SQLite-үйлесімді код). Cutover кезінде `db/dialect_sql.py` және migrate қабаты арқылы кезең-кезеңімен көшу керек.

Толық cutover wrapper (`docs/OPERATIONS_RUNBOOK_5_TRACKS.md`):

```bash
export PG_DSN='postgresql://user:pass@host:5432/dbname'
bash scripts/run_pg_cutover.sh --validate-only   # тек аудит + жол саны (көшірмесіз)
bash scripts/run_pg_cutover.sh                    # немесе --apply: backup + migrate
```

Скрипт реттілігі (`--apply`):
1. placeholder audit
2. SQLite backup
3. `migrate_sqlite_to_postgres.py --bootstrap-ddl --with-quran-hadith --validate`
4. `--validate-only` қайталап тексеру

Лог файлы: `.logs/pg_cutover_YYYYmmdd_HHMMSS.log`

### В) UI/UX жақсарту (Expo)

Осы пакеттің ішінде Home экраны жақсартылды:
- «Басты модульдер» (`focusTitle`) тақырыбы қосылды;
- «Бүгінгі аят» CTA картасы Home-ға қосылды (Prayer + Daily Ayah + AI үштігі айқынырақ болды);
- Құбыла hero блогы алдыңғы сұраныс бойынша ықшам күйде қалдырылды.

Файл:
- `mobile/src/screens/DashboardScreen.tsx`

Expo жаңарту:

```bash
cd mobile
npm run start:vps
```

Телефон: `exp://<server-ip>:8081` → Reload.

### Экожүйе релизі (жаңа артефакттар)

- `scripts/release_content_pipeline.sh` — import → API validate → mobile sync smoke.
- `scripts/validate_content_release.py` — health/ready/content + metadata ETag/304 + incremental fetch smoke.
- `docs/API_ONLY_ECOSYSTEM_CUTOVER.md` — bot/app/web үшін API-only cutover runbook.

### Bot API-first hardening (handlers/hadith.py, handlers/quran.py)

`RAQAT_BOT_API_ONLY=1` режимі үшін боттың контент read-path-тары күшейтілді:

- `handlers/hadith.py`:
  - random hadith және hadith search логикасы API-first (`platform_api`) жолына көшірілді;
  - API сәтсіздігінде DB fallback қолданылмайды;
  - пайдаланушыға "табылмады" орнына API қолжетімсіздігі туралы анық хабар беріледі.

- `handlers/quran.py`:
  - Quran search және surah read-path API-first режимде API-дан оқиды;
  - API сәтсіз болған жағдайда user-friendly alert/мәтін қайтарылады;
  - API-only кезінде DB fallback read-path енді пайдаланылмайды.

Қолдау үшін API-да жаңа endpoint-тер қосылды:

- `GET /api/v1/hadith/random`
- `GET /api/v1/hadith/search`
- `GET /api/v1/quran/search`

Ескерту:
- dynamic route қақтығысын болдырмау үшін `content_routes.py` ішінде route order түзетілді
  (`/hadith/random`, `/hadith/search`, `/quran/search` жолдары parameterized route-тардан бұрын жарияланды).

### Bot API-only smoke automation (жаңартылды)

Bot handler-лердің API-only read-path-тарын тұрақты тексеру үшін жаңа smoke script қосылды:

- `scripts/smoke_bot_api_only_content.py`
  - `/ready`
  - `/api/v1/hadith/random`
  - `/api/v1/hadith/search`
  - `/api/v1/quran/search`
  - `/api/v1/quran/{surah}`

Қолмен іске қосу:

```bash
set -a; source .env; set +a
.venv/bin/python scripts/smoke_bot_api_only_content.py \
  --api-base "${RAQAT_PLATFORM_API_BASE:-http://127.0.0.1:8787}" \
  --content-secret "${RAQAT_CONTENT_READ_SECRET:-}"
```

Қосымша hardening:

- `services/platform_content_service.py` ішінде API қателері екіге бөлінді:
  - `not_found` (контент шын мәнінде жоқ),
  - `unavailable` (API/желілік мәселе).
- Осы статустар `handlers/hadith.py` және `handlers/quran.py` ішінде бөлек өңделеді:
  - `not_found` → табиғи “табылмады” жауабы,
  - `unavailable` → user-friendly “API уақытша қолжетімсіз” хабарламасы.

### Nightly maintenance интеграциясы (жаңартылды)

`scripts/nightly_maintenance.sh` енді келесі реттілікпен жүреді:

1. `backup_sqlite.sh`
2. `healthcheck_raqat.sh`
3. `validate_content_release.py`
4. `smoke_bot_api_only_content.py`

Лог:
- `.logs/nightly_maintenance.log`

Соңғы run нәтижесі:
- бот API-only smoke endpoint-тері `200 OK` арқылы өтті.

---
