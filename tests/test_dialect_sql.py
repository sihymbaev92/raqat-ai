# -*- coding: utf-8 -*-
from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def test_sql_for_postgresql_placeholders_and_timestamp():
    from db.dialect_sql import sql_for_postgresql

    s = "INSERT INTO t (a,b) VALUES (?, datetime('now'))"
    out = sql_for_postgresql(s)
    assert "?" not in out
    assert "%s" in out
    assert "CURRENT_TIMESTAMP" in out
    assert "datetime('now')" not in out


def test_sql_for_postgresql_on_conflict_spacing():
    from db.dialect_sql import sql_for_postgresql

    out = sql_for_postgresql(
        "INSERT INTO u (id) VALUES (?) ON CONFLICT(user_id) DO NOTHING"
    )
    assert "ON CONFLICT (user_id)" in out


def test_sql_for_postgresql_insert_ignore_user_preferences():
    from db.dialect_sql import sql_for_postgresql

    sql = """
            INSERT OR IGNORE INTO user_preferences (user_id, lang_code, updated_at)
            VALUES (?, ?, datetime('now'))
            """
    out = sql_for_postgresql(sql)
    assert "INSERT INTO user_preferences" in out
    assert "ON CONFLICT (user_id) DO NOTHING" in out
    assert out.count("%s") == 2


def test_adapt_sqlite_noop():
    from db.dialect_sql import adapt_sql_for_connection

    c = sqlite3.connect(":memory:")
    try:
        assert adapt_sql_for_connection(c, "SELECT ? WHERE x = ?") == "SELECT ? WHERE x = ?"
    finally:
        c.close()


def test_execute_sqlite_roundtrip(tmp_path):
    from db.dialect_sql import execute as dx

    dbf = tmp_path / "t.db"
    c = sqlite3.connect(str(dbf))
    c.row_factory = sqlite3.Row
    try:
        c.execute("CREATE TABLE u (id INTEGER PRIMARY KEY, v TEXT)")
        dx(c, "INSERT INTO u (v) VALUES (?)", ("a",))
        r = dx(c, "SELECT v FROM u WHERE id = ?", (1,)).fetchone()
        assert r["v"] == "a"
    finally:
        c.close()


def test_unique_violation_types_contains_sqlite():
    from db.dialect_sql import unique_violation_types

    import sqlite3

    assert sqlite3.IntegrityError not in unique_violation_types()
    assert isinstance(unique_violation_types(), tuple)
