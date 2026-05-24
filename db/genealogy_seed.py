# -*- coding: utf-8 -*-
"""GENEALOGY-P0 Day 2: 14-node test hierarchy upsert (15th — sprint buffer / future root)."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import execute, is_psycopg_connection, is_sqlite_connection

# (id, parent_id, level, name_kk, sort_order)
GENEALOGY_P0_CLANS: list[tuple[str, str | None, int, str, int]] = [
    ("uly_zhuz", None, 1, "Ұлы жүз", 10),
    ("uisin", "uly_zhuz", 2, "Үйсін", 20),
    ("dulat", "uisin", 3, "Дулат", 30),
    ("alban", "uly_zhuz", 2, "Албан", 40),
    ("orta_zhuz", None, 1, "Орта жүз", 50),
    ("argyn", "orta_zhuz", 2, "Арғын", 60),
    ("karakesek", "argyn", 3, "Қаракесек", 70),
    ("kuandyk", "argyn", 3, "Қуандық", 80),
    ("tortuyl", "argyn", 3, "Төртуыл", 90),
    ("nayman", "orta_zhuz", 2, "Найман", 100),
    ("kishi_zhuz", None, 1, "Кіші жүз", 110),
    ("alshyn", "kishi_zhuz", 2, "Алшын", 120),
    ("alimuly", "alshyn", 3, "Әлімұлы", 130),
    ("baiuly", "alshyn", 3, "Байұлы", 140),
]

DEFAULT_SOURCE_REFS: list[tuple[str, str, str | None]] = [
    ("uly_zhuz", "nas_ethnography_kz", "Жүз деңгейі"),
    ("orta_zhuz", "nas_ethnography_kz", "Жүз деңгейі"),
    ("kishi_zhuz", "nas_ethnography_kz", "Жүз деңгейі"),
    ("uisin", "mashhur_jusip_shezhire", None),
    ("dulat", "mashhur_jusip_shezhire", None),
    ("argyn", "shakarim_shezhire", None),
    ("karakesek", "mashhur_jusip_shezhire", None),
    ("alshyn", "mashhur_jusip_shezhire", None),
    ("alimuly", "mashhur_jusip_shezhire", None),
    ("baiuly", "mashhur_jusip_shezhire", None),
]


def upsert_genealogy_p0_clans(conn: Any) -> int:
    """Idempotent upsert — parent rows алдымен (sort_order бойынша)."""
    count = 0
    for clan_id, parent_id, level, name_kk, sort_order in GENEALOGY_P0_CLANS:
        if is_sqlite_connection(conn):
            execute(
                conn,
                """
                INSERT INTO genealogy_clans (
                    id, parent_id, level, name_kk, sort_order, is_published, updated_at
                ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
                ON CONFLICT(id) DO UPDATE SET
                    parent_id = excluded.parent_id,
                    level = excluded.level,
                    name_kk = excluded.name_kk,
                    sort_order = excluded.sort_order,
                    updated_at = datetime('now')
                """,
                (clan_id, parent_id, level, name_kk, sort_order),
            )
        elif is_psycopg_connection(conn):
            execute(
                conn,
                """
                INSERT INTO genealogy_clans (
                    id, parent_id, level, name_kk, sort_order, is_published, updated_at
                ) VALUES (%s, %s, %s, %s, %s, TRUE, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    parent_id = EXCLUDED.parent_id,
                    level = EXCLUDED.level,
                    name_kk = EXCLUDED.name_kk,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = NOW()
                """,
                (clan_id, parent_id, level, name_kk, sort_order),
            )
        else:
            raise TypeError(f"Unsupported connection: {type(conn)!r}")
        count += 1
    return count


def upsert_genealogy_default_source_refs(conn: Any) -> int:
    count = 0
    for clan_id, source_key, page in DEFAULT_SOURCE_REFS:
        if is_sqlite_connection(conn):
            execute(
                conn,
                """
                INSERT OR IGNORE INTO genealogy_source_refs (
                    clan_id, source_key, page_or_section, sort_order
                ) VALUES (?, ?, ?, ?)
                """,
                (clan_id, source_key, page, count),
            )
        elif is_psycopg_connection(conn):
            execute(
                conn,
                """
                INSERT INTO genealogy_source_refs (clan_id, source_key, page_or_section, sort_order)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (clan_id, source_key) DO NOTHING
                """,
                (clan_id, source_key, page, count),
            )
        count += 1
    return count
