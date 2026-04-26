# -*- coding: utf-8 -*-
"""Пароль логин ↔ platform uuid және хатым (114 сүре) серверлік сақтау."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import is_psycopg_connection, is_sqlite_connection


def ensure_user_data_tables(conn: Any) -> None:
    if is_sqlite_connection(conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS platform_password_logins (
                login_key TEXT PRIMARY KEY NOT NULL,
                platform_user_id TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (platform_user_id) REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS platform_hatim_read (
                platform_user_id TEXT PRIMARY KEY NOT NULL,
                surahs_json TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (platform_user_id) REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE
            )
            """
        )
        return
    if is_psycopg_connection(conn):
        # platform_identities.platform_user_id — UUID (PostgreSQL bootstrap)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS platform_password_logins (
                login_key TEXT PRIMARY KEY NOT NULL,
                platform_user_id UUID NOT NULL UNIQUE REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS platform_hatim_read (
                platform_user_id UUID PRIMARY KEY NOT NULL REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE,
                surahs_json TEXT NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        return
    raise TypeError(f"Unsupported DB connection: {type(conn)!r}")
