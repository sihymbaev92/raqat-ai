# -*- coding: utf-8 -*-
"""Import P0 slug hierarchy into A1 graph (PostgreSQL)."""
from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from db.dialect_sql import execute, is_psycopg_connection
from db.genealogy.cache_manager import get_genealogy_cache_manager
from db.genealogy.cycle_detector import HotSubtreeCycleDetector
from db.genealogy.path_updater import build_path, insert_closure_for_new_node, validate_slug
from db.genealogy_seed import DEFAULT_SOURCE_REFS, GENEALOGY_P0_CLANS
from db.genealogy_uuid import generate_uuidv7

logger = logging.getLogger("raqat.genealogy.import")

_SOURCE_BY_SLUG = {slug: key for slug, key, _ in DEFAULT_SOURCE_REFS}


def _table_exists(conn: Any, name: str) -> bool:
    row = conn.execute(
        """
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = %s LIMIT 1
        """,
        (name,),
    ).fetchone()
    return row is not None


def import_p0_clans_to_a1(conn: Any) -> dict[str, int]:
    """
    Idempotent: upsert nodes/edges/closure from GENEALOGY_P0_CLANS.
    Requires A1 tables on PostgreSQL.
    """
    if not is_psycopg_connection(conn):
        raise TypeError("A1 import requires PostgreSQL")
    if not _table_exists(conn, "genealogy_nodes"):
        raise RuntimeError("genealogy_nodes missing — run alembic upgrade head")

    slug_to_id: dict[str, UUID] = {}
    detector = HotSubtreeCycleDetector(max_depth=4)
    edges_for_detector: list[tuple[UUID, UUID]] = []

    nodes_upserted = 0
    edges_upserted = 0

    for clan in GENEALOGY_P0_CLANS:
        slug = validate_slug(clan.id)
        parent_slug = clan.parent_id
        level = clan.level
        name_kk = clan.name_kk
        name_kk_alt = clan.name_kk_alt
        name_lat = clan.name_lat
        description_kk = clan.description_kk
        sort_order = clan.sort_order
        parent_id: UUID | None = None
        parent_path: str | None = None
        if parent_slug:
            parent_id = slug_to_id.get(parent_slug)
            if parent_id is None:
                raise RuntimeError(f"parent slug not imported yet: {parent_slug}")
            prow = conn.execute(
                "SELECT path FROM genealogy_nodes WHERE id = %s LIMIT 1", (parent_id,)
            ).fetchone()
            parent_path = prow["path"] if isinstance(prow, dict) else prow[0]

        path = build_path(parent_path, slug)

        existing = conn.execute(
            "SELECT id FROM genealogy_nodes WHERE slug = %s LIMIT 1", (slug,)
        ).fetchone()
        if existing:
            node_id = existing["id"] if isinstance(existing, dict) else existing[0]
            execute(
                conn,
                """
                UPDATE genealogy_nodes SET
                  name_kk = %s, name_kk_alt = %s, name_lat = %s, description_kk = %s,
                  level = %s, sort_order = %s, path = %s::ltree,
                  is_published = TRUE, updated_at = NOW()
                WHERE id = %s
                """,
                (name_kk, name_kk_alt, name_lat, description_kk, level, sort_order, path, node_id),
            )
        else:
            node_id = generate_uuidv7()
            execute(
                conn,
                """
                INSERT INTO genealogy_nodes (
                  id, slug, name_kk, name_kk_alt, name_lat, description_kk,
                  level, path, sort_order, is_published
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s::ltree, %s, TRUE)
                """,
                (node_id, slug, name_kk, name_kk_alt, name_lat, description_kk, level, path, sort_order),
            )
            insert_closure_for_new_node(conn, node_id, parent_id)

        slug_to_id[slug] = node_id
        nodes_upserted += 1

        if parent_id is not None:
            detector.load_edges(edges_for_detector)
            if detector.would_create_cycle(parent_id, node_id):
                raise RuntimeError(f"cycle detected importing edge {parent_slug} -> {slug}")
            source_key = _SOURCE_BY_SLUG.get(slug, "nas_ethnography_kz")
            execute(
                conn,
                """
                INSERT INTO genealogy_edges (parent_id, child_id, source_key)
                VALUES (%s, %s, %s)
                ON CONFLICT (parent_id, child_id) DO UPDATE SET
                  source_key = EXCLUDED.source_key
                """,
                (parent_id, node_id, source_key),
            )
            edges_for_detector.append((parent_id, node_id))
            edges_upserted += 1

    prefixes = [validate_slug(c.id) for c in GENEALOGY_P0_CLANS if c.parent_id is None]
    prefixes.append("")
    get_genealogy_cache_manager().invalidate_paths(prefixes)

    logger.info("A1 import done nodes=%s edges=%s", nodes_upserted, edges_upserted)
    return {"nodes": nodes_upserted, "edges": edges_upserted}
