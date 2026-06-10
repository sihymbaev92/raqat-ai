# -*- coding: utf-8 -*-
"""LCA via closure table."""
from __future__ import annotations

from typing import Any
from uuid import UUID


def find_lca_uuid(conn: Any, node_a: UUID, node_b: UUID) -> UUID | None:
    """Lowest common ancestor — max combined depth from closure rows."""
    row = conn.execute(
        """
        SELECT a.ancestor_id AS lca_id
        FROM genealogy_closure a
        INNER JOIN genealogy_closure b
          ON a.ancestor_id = b.ancestor_id
        WHERE a.descendant_id = %s AND b.descendant_id = %s
        ORDER BY (a.depth + b.depth) DESC
        LIMIT 1
        """,
        (node_a, node_b),
    ).fetchone()
    if not row:
        return None
    if isinstance(row, dict):
        return row.get("lca_id")
    return row[0]


def ancestor_slugs_for_node(conn: Any, node_id: UUID) -> list[str]:
    rows = conn.execute(
        """
        SELECT n.slug
        FROM genealogy_closure c
        INNER JOIN genealogy_nodes n ON n.id = c.ancestor_id
        WHERE c.descendant_id = %s AND c.depth > 0
        ORDER BY c.depth DESC
        """,
        (node_id,),
    ).fetchall()
    out: list[str] = []
    for row in rows:
        out.append(row["slug"] if isinstance(row, dict) else row[0])
    return out
