# -*- coding: utf-8 -*-
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def test_sqlite_database_path_respects_raqat_db_path(monkeypatch, tmp_path):
    from db.get_db import sqlite_database_path

    dbf = tmp_path / "x.db"
    dbf.write_bytes(b"")
    monkeypatch.setenv("RAQAT_DB_PATH", str(dbf))
    monkeypatch.delenv("DB_PATH", raising=False)
    assert sqlite_database_path() == str(dbf.resolve())


def test_get_db_yields_sqlite_connection(monkeypatch, tmp_path):
    from db.get_db import get_db

    dbf = tmp_path / "w.db"
    dbf.write_bytes(b"")
    monkeypatch.setenv("RAQAT_DB_PATH", str(dbf))
    monkeypatch.delenv("DB_PATH", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_WRITER", raising=False)
    with get_db() as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS t (a INTEGER)")
        conn.execute("INSERT INTO t VALUES (1)")
        n = conn.execute("SELECT COUNT(*) FROM t").fetchone()[0]
        assert int(n) == 1


def test_close_postgresql_pools_idempotent():
    from db.get_db import close_postgresql_pools

    close_postgresql_pools()
    close_postgresql_pools()


def test_get_db_postgres_operational_error_on_bad_host(monkeypatch, tmp_path):
    psycopg = pytest.importorskip("psycopg")
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@127.0.0.1:1/none")
    monkeypatch.delenv("DATABASE_URL_WRITER", raising=False)
    monkeypatch.delenv("DATABASE_URL_READER", raising=False)
    monkeypatch.delenv("RAQAT_DB_PATH", raising=False)
    from db.get_db import get_db

    with pytest.raises(psycopg.OperationalError):
        with get_db():
            pass
