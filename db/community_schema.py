# -*- coding: utf-8 -*-
"""Қауымдық дұға кестелері (SQLite + PostgreSQL) — idempotent ensure."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import is_psycopg_connection, is_sqlite_connection


def ensure_community_tables(conn: Any) -> None:
    if is_sqlite_connection(conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS community_dua (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                body TEXT NOT NULL,
                client_id TEXT NOT NULL,
                amen_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS community_dua_amen (
                dua_id INTEGER NOT NULL,
                client_id TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY (dua_id, client_id),
                FOREIGN KEY (dua_id) REFERENCES community_dua(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_community_dua_created ON community_dua(created_at)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_community_dua_client ON community_dua(client_id)"
        )
        return
    if is_psycopg_connection(conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS community_dua (
                id BIGSERIAL PRIMARY KEY,
                body TEXT NOT NULL,
                client_id TEXT NOT NULL,
                amen_count BIGINT NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS community_dua_amen (
                dua_id BIGINT NOT NULL REFERENCES community_dua(id) ON DELETE CASCADE,
                client_id TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (dua_id, client_id)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_community_dua_created ON community_dua (created_at DESC)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_community_dua_client ON community_dua (client_id)"
        )
        return
    raise TypeError(f"Unsupported DB connection: {type(conn)!r}")
