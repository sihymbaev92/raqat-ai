# -*- coding: utf-8 -*-
"""GENEALOGY-P3: жеке отбасылық шежіре (platform_user → family tree)."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import is_psycopg_connection, is_sqlite_connection


def ensure_family_tree_tables(conn: Any) -> None:
    if is_sqlite_connection(conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS family_trees (
                id TEXT PRIMARY KEY NOT NULL,
                platform_user_id TEXT NOT NULL UNIQUE,
                self_person_id TEXT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS family_persons (
                id TEXT PRIMARY KEY NOT NULL,
                tree_id TEXT NOT NULL,
                name_kk TEXT NOT NULL,
                gender TEXT NOT NULL DEFAULT 'unknown'
                    CHECK (gender IN ('male', 'female', 'unknown')),
                birth_year INTEGER NULL,
                death_year INTEGER NULL,
                clan_slug TEXT NULL,
                notes_kk TEXT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (tree_id) REFERENCES family_trees(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS family_edges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tree_id TEXT NOT NULL,
                parent_id TEXT NOT NULL,
                child_id TEXT NOT NULL,
                relation TEXT NOT NULL CHECK (relation IN ('father', 'mother')),
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (tree_id) REFERENCES family_trees(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES family_persons(id) ON DELETE CASCADE,
                FOREIGN KEY (child_id) REFERENCES family_persons(id) ON DELETE CASCADE,
                UNIQUE (parent_id, child_id),
                UNIQUE (tree_id, child_id, relation)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_family_persons_tree ON family_persons(tree_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_family_edges_tree_child ON family_edges(tree_id, child_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_family_edges_tree_parent ON family_edges(tree_id, parent_id)"
        )
        return

    if is_psycopg_connection(conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS family_trees (
                id TEXT PRIMARY KEY NOT NULL,
                platform_user_id TEXT NOT NULL UNIQUE,
                self_person_id TEXT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS family_persons (
                id TEXT PRIMARY KEY NOT NULL,
                tree_id TEXT NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
                name_kk TEXT NOT NULL,
                gender TEXT NOT NULL DEFAULT 'unknown'
                    CHECK (gender IN ('male', 'female', 'unknown')),
                birth_year SMALLINT NULL,
                death_year SMALLINT NULL,
                clan_slug TEXT NULL,
                notes_kk TEXT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS family_edges (
                id BIGSERIAL PRIMARY KEY,
                tree_id TEXT NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
                parent_id TEXT NOT NULL REFERENCES family_persons(id) ON DELETE CASCADE,
                child_id TEXT NOT NULL REFERENCES family_persons(id) ON DELETE CASCADE,
                relation TEXT NOT NULL CHECK (relation IN ('father', 'mother')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (parent_id, child_id),
                UNIQUE (tree_id, child_id, relation)
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_family_persons_tree ON family_persons(tree_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_family_edges_tree_child ON family_edges(tree_id, child_id)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_family_edges_tree_parent ON family_edges(tree_id, parent_id)"
        )
        return

    raise TypeError(f"Unsupported DB connection: {type(conn)!r}")
