# -*- coding: utf-8 -*-
"""Қазақ шежіресі (genealogy) — иерархиялық ру ағашы (SQLite + PostgreSQL)."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import is_psycopg_connection, is_sqlite_connection


def ensure_genealogy_tables(conn: Any) -> None:
    """DDL: genealogy_clans + genealogy_source_refs."""
    if is_sqlite_connection(conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS genealogy_clans (
                id TEXT PRIMARY KEY NOT NULL,
                parent_id TEXT NULL,
                level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
                name_kk TEXT NOT NULL,
                name_kk_alt TEXT NULL,
                name_lat TEXT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                description_kk TEXT NULL,
                is_published INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (parent_id) REFERENCES genealogy_clans(id) ON DELETE RESTRICT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS genealogy_source_refs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clan_id TEXT NOT NULL,
                source_key TEXT NOT NULL,
                citation_note TEXT NULL,
                page_or_section TEXT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (clan_id) REFERENCES genealogy_clans(id) ON DELETE CASCADE,
                UNIQUE (clan_id, source_key)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_genealogy_clans_parent "
            "ON genealogy_clans(parent_id, sort_order)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_genealogy_clans_level "
            "ON genealogy_clans(level, sort_order)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_genealogy_source_refs_clan "
            "ON genealogy_source_refs(clan_id, sort_order)"
        )
        return

    if is_psycopg_connection(conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS genealogy_clans (
                id TEXT PRIMARY KEY NOT NULL,
                parent_id TEXT NULL REFERENCES genealogy_clans(id) ON DELETE RESTRICT,
                level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
                name_kk TEXT NOT NULL,
                name_kk_alt TEXT NULL,
                name_lat TEXT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                description_kk TEXT NULL,
                is_published BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS genealogy_source_refs (
                id BIGSERIAL PRIMARY KEY,
                clan_id TEXT NOT NULL REFERENCES genealogy_clans(id) ON DELETE CASCADE,
                source_key TEXT NOT NULL,
                citation_note TEXT NULL,
                page_or_section TEXT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (clan_id, source_key)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_genealogy_clans_parent "
            "ON genealogy_clans(parent_id, sort_order)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_genealogy_clans_level "
            "ON genealogy_clans(level, sort_order)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_genealogy_source_refs_clan "
            "ON genealogy_source_refs(clan_id, sort_order)"
        )
        return

    raise TypeError(f"Unsupported DB connection: {type(conn)!r}")
