# -*- coding: utf-8 -*-
"""Genealogy P2 — атақты/қазіргі тұлғалар (руға байLANған, дереккөзбен)."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import is_psycopg_connection, is_sqlite_connection


def ensure_genealogy_persons_tables(conn: Any) -> None:
    if is_sqlite_connection(conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS genealogy_persons (
                id TEXT PRIMARY KEY NOT NULL,
                clan_slug TEXT NOT NULL,
                name_kk TEXT NOT NULL,
                name_lat TEXT NULL,
                birth_year INTEGER NULL,
                death_year INTEGER NULL,
                era TEXT NOT NULL DEFAULT 'historical'
                    CHECK (era IN ('historical', 'contemporary')),
                role_kk TEXT NULL,
                bio_kk TEXT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_published INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (clan_slug) REFERENCES genealogy_clans(id) ON DELETE RESTRICT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS genealogy_person_source_refs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                person_id TEXT NOT NULL,
                source_key TEXT NOT NULL,
                citation_note TEXT NULL,
                page_or_section TEXT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (person_id) REFERENCES genealogy_persons(id) ON DELETE CASCADE,
                UNIQUE (person_id, source_key)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_genealogy_persons_clan "
            "ON genealogy_persons(clan_slug, sort_order)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_genealogy_persons_era "
            "ON genealogy_persons(era, sort_order)"
        )
        return

    if is_psycopg_connection(conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS genealogy_persons (
                id TEXT PRIMARY KEY NOT NULL,
                clan_slug TEXT NOT NULL REFERENCES genealogy_clans(id) ON DELETE RESTRICT,
                name_kk TEXT NOT NULL,
                name_lat TEXT NULL,
                birth_year SMALLINT NULL,
                death_year SMALLINT NULL,
                era TEXT NOT NULL DEFAULT 'historical'
                    CHECK (era IN ('historical', 'contemporary')),
                role_kk TEXT NULL,
                bio_kk TEXT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_published BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS genealogy_person_source_refs (
                id BIGSERIAL PRIMARY KEY,
                person_id TEXT NOT NULL REFERENCES genealogy_persons(id) ON DELETE CASCADE,
                source_key TEXT NOT NULL,
                citation_note TEXT NULL,
                page_or_section TEXT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (person_id, source_key)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_genealogy_persons_clan "
            "ON genealogy_persons(clan_slug, sort_order)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_genealogy_persons_era "
            "ON genealogy_persons(era, sort_order)"
        )
        return

    raise TypeError(f"Unsupported DB connection: {type(conn)!r}")
