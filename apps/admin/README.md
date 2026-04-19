# RAQAT Admin (`apps/admin`)

**Келесі фаза:** audit, usage, content moderation, RBAC — бөлек React/Vite немесе FastAPI Jinja панелі.

Қазіргі уақытта ops бөлігі репозиторийде:

- `handlers/admin.py` — Telegram арқылы шектеулі әкімшілік
- `platform_api/usage_routes.py`, health/readiness

Production blueprint: metrics + Grafana + Sentry — [`docs/PRODUCTION_BLUEPRINT_2M_USERS.md`](../../docs/PRODUCTION_BLUEPRINT_2M_USERS.md).
