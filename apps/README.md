# RAQAT — `apps/` (клиенттер мен entrypoint-тер)

[`PRODUCTION_BLUEPRINT_2M_USERS.md`](../docs/PRODUCTION_BLUEPRINT_2M_USERS.md) бойынша **modular monolith**: барлық клиенттер орталық Platform API арқылы жұмыс істейді.

## Ағымдағы карталау (физикалық жолдар)

| Blueprint | Репозиторийдегі нақты орын | Ескерту |
|-----------|---------------------------|---------|
| `apps/api` | [`../platform_api/`](../platform_api/) | FastAPI MVP + `platform_api/app/` модульдік қабат |
| `apps/bot` | [`../bot_main.py`](../bot_main.py), [`../handlers/`](../handlers/), [`../config/`](../config/) | Келесі фазада осы файлдар `apps/bot/` астына көшірілуі мүмкін |
| `apps/mobile` | [`../mobile/`](../mobile/) | Expo жобасы |
| `apps/web` | [`../web/`](../web/) | Статикалық MVP |
| `apps/admin` | *жоспарланған* | Админ панель — бос орын, [`admin/README.md`](./admin/README.md) |

Осы қалта **келешекте** толық көшірілген кодқа ауысады; қазір документациялық «карта» ретінде қолданылады.

## Жергілікті іске қосу (қысқа)

- API: `bash scripts/run_platform_api.sh` немесе `cd apps/api && bash dev.sh` (Windows: `cd apps\api; .\dev.ps1`), толығы: [`api/README.md`](./api/README.md) және `docs/DEV_LOCAL_CHECKLIST.md`
- Бот: `python bot_main.py` (түбірден)
- Mobile: `cd mobile && npm run start`
- Web: `cd web && python3 -m http.server 8080`

Инфра (Postgres + Redis): [`../infra/docker/README.md`](../infra/docker/README.md)
