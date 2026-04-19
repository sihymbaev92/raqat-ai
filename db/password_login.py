# -*- coding: utf-8 -*-
"""Пароль логин үшін тұрақты platform_user_id (uuid) — JWT sub сәйкесінше."""
from __future__ import annotations

import uuid

from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection, is_sqlite_connection
from db.get_db import get_db


def ensure_platform_user_for_password_username(raw_username: str) -> str:
    """
    login_key = lower(strip(username)).
    Алғашқы кіру: platform_identities + platform_password_logins жолы.
    """
    key = (raw_username or "").strip().lower()
    if not key:
        raise ValueError("empty_username")

    with get_db() as conn:
        row = _exec(
            conn,
            "SELECT platform_user_id FROM platform_password_logins WHERE login_key = ? LIMIT 1",
            (key,),
        ).fetchone()
        if row:
            try:
                return str(row["platform_user_id"])
            except Exception:
                return str(row[0])

        pid = str(uuid.uuid4())
        if is_sqlite_connection(conn):
            _exec(
                conn,
                """
                INSERT INTO platform_identities (platform_user_id, telegram_user_id, created_at, updated_at)
                VALUES (?, NULL, datetime('now'), datetime('now'))
                """,
                (pid,),
            )
            _exec(
                conn,
                """
                INSERT INTO platform_password_logins (login_key, platform_user_id, created_at)
                VALUES (?, ?, datetime('now'))
                """,
                (key, pid),
            )
            return pid
        if is_psycopg_connection(conn):
            conn.execute(
                """
                INSERT INTO platform_identities (platform_user_id, telegram_user_id, created_at, updated_at)
                VALUES (%s, NULL, NOW(), NOW())
                """,
                (pid,),
            )
            conn.execute(
                """
                INSERT INTO platform_password_logins (login_key, platform_user_id, created_at)
                VALUES (%s, %s, NOW())
                """,
                (key, pid),
            )
            return pid
        raise TypeError(f"Unsupported DB connection: {type(conn)!r}")
