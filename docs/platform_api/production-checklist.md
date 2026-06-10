# Production checklist

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 20. Production Checklist — Unified Platform Mode

Бұл чеклист біріккен режимді production-ға қауіпсіз шығару үшін.

### 20.1 Required env (must-have)

- `RAQAT_PLATFORM_API_BASE`
- `RAQAT_AI_PROXY_SECRET`
- `RAQAT_BOT_API_ONLY=1`
- `RAQAT_SINGLE_SOURCE_MODE=1`
- `RAQAT_JWT_SECRET` (>=32)
- `DATABASE_URL` (production DSN)

### 20.2 Service baseline

- Platform API (`8787`) up
- PostgreSQL healthy
- Redis healthy (cache/rate-limit/queue)
- Worker queue healthy (Celery/RQ)
- Bot process healthy and polling

### 20.3 Health gates (release blocker)

Release тек мына шарттар орындалса ғана:

1. `/health` -> 200
2. `/ready` -> 200
3. API-only smoke endpoints -> 200
4. `auth/login` және `users/me` smoke -> OK
5. Bot -> AI -> response flow -> OK

### 20.4 Reliability controls

- Structured logs + request_id
- Error tracking (Sentry немесе ұқсас)
- Alerting:
  - `/ready` fail
  - queue backlog high
  - AI 5xx rate high
  - Telegram DNS/connect failures

### 20.5 Security controls

- Secrets rotation policy
- `RAQAT_AI_PROXY_SECRET` тек серверде
- RBAC + audit logs enabled
- Admin әрекеттері толық журналданады

### 20.6 Backup / recovery

- Nightly backup (`scripts/backup_sqlite.sh` немесе PG backup policy)
- Restore drill аптасына кемінде 1 рет
- `scripts/nightly_maintenance.sh` cron арқылы қосулы

### 20.7 Go-live command set (reference)

```bash
set -a; source .env; set +a
export RAQAT_BOT_API_ONLY=1
export RAQAT_SINGLE_SOURCE_MODE=1
bash scripts/dev_restart_platform.sh
.venv/bin/python scripts/smoke_bot_api_only_content.py --api-base "${RAQAT_PLATFORM_API_BASE:-http://127.0.0.1:8787}" --content-secret "${RAQAT_CONTENT_READ_SECRET:-}"
```

Ескерту: production-та `dev_restart_platform.sh` орнына systemd/docker orchestration ұсынылады.

---
