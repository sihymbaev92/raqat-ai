# Alembic + PostgreSQL (бастапқы қадам)

SQLite `db/migrations.py` бот іске қосылғанда орындалады. **PostgreSQL** үшін схеманы нұсқамалы басқару үшін Alembic қосуға болады.

## Негізгі рет

1. `DATABASE_URL=postgresql://...` баптау (`docs/MIGRATION_SQLITE_TO_POSTGRES.md`).
2. `pip install alembic sqlalchemy psycopg[binary]`.
3. Репо түбінен: `alembic init db/alembic` (немесе қолмен `db/alembic/versions/` құрылымы).
4. `alembic/env.py` ішінде `target_metadata = ...` — SQLAlchemy модельдері анықталғаннан кейін `autogenerate` қолданылады.
5. Бірінші ревизия: `alembic revision --autogenerate -m "initial_pg"` немесе қолмен DDL (`audit_events`, `api_usage_ledger`, т.б.).

## SQLite vs PG

Қазіргі **010 `audit_events`** кестесі SQLite миграциясы арқылы жергілікті `.db` файлына қосылады. PostgreSQL үшін мысал DDL:

```sql
CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  route TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  platform_user_id TEXT,
  telegram_user_id BIGINT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_platform ON audit_events(platform_user_id, created_at);
```

## Келесі жұмыс

- `sqlalchemy` модельдері `packages/` немесе `db/models/` астына шығу.
- `alembic upgrade head` — CI staging.
