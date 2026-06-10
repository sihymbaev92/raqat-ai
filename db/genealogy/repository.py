# -*- coding: utf-8 -*-
"""Genealogy read repository — A1 PostgreSQL + P0 SQLite fallback."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import is_psycopg_connection, is_sqlite_connection
from db.genealogy.cache_manager import get_genealogy_cache_manager
from db.genealogy.lca_engine import ancestor_slugs_for_node


def _a1_tables_exist(conn: Any) -> bool:
    if is_psycopg_connection(conn):
        row = conn.execute(
            """
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'genealogy_nodes' LIMIT 1
            """
        ).fetchone()
        return row is not None
    return False


def _list_p0_clans(conn: Any, parent_slug: str | None) -> list[dict[str, Any]]:
    from db.dialect_sql import execute

    if parent_slug:
        rows = execute(
            conn,
            """
            SELECT id AS slug, name_kk, name_kk_alt, name_lat, level, sort_order
            FROM genealogy_clans
            WHERE parent_id = ? AND is_published = TRUE
            ORDER BY sort_order, name_kk
            """,
            (parent_slug,),
        ).fetchall()
    else:
        rows = execute(
            conn,
            """
            SELECT id AS slug, name_kk, name_kk_alt, name_lat, level, sort_order
            FROM genealogy_clans
            WHERE parent_id IS NULL AND is_published = TRUE
            ORDER BY sort_order, name_kk
            """,
            (),
        ).fetchall()
    return [_row_to_clan_sqlite(r) for r in rows]


def _get_p0_clan_detail(conn: Any, slug: str) -> dict[str, Any] | None:
    from db.dialect_sql import execute

    row = execute(
        conn,
        """
        SELECT id AS slug, name_kk, name_kk_alt, name_lat, level, sort_order, parent_id, description_kk
        FROM genealogy_clans WHERE id = ? LIMIT 1
        """,
        (slug,),
    ).fetchone()
    if not row:
        return None
    out = _row_to_clan_sqlite(row)
    if isinstance(row, dict):
        out["description_kk"] = row.get("description_kk")
    elif len(row) > 7:
        out["description_kk"] = row[7]
    crumbs: list[str] = []
    pid = row["parent_id"] if isinstance(row, dict) else row[6]
    guard = 0
    while pid and guard < 10:
        guard += 1
        prow = execute(
            conn,
            "SELECT id, parent_id FROM genealogy_clans WHERE id = ? LIMIT 1",
            (pid,),
        ).fetchone()
        if not prow:
            break
        crumbs.insert(0, prow["id"] if isinstance(prow, dict) else prow[0])
        pid = prow["parent_id"] if isinstance(prow, dict) else prow[1]
    out["breadcrumbs"] = crumbs + [slug]
    src_rows = execute(
        conn,
        """
        SELECT source_key, citation_note, page_or_section
        FROM genealogy_source_refs
        WHERE clan_id = ?
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
    out["engine"] = "p0"
    return out


def list_children(conn: Any, parent_slug: str | None) -> list[dict[str, Any]]:
    cache = get_genealogy_cache_manager()
    if parent_slug and cache.is_path_stale(parent_slug):
        pass  # caller may bypass cache; stale flag for future Redis layer

    if is_psycopg_connection(conn) and _a1_tables_exist(conn):
        if parent_slug:
            rows = conn.execute(
                """
                SELECT n.slug, n.name_kk, n.name_kk_alt, n.name_lat, n.level, n.sort_order
                FROM genealogy_edges e
                INNER JOIN genealogy_nodes p ON p.id = e.parent_id
                INNER JOIN genealogy_nodes n ON n.id = e.child_id
                WHERE p.slug = %s AND n.is_published = TRUE
                ORDER BY n.sort_order, n.name_kk
                """,
                (parent_slug,),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT slug, name_kk, name_kk_alt, name_lat, level, sort_order
                FROM genealogy_nodes
                WHERE level = 1 AND is_published = TRUE
                ORDER BY sort_order, name_kk
                """
            ).fetchall()
        return [_row_to_clan(r) for r in rows]

    if is_psycopg_connection(conn) or is_sqlite_connection(conn):
        return _list_p0_clans(conn, parent_slug)

    return []


def get_clan_detail(conn: Any, slug: str) -> dict[str, Any] | None:
    if is_psycopg_connection(conn) and _a1_tables_exist(conn):
        row = conn.execute(
            """
            SELECT id, slug, name_kk, name_kk_alt, name_lat, level, path::text AS path,
                   sort_order, description_kk
            FROM genealogy_nodes
            WHERE slug = %s AND is_published = TRUE
            LIMIT 1
            """,
            (slug,),
        ).fetchone()
        if not row:
            return None
        node_id = row["id"] if isinstance(row, dict) else row[0]
        breadcrumbs = ancestor_slugs_for_node(conn, node_id) + [slug]
        sources = conn.execute(
            """
            SELECT DISTINCT e.source_key, e.citation_note
            FROM genealogy_edges e
            INNER JOIN genealogy_nodes c ON c.id = e.child_id
            WHERE c.slug = %s
            ORDER BY e.source_key
            """,
            (slug,),
        ).fetchall()
        out = _row_to_clan(row)
        out["path"] = row["path"] if isinstance(row, dict) else row[6]
        if isinstance(row, dict):
            out["description_kk"] = row.get("description_kk")
        elif len(row) > 8:
            out["description_kk"] = row[8]
        out["breadcrumbs"] = breadcrumbs
        out["sources"] = [
            {
                "source_key": s["source_key"] if isinstance(s, dict) else s[0],
                "citation_note": s["citation_note"] if isinstance(s, dict) else s[1],
            }
            for s in sources
        ]
        out["engine"] = "a1"
        return out

    if is_psycopg_connection(conn) or is_sqlite_connection(conn):
        return _get_p0_clan_detail(conn, slug)

    return None


def _row_to_clan(row: Any) -> dict[str, Any]:
    if isinstance(row, dict):
        return {
            "slug": row["slug"],
            "name_kk": row["name_kk"],
            "name_kk_alt": row.get("name_kk_alt"),
            "name_lat": row.get("name_lat"),
            "level": int(row["level"]),
            "sort_order": int(row["sort_order"]),
        }
    return {
        "slug": row[0],
        "name_kk": row[1],
        "name_kk_alt": row[2],
        "name_lat": row[3],
        "level": int(row[4]),
        "sort_order": int(row[5]),
    }


def _row_to_clan_sqlite(row: Any) -> dict[str, Any]:
    if isinstance(row, dict):
        return {
            "slug": row["slug"],
            "name_kk": row["name_kk"],
            "name_kk_alt": row.get("name_kk_alt"),
            "name_lat": row.get("name_lat"),
            "level": int(row["level"]),
            "sort_order": int(row["sort_order"]),
        }
    return {
        "slug": row[0],
        "name_kk": row[1],
        "name_kk_alt": row[2],
        "name_lat": row[3],
        "level": int(row[4]),
        "sort_order": int(row[5]),
    }
