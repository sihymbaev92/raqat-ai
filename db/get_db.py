# -*- coding: utf-8 -*-
"""
Бір кіру нүктесі: SQLite (әдепкі) / PostgreSQL (`DATABASE_URL`).

**Паттерн:** фабрика емес, бір **контекст менеджер** (`with get_db() as conn`) —
SQLite үшін `db.connection.db_conn`, PostgreSQL үшін `psycopg.connect` немесе
опция бойынша **`psycopg_pool.ConnectionPool`** (өнімде бір процесс / uvicorn
workers үшін; әр worker өз пулы).

Мақсат: бот пен `platform_api` дерекқор таңдауын бір жерден басқару; кейін
оқу/жазу DSN бөлінісі (`DATABASE_URL_READER` / `DATABASE_URL_WRITER`) осы модульге қосылады.

PostgreSQL үшін: `pip install -r requirements-postgres.txt`.

Логикалық схема мен env түсіндіру: `docs/PLATFORM_GPT_HANDOFF.md` §1.1.

| Айнымалы | Мақсаты |
|----------|---------|
| `RAQAT_PG_USE_POOL` | `1` / `true` — жазу DSN үшін **pool**; әйтпесе әр `with` үшін жаңа connect |
| `RAQAT_PG_POOL_MIN`, `RAQAT_PG_POOL_MAX` | Пул өлшемдері (әдепкі min=1, max=10) |
"""
from __future__ import annotations

import os
import threading
from collections.abc import Generator
from contextlib import contextmanager
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import sqlite3

_pg_writer_pool = None
_pg_pool_lock = threading.Lock()


def is_postgresql_configured() -> bool:
    u = (os.getenv("DATABASE_URL") or os.getenv("DATABASE_URL_WRITER") or "").strip().lower()
    return u.startswith("postgres")


def postgresql_dsn() -> str:
    """Жазу/негізгі DSN: `DATABASE_URL_WRITER` болса ол, әйтпесе `DATABASE_URL`."""
    w = (os.getenv("DATABASE_URL_WRITER") or "").strip()
    if w:
        return w
    return (os.getenv("DATABASE_URL") or "").strip()


def _use_pg_pool() -> bool:
    v = (os.getenv("RAQAT_PG_USE_POOL") or "").strip().lower()
    return v in ("1", "true", "yes", "on")


def _get_pg_writer_pool():
    global _pg_writer_pool
    with _pg_pool_lock:
        if _pg_writer_pool is None:
            try:
                from psycopg_pool import ConnectionPool
            except ImportError as e:
                raise ImportError(
                    "RAQAT_PG_USE_POOL=1 үшін psycopg_pool қажет: "
                    "pip install -r requirements-postgres.txt (psycopg[binary,pool])"
                ) from e
            from psycopg.rows import dict_row

            dsn = postgresql_dsn()
            if not dsn:
                raise RuntimeError("DATABASE_URL / DATABASE_URL_WRITER бос")
            mn = max(0, int(os.getenv("RAQAT_PG_POOL_MIN", "1")))
            mx = max(mn, int(os.getenv("RAQAT_PG_POOL_MAX", "10")))
            _pg_writer_pool = ConnectionPool(
                dsn,
                kwargs={"row_factory": dict_row},
                min_size=mn,
                max_size=mx,
            )
        return _pg_writer_pool


def close_postgresql_pools() -> None:
    """Uvicorn / тест аяғында пулды жабу (әйтпесе ресурс ағып кетуі мүмкін)."""
    global _pg_writer_pool
    with _pg_pool_lock:
        if _pg_writer_pool is not None:
            try:
                _pg_writer_pool.close()
            finally:
                _pg_writer_pool = None


def sqlite_database_path() -> str:
    """Бір мән: env → (опция) config.settings.DB_PATH → репо global_clean.db."""
    raw = (os.getenv("RAQAT_DB_PATH") or os.getenv("DB_PATH") or "").strip()
    if raw:
        return str(Path(raw).expanduser().resolve())
    try:
        from config import settings as _cfg

        p = getattr(_cfg, "DB_PATH", None)
        if p and str(p).strip():
            return str(Path(str(p)).expanduser().resolve())
    except Exception:
        pass
    base = Path(__file__).resolve().parents[1]
    return str((base / "global_clean.db").resolve())


@contextmanager
def get_db() -> Generator[Any, None, None]:
    """
    Транзакциялық қосылым.

    - PostgreSQL: `RAQAT_PG_USE_POOL=1` → **ConnectionPool**; әйтпесе бір реттік `connect`.
    - SQLite: `sqlite_database_path()` + WAL (`db.connection.db_conn`).

    Ескерту: қолданыстағы көп модуль әлі `?` плейсхолдермен sqlite3 SQL жазған;
    PostgreSQL үшін `%s` және psycopg — репозиторийлерді біртіндеп көшіру.
    """
    if is_postgresql_configured():
        dsn = postgresql_dsn()
        if not dsn:
            raise RuntimeError("DATABASE_URL / DATABASE_URL_WRITER бос")
        if _use_pg_pool():
            pool = _get_pg_writer_pool()
            with pool.connection() as conn:
                yield conn
            return
        try:
            import psycopg
            from psycopg.rows import dict_row
        except ImportError as e:
            raise ImportError(
                "PostgreSQL DSN орнатылған, бірақ psycopg жоқ. Орнатыңыз: "
                "pip install -r requirements-postgres.txt"
            ) from e
        with psycopg.connect(dsn, row_factory=dict_row) as conn:
            yield conn
        return

    from db.connection import db_conn

    with db_conn(sqlite_database_path()) as conn:
        yield conn


@contextmanager
def get_db_reader() -> Generator[Any, None, None]:
    """
    Оқу жолы: metadata, stats, Құран/хадис GET.
    `DATABASE_URL_READER` postgres болса — әзірге бір реттік connect (келешекте оқу пулы).
    """
    r = (os.getenv("DATABASE_URL_READER") or "").strip()
    if r.lower().startswith("postgres"):
        try:
            import psycopg
            from psycopg.rows import dict_row
        except ImportError as e:
            raise ImportError(
                "DATABASE_URL_READER үшін psycopg қажет: pip install -r requirements-postgres.txt"
            ) from e
        with psycopg.connect(r, row_factory=dict_row) as conn:
            yield conn
        return
    with get_db() as conn:
        yield conn


@contextmanager
def get_db_writer() -> Generator[Any, None, None]:
    """
    Жазу жолы: auth, chat, usage, identities.
    Қазір `get_db()` алиасы (pool параметрлері `get_db()` арқылы қолданылады).
    """
    with get_db() as conn:
        yield conn
