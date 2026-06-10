# -*- coding: utf-8 -*-
"""Genealogy persons read repository."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import execute, is_psycopg_connection, is_sqlite_connection


def _row_to_person(row: Any) -> dict[str, Any]:
    if isinstance(row, dict):
        return {
            "slug": row["slug"],
            "clan_slug": row["clan_slug"],
            "name_kk": row["name_kk"],
            "name_lat": row.get("name_lat"),
            "birth_year": row.get("birth_year"),
            "death_year": row.get("death_year"),
            "era": row["era"],
            "role_kk": row.get("role_kk"),
            "bio_kk": row.get("bio_kk"),
            "sort_order": int(row["sort_order"]),
        }
    return {
        "slug": row[0],
        "clan_slug": row[1],
        "name_kk": row[2],
        "name_lat": row[3],
        "birth_year": row[4],
        "death_year": row[5],
        "era": row[6],
        "role_kk": row[7],
        "bio_kk": row[8],
        "sort_order": int(row[9]),
    }


def list_persons_by_clan(conn: Any, clan_slug: str, *, era: str | None = None) -> list[dict[str, Any]]:
    if era:
        rows = execute(
            conn,
            """
            SELECT id AS slug, clan_slug, name_kk, name_lat, birth_year, death_year,
                   era, role_kk, bio_kk, sort_order
            FROM genealogy_persons
            WHERE clan_slug = ? AND era = ? AND is_published = TRUE
            ORDER BY sort_order, name_kk
            """,
            (clan_slug, era),
        ).fetchall()
    else:
        rows = execute(
            conn,
            """
            SELECT id AS slug, clan_slug, name_kk, name_lat, birth_year, death_year,
                   era, role_kk, bio_kk, sort_order
            FROM genealogy_persons
            WHERE clan_slug = ? AND is_published = TRUE
            ORDER BY sort_order, name_kk
            """,
            (clan_slug,),
        ).fetchall()
    return [_row_to_person(r) for r in rows]


def search_persons(conn: Any, query: str, *, limit: int = 40) -> list[dict[str, Any]]:
    q = f"%{query.strip().lower()}%"
    rows = execute(
        conn,
        """
        SELECT id AS slug, clan_slug, name_kk, name_lat, birth_year, death_year,
               era, role_kk, bio_kk, sort_order
        FROM genealogy_persons
        WHERE is_published = TRUE AND (
            LOWER(name_kk) LIKE ? OR LOWER(COALESCE(name_lat, '')) LIKE ?
            OR LOWER(COALESCE(role_kk, '')) LIKE ?
        )
        ORDER BY sort_order, name_kk
        LIMIT ?
        """,
        (q, q, q, limit),
    ).fetchall()
    return [_row_to_person(r) for r in rows]


def get_person_detail(conn: Any, slug: str) -> dict[str, Any] | None:
    row = execute(
        conn,
        """
        SELECT id AS slug, clan_slug, name_kk, name_lat, birth_year, death_year,
               era, role_kk, bio_kk, sort_order
        FROM genealogy_persons WHERE id = ? LIMIT 1
        """,
        (slug,),
    ).fetchone()
    if not row:
        return None
    out = _row_to_person(row)
    src_rows = execute(
        conn,
        """
        SELECT source_key, citation_note, page_or_section
        FROM genealogy_person_source_refs
        WHERE person_id = ?
        ORDER BY sort_order, source_key
        """,
        (slug,),
    ).fetchall()
    out["sources"] = [
        {
            "source_key": s["source_key"] if isinstance(s, dict) else s[0],
            "citation_note": s["citation_note"] if isinstance(s, dict) else s[1],
            "page_or_section": s["page_or_section"] if isinstance(s, dict) else s[2],
        }
        for s in src_rows
    ]
    return out


def persons_table_exists(conn: Any) -> bool:
    if is_psycopg_connection(conn):
        row = conn.execute(
            """
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'genealogy_persons' LIMIT 1
            """
        ).fetchone()
        return row is not None
    if is_sqlite_connection(conn):
        row = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='genealogy_persons' LIMIT 1"
        ).fetchone()
        return row is not None
    return False
