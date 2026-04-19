# -*- coding: utf-8 -*-
"""Google / Apple oauth_subject ↔ тұрақты platform_user_id."""
from __future__ import annotations

import uuid

from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection, is_sqlite_connection
from db.get_db import get_db


def ensure_platform_user_for_oauth(provider: str, oauth_subject: str) -> str:
    """
    provider: «google» | «apple»
    oauth_subject: IdP субъект идентификаторы (sub).
    """
    pv = (provider or "").strip().lower()
    sub = (oauth_subject or "").strip()
    if pv not in ("google", "apple"):
        raise ValueError("invalid_oauth_provider")
    if not sub:
        raise ValueError("empty_oauth_subject")

    with get_db() as conn:
        row = _exec(
            conn,
            """
            SELECT platform_user_id FROM platform_oauth_links
            WHERE provider = ? AND oauth_subject = ?
            LIMIT 1
            """,
            (pv, sub),
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
                INSERT INTO platform_oauth_links (provider, oauth_subject, platform_user_id, created_at)
                VALUES (?, ?, ?, datetime('now'))
                """,
                (pv, sub, pid),
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
                INSERT INTO platform_oauth_links (provider, oauth_subject, platform_user_id, created_at)
                VALUES (%s, %s, %s, NOW())
                """,
                (pv, sub, pid),
            )
            return pid
        raise TypeError(f"Unsupported DB connection: {type(conn)!r}")
