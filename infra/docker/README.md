# RAQAT — Docker инфра (dev / staging негізі)

[`PRODUCTION_BLUEPRINT_2M_USERS.md`](../../docs/PRODUCTION_BLUEPRINT_2M_USERS.md) бойынша production: **PgBouncer**, **Postgres HA**, **Redis**, **Celery**, object storage.

Бұл қалта **локальды және staging** үшін ең аз қызметтерді көтереді:

- **PostgreSQL 16** — `DATABASE_URL` мысалы: `postgresql://raqat:raqat_dev@localhost:5432/raqat`
- **Redis 7** — cache, rate limit, Celery broker (кейін)

## Іске қосу

```bash
cd infra/docker
docker compose up -d
```

**Celery worker** (Redis-ке байланысты, `platform_api/celery_app.py`):

```bash
docker compose --profile workers up -d celery-worker
```

Тоқтату: `docker compose down` (деректер томда сақталады — `pgdata`).

## API мен бот

API/bот контейнерлері әлі осы compose-та **міндетті емес** — әдетте IDE-ден `uvicorn` + `python bot_main.py` жүреді. API-ны контейнерге қосу үшін репо түбінде `Dockerfile.api` қосылғаннан кейін `docker-compose.yml` ішінде `build` бөлімін ашыңыз.

Құпиялар: `.env` файлын **compose қалтасына емес**, репо түбіне қойыңыз (`docs/DEV_LOCAL_CHECKLIST.md`).
