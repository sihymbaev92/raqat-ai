# -*- coding: utf-8 -*-
"""Synthetic genealogy tree for perf tests."""
from __future__ import annotations

from typing import Any

from db.genealogy.path_updater import build_path, insert_closure_for_new_node, validate_slug
from db.genealogy_uuid import generate_uuidv7


def insert_synthetic_tree(conn: Any, total_nodes: int, *, branch_factor: int = 5) -> int:
    if total_nodes < 1:
        return 0

    root_slug = "perf_root"
    row = conn.execute(
        "SELECT id, path::text AS path FROM genealogy_nodes WHERE slug = %s LIMIT 1", (root_slug,)
    ).fetchone()
    if not row:
        root_id = generate_uuidv7()
        conn.execute(
            """
            INSERT INTO genealogy_nodes (id, slug, name_kk, level, path, sort_order, is_published)
            VALUES (%s, %s, %s, 1, %s::ltree, 0, FALSE)
            """,
            (root_id, root_slug, "Perf root", root_slug),
        )
        insert_closure_for_new_node(conn, root_id, None)
        root_id_val = root_id
        root_path = root_slug
    else:
        root_id_val = row["id"] if isinstance(row, dict) else row[0]
        root_path = row["path"] if isinstance(row, dict) else row[1]

    existing = conn.execute(
        "SELECT COUNT(*) AS c FROM genealogy_nodes n WHERE n.path <@ %s::ltree",
        (root_slug,),
    ).fetchone()
    count = int(existing["c"] if isinstance(existing, dict) else existing[0])
    if count >= total_nodes + 1:
        return 0

    created = 0
    frontier: list[tuple[Any, str, int]] = [(root_id_val, root_path, 2)]
    idx = 0
    while created < total_nodes and frontier:
        parent_id, parent_path, level = frontier.pop(0)
        for _ in range(branch_factor):
            if created >= total_nodes:
                break
            idx += 1
            slug = validate_slug(f"perf_{idx:06d}")
            path = build_path(parent_path, slug)
            node_id = generate_uuidv7()
            conn.execute(
                """
                INSERT INTO genealogy_nodes (id, slug, name_kk, level, path, sort_order, is_published)
                VALUES (%s, %s, %s, %s, %s::ltree, %s, FALSE)
                ON CONFLICT (slug) DO NOTHING
                """,
                (node_id, slug, f"Perf {idx}", min(level, 5), path, idx),
            )
            conn.execute(
                """
                INSERT INTO genealogy_edges (parent_id, child_id, source_key)
                VALUES (%s, %s, 'nas_ethnography_kz')
                ON CONFLICT DO NOTHING
                """,
                (parent_id, node_id),
            )
            insert_closure_for_new_node(conn, node_id, parent_id)
            frontier.append((node_id, path, level + 1))
            created += 1
    return created
