# -*- coding: utf-8 -*-
"""
SQLite мен psycopg арасында қысқа SQL жинақтау: плейсхолдер және уақыт функциясы.

`platform_identity_chat` сияқты модульдер бұрынғыдай `?` жазады; psycopg
қосылғанда execute алдымен SQL дәйекті түрлендіреді.
"""
from __future__ import annotations

import re
from typing import Any


def is_sqlite_connection(conn: Any) -> bool:
    return type(conn).__module__.startswith("sqlite3")


def is_psycopg_connection(conn: Any) -> bool:
    return "psycopg" in type(conn).__module__


def sql_for_postgresql(sql: str) -> str:
    """
    psycopg үшін: SQLite-ға тән конструкцияларды жеңіл түрлендіру + `?` → `%s`.

    Толық автоматты емес — жаңа үлгілер audit арқылы қосылады (`scripts/audit_sql_placeholders.py`).
    """
    out = sql
    out = out.replace(
        "INSERT OR IGNORE INTO revoked_refresh_jti (jti, expires_at) VALUES (?, ?)",
        "INSERT INTO revoked_refresh_jti (jti, expires_at) VALUES (%s, %s) ON CONFLICT (jti) DO NOTHING",
    )
    out = re.sub(
        r"INSERT\s+OR\s+IGNORE\s+INTO\s+user_preferences\s*\(\s*user_id\s*,\s*lang_code\s*,\s*updated_at\s*\)\s*"
        r"VALUES\s*\(\s*\?\s*,\s*\?\s*,\s*datetime\s*\(\s*'now'\s*\)\s*\)",
        "INSERT INTO user_preferences (user_id, lang_code, updated_at) "
        "VALUES (%s, %s, CURRENT_TIMESTAMP) ON CONFLICT (user_id) DO NOTHING",
        out,
        flags=re.IGNORECASE | re.DOTALL,
    )
    out = out.replace("datetime('now')", "CURRENT_TIMESTAMP")
    out = re.sub(r"ON CONFLICT\s*\(\s*([A-Za-z0-9_]+)\s*\)", r"ON CONFLICT (\1)", out)
    if "?" in out:
        out = out.replace("?", "%s")
    return out


def table_names(conn: Any) -> set[str]:
    """Кесте атаулары (кіші әріп): sqlite_master немесе information_schema."""
    def _first_col(row: Any) -> str:
        # sqlite3.Row -> index; psycopg dict_row -> key access.
        try:
            return str(row[0]).lower()
        except Exception:
            if isinstance(row, dict):
                if "name" in row:
                    return str(row["name"]).lower()
                if "table_name" in row:
                    return str(row["table_name"]).lower()
            try:
                return str(next(iter(row.values()))).lower()  # type: ignore[attr-defined]
            except Exception:
                return str(row).lower()

    if is_sqlite_connection(conn):
        rows = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).fetchall()
        return {_first_col(r) for r in rows}
    if is_psycopg_connection(conn):
        rows = conn.execute(
            """
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            """
        ).fetchall()
        return {_first_col(r) for r in rows}
    raise TypeError(f"Unsupported connection for table_names: {type(conn)!r}")


def adapt_sql_for_connection(conn: Any, sql: str) -> str:
    if is_sqlite_connection(conn):
        return sql
    if is_psycopg_connection(conn):
        return sql_for_postgresql(sql)
    return sql


def execute(conn: Any, sql: str, params: tuple | list = ()) -> Any:
    """
    sqlite3: `?` сақталады; psycopg: `%s` + CURRENT_TIMESTAMP.
    Возврат: cursor (sqlite) немесе psycopg Cursor (fetchone/fetchall бар).
    """
    return conn.execute(adapt_sql_for_connection(conn, sql), params)


def unique_violation_types() -> tuple[type[BaseException], ...]:
    """ensure INSERT race үшін except кортежі."""
    out: list[type[BaseException]] = []
    try:
        from psycopg import errors as _e

        out.append(_e.UniqueViolation)
    except ImportError:
        pass
    return tuple(out)
