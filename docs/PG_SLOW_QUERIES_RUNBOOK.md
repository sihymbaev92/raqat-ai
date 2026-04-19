# PostgreSQL: баяу сұраулар (`pg_stat_statements`)

Cutover соңында немесе жүктеме тестінен кейін **қандай сұраулар уақыт алады** деген сұрауға жауап беру үшін `pg_stat_statements` кеңейтімін қосыңыз.

## 1. Кеңейтім мен жинақтау

Суперпользователь сеансында (мысалы `postgres`):

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

`postgresql.conf` (немесе `ALTER SYSTEM` + reload):

- `shared_preload_libraries = 'pg_stat_statements'`
- `pg_stat_statements.track = all` (немесе `top` — тек сыртқы сұраулар)

Конфиг өзгерген соң: `SELECT pg_reload_conf();` немесе қызметті қайта жүктеу.

## 2. Типтік сұраулар

**Уақыт бойынша үздік 20** (жалпы уақыт, нормализацияланған сұрау мәтіні):

```sql
SELECT
  round(total_exec_time::numeric, 2) AS total_ms,
  calls,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

**Орташа ең баяу** (кем дегенде 50 шақыру):

```sql
SELECT
  calls,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  query
FROM pg_stat_statements
WHERE calls >= 50
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Жоспарлау уақыты үлкен** (индекс/статистика күдігі):

```sql
SELECT
  round((total_plan_time + total_exec_time)::numeric, 2) AS total_ms,
  calls,
  query
FROM pg_stat_statements
ORDER BY (total_plan_time + total_exec_time) DESC
LIMIT 15;
```

## 3. Статистиканы нөлдеу

```sql
SELECT pg_stat_statements_reset();
```

## 4. RAQAT контексті

- Қосымша: `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §8.1, cutover, `DATABASE_URL`.
- Кодта плейсхолдерлер: `scripts/audit_sql_placeholders.py`, `db/dialect_sql.py`.

---

*Қысқа runbook; нақты `postgresql.conf` жолы ортаңыздағы нұсқаға байланысты.*
