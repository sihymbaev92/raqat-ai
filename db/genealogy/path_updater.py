# -*- coding: utf-8 -*-
"""LTREE path + closure table maintenance."""
from __future__ import annotations

import re
from typing import Any
from uuid import UUID

from db.dialect_sql import execute, is_psycopg_connection

_SLUG_RE = re.compile(r"^[a-z0-9_]+$")


def validate_slug(slug: str) -> str:
    s = (slug or "").strip().lower()
    if not _SLUG_RE.match(s):
        raise ValueError(f"invalid genealogy slug (ltree label): {slug!r}")
    return s


def build_path(parent_path: str | None, slug: str) -> str:
    slug = validate_slug(slug)
    if not parent_path:
        return slug
    parent_path = parent_path.strip().strip(".")
    return f"{parent_path}.{slug}"


def insert_closure_for_new_node(conn: Any, node_id: UUID, parent_id: UUID | None) -> None:
    """Self row + copy parent ancestor chain."""
    if not is_psycopg_connection(conn):
        raise TypeError("closure tables require PostgreSQL")
    execute(
        conn,
        """
        INSERT INTO genealogy_closure (ancestor_id, descendant_id, depth)
        VALUES (%s, %s, 0)
        ON CONFLICT (ancestor_id, descendant_id) DO NOTHING
        """,
        (node_id, node_id),
    )
    if parent_id is None:
        return
    execute(
        conn,
        """
        INSERT INTO genealogy_closure (ancestor_id, descendant_id, depth)
        SELECT c.ancestor_id, %s, c.depth + 1
        FROM genealogy_closure c
        WHERE c.descendant_id = %s
        ON CONFLICT (ancestor_id, descendant_id) DO NOTHING
        """,
        (node_id, parent_id),
    )


def rebuild_subtree_paths_and_closure(conn: Any, root_slug: str) -> int:
    """
    Async job entry: BFS from root_slug, recompute path + full closure under root.
    Returns nodes updated.
    """
    if not is_psycopg_connection(conn):
        raise TypeError("path rebuild requires PostgreSQL")
    root_slug = validate_slug(root_slug)
    root = conn.execute(
        "SELECT id, slug, path FROM genealogy_nodes WHERE slug = %s LIMIT 1",
        (root_slug,),
    ).fetchone()
    if not root:
        return 0
    root_id = root["id"] if isinstance(root, dict) else root[0]

    execute(
        conn,
        """
        DELETE FROM genealogy_closure
        WHERE descendant_id IN (
          SELECT n.id FROM genealogy_nodes n
          WHERE n.path <@ %s::ltree OR n.slug = %s
        )
        """,
        (root_slug, root_slug),
    )

    root_path = root["path"] if isinstance(root, dict) else root[2]
    bfs: list[tuple[UUID, str, UUID | None]] = [(root_id, root_slug, None)]
    updated = 0
    seen: set[UUID] = set()

    while bfs:
        node_id, slug, parent_id = bfs.pop(0)
        if node_id in seen:
            continue
        seen.add(node_id)

        parent_path: str | None = None
        if parent_id is not None:
            prow = conn.execute(
                "SELECT path FROM genealogy_nodes WHERE id = %s LIMIT 1", (parent_id,)
            ).fetchone()
            if prow:
                parent_path = prow["path"] if isinstance(prow, dict) else prow[0]
        elif node_id == root_id:
            parent_path = None
        else:
            parent_path = root_path.rsplit(".", 1)[0] if "." in str(root_path) else None

        new_path = build_path(parent_path, slug)
        execute(
            conn,
            "UPDATE genealogy_nodes SET path = %s::ltree, updated_at = NOW() WHERE id = %s",
            (new_path, node_id),
        )
        updated += 1

        execute(
            conn,
            """
            INSERT INTO genealogy_closure (ancestor_id, descendant_id, depth)
            VALUES (%s, %s, 0)
            ON CONFLICT DO NOTHING
            """,
            (node_id, node_id),
        )
        if parent_id is not None:
            execute(
                conn,
                """
                INSERT INTO genealogy_closure (ancestor_id, descendant_id, depth)
                SELECT c.ancestor_id, %s, c.depth + 1
                FROM genealogy_closure c
                WHERE c.descendant_id = %s
                ON CONFLICT DO NOTHING
                """,
                (node_id, parent_id),
            )

        child_rows = conn.execute(
            """
            SELECT e.child_id, n.slug
            FROM genealogy_edges e
            INNER JOIN genealogy_nodes n ON n.id = e.child_id
            WHERE e.parent_id = %s
            ORDER BY n.sort_order, n.slug
            """,
            (node_id,),
        ).fetchall()
        for crow in child_rows:
            cid = crow["child_id"] if isinstance(crow, dict) else crow[0]
            cslug = crow["slug"] if isinstance(crow, dict) else crow[1]
            bfs.append((cid, cslug, node_id))

    return updated
