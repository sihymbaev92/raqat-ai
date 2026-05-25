# -*- coding: utf-8 -*-
"""Жеке отбасылық шежіре — CRUD + ancestor/descendant обход."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import execute
from db.family_tree_schema import ensure_family_tree_tables
from db.genealogy_uuid import generate_uuidv7

VALID_RELATIONS = frozenset({"father", "mother"})
VALID_GENDERS = frozenset({"male", "female", "unknown"})


def _row_person(row: Any) -> dict[str, Any]:
    if isinstance(row, dict):
        return {
            "id": row["id"],
            "name_kk": row["name_kk"],
            "gender": row["gender"],
            "birth_year": row.get("birth_year"),
            "death_year": row.get("death_year"),
            "clan_slug": row.get("clan_slug"),
            "notes_kk": row.get("notes_kk"),
        }
    return {
        "id": row[0],
        "name_kk": row[1],
        "gender": row[2],
        "birth_year": row[3],
        "death_year": row[4],
        "clan_slug": row[5],
        "notes_kk": row[6],
    }


def ensure_tables(conn: Any) -> None:
    ensure_family_tree_tables(conn)


def get_or_create_tree(conn: Any, platform_user_id: str) -> dict[str, Any]:
    pid = (platform_user_id or "").strip()
    if not pid:
        raise ValueError("empty_platform_user_id")
    row = execute(
        conn,
        """
        SELECT id, platform_user_id, self_person_id
        FROM family_trees WHERE platform_user_id = ? LIMIT 1
        """,
        (pid,),
    ).fetchone()
    if row:
        if isinstance(row, dict):
            return {
                "id": row["id"],
                "platform_user_id": row["platform_user_id"],
                "self_person_id": row.get("self_person_id"),
            }
        return {"id": row[0], "platform_user_id": row[1], "self_person_id": row[2]}
    tree_id = str(generate_uuidv7())
    execute(
        conn,
        """
        INSERT INTO family_trees (id, platform_user_id, self_person_id, updated_at)
        VALUES (?, ?, NULL, datetime('now'))
        """,
        (tree_id, pid),
    )
    return {"id": tree_id, "platform_user_id": pid, "self_person_id": None}


def _get_person_in_tree(conn: Any, tree_id: str, person_id: str) -> dict[str, Any] | None:
    row = execute(
        conn,
        """
        SELECT id, name_kk, gender, birth_year, death_year, clan_slug, notes_kk
        FROM family_persons
        WHERE tree_id = ? AND id = ? LIMIT 1
        """,
        (tree_id, person_id),
    ).fetchone()
    return _row_person(row) if row else None


def _parents_of(conn: Any, tree_id: str, child_id: str) -> list[dict[str, Any]]:
    rows = execute(
        conn,
        """
        SELECT p.id, p.name_kk, p.gender, p.birth_year, p.death_year, p.clan_slug, p.notes_kk,
               e.relation
        FROM family_edges e
        JOIN family_persons p ON p.id = e.parent_id
        WHERE e.tree_id = ? AND e.child_id = ?
        ORDER BY CASE e.relation WHEN 'father' THEN 0 WHEN 'mother' THEN 1 ELSE 2 END
        """,
        (tree_id, child_id),
    ).fetchall()
    out: list[dict[str, Any]] = []
    for r in rows:
        if isinstance(r, dict):
            person = {
                "id": r["id"],
                "name_kk": r["name_kk"],
                "gender": r["gender"],
                "birth_year": r.get("birth_year"),
                "death_year": r.get("death_year"),
                "clan_slug": r.get("clan_slug"),
                "notes_kk": r.get("notes_kk"),
                "relation": r["relation"],
            }
        else:
            person = {
                "id": r[0],
                "name_kk": r[1],
                "gender": r[2],
                "birth_year": r[3],
                "death_year": r[4],
                "clan_slug": r[5],
                "notes_kk": r[6],
                "relation": r[7],
            }
        out.append(person)
    return out


def _children_of(conn: Any, tree_id: str, parent_id: str) -> list[dict[str, Any]]:
    rows = execute(
        conn,
        """
        SELECT p.id, p.name_kk, p.gender, p.birth_year, p.death_year, p.clan_slug, p.notes_kk
        FROM family_edges e
        JOIN family_persons p ON p.id = e.child_id
        WHERE e.tree_id = ? AND e.parent_id = ?
        ORDER BY p.name_kk
        """,
        (tree_id, parent_id),
    ).fetchall()
    return [_row_person(r) for r in rows]


def collect_ancestors(
    conn: Any, tree_id: str, start_id: str, *, max_depth: int = 12
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    visited: set[str] = {start_id}
    frontier = [start_id]
    depth = 0
    while frontier and depth < max_depth:
        nxt: list[str] = []
        for cid in frontier:
            for parent in _parents_of(conn, tree_id, cid):
                pid = parent["id"]
                if pid in visited:
                    continue
                visited.add(pid)
                entry = dict(parent)
                entry["depth"] = depth + 1
                result.append(entry)
                nxt.append(pid)
        frontier = nxt
        depth += 1
    result.sort(key=lambda x: (x["depth"], x.get("relation") or ""))
    return result


def collect_descendants(
    conn: Any, tree_id: str, start_id: str, *, max_depth: int = 8
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    visited: set[str] = {start_id}
    frontier = [start_id]
    depth = 0
    while frontier and depth < max_depth:
        nxt: list[str] = []
        for pid in frontier:
            for child in _children_of(conn, tree_id, pid):
                cid = child["id"]
                if cid in visited:
                    continue
                visited.add(cid)
                entry = dict(child)
                entry["depth"] = depth + 1
                result.append(entry)
                nxt.append(cid)
        frontier = nxt
        depth += 1
    result.sort(key=lambda x: (x["depth"], x["name_kk"]))
    return result


def get_tree_view(conn: Any, platform_user_id: str) -> dict[str, Any]:
    tree = get_or_create_tree(conn, platform_user_id)
    tree_id = tree["id"]
    self_id = tree.get("self_person_id")
    if not self_id:
        return {
            "tree_id": tree_id,
            "has_self": False,
            "self": None,
            "parents": [],
            "ancestors": [],
            "descendants": [],
        }
    self_person = _get_person_in_tree(conn, tree_id, self_id)
    if not self_person:
        return {
            "tree_id": tree_id,
            "has_self": False,
            "self": None,
            "parents": [],
            "ancestors": [],
            "descendants": [],
        }
    self_person = dict(self_person)
    self_person["is_self"] = True
    parents = _parents_of(conn, tree_id, self_id)
    ancestors = collect_ancestors(conn, tree_id, self_id)
    descendants = collect_descendants(conn, tree_id, self_id)
    return {
        "tree_id": tree_id,
        "has_self": True,
        "self": self_person,
        "parents": parents,
        "ancestors": ancestors,
        "descendants": descendants,
    }


def upsert_self_person(
    conn: Any,
    platform_user_id: str,
    *,
    name_kk: str,
    gender: str = "unknown",
    birth_year: int | None = None,
    death_year: int | None = None,
    clan_slug: str | None = None,
    notes_kk: str | None = None,
) -> dict[str, Any]:
    name = (name_kk or "").strip()
    if not name:
        raise ValueError("name_required")
    g = (gender or "unknown").strip().lower()
    if g not in VALID_GENDERS:
        raise ValueError("invalid_gender")
    tree = get_or_create_tree(conn, platform_user_id)
    tree_id = tree["id"]
    clan = (clan_slug or "").strip().lower() or None
    if tree.get("self_person_id"):
        person_id = tree["self_person_id"]
        execute(
            conn,
            """
            UPDATE family_persons
            SET name_kk = ?, gender = ?, birth_year = ?, death_year = ?,
                clan_slug = ?, notes_kk = ?, updated_at = datetime('now')
            WHERE id = ? AND tree_id = ?
            """,
            (name, g, birth_year, death_year, clan, notes_kk, person_id, tree_id),
        )
    else:
        person_id = str(generate_uuidv7())
        execute(
            conn,
            """
            INSERT INTO family_persons (
                id, tree_id, name_kk, gender, birth_year, death_year, clan_slug, notes_kk, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (person_id, tree_id, name, g, birth_year, death_year, clan, notes_kk),
        )
        execute(
            conn,
            """
            UPDATE family_trees
            SET self_person_id = ?, updated_at = datetime('now')
            WHERE id = ?
            """,
            (person_id, tree_id),
        )
    person = _get_person_in_tree(conn, tree_id, person_id)
    assert person is not None
    return person


def add_related_person(
    conn: Any,
    platform_user_id: str,
    *,
    name_kk: str,
    relation: str,
    relative_to_id: str | None = None,
    gender: str = "unknown",
    birth_year: int | None = None,
    death_year: int | None = None,
    clan_slug: str | None = None,
    notes_kk: str | None = None,
) -> dict[str, Any]:
    rel = (relation or "").strip().lower()
    if rel not in VALID_RELATIONS and rel != "child":
        raise ValueError("invalid_relation")
    name = (name_kk or "").strip()
    if not name:
        raise ValueError("name_required")
    g = (gender or "unknown").strip().lower()
    if g not in VALID_GENDERS:
        raise ValueError("invalid_gender")

    tree = get_or_create_tree(conn, platform_user_id)
    tree_id = tree["id"]
    anchor_id = relative_to_id or tree.get("self_person_id")
    if not anchor_id:
        raise ValueError("self_required")
    if not _get_person_in_tree(conn, tree_id, anchor_id):
        raise ValueError("person_not_in_tree")

    person_id = str(generate_uuidv7())
    clan = (clan_slug or "").strip().lower() or None
    execute(
        conn,
        """
        INSERT INTO family_persons (
            id, tree_id, name_kk, gender, birth_year, death_year, clan_slug, notes_kk, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """,
        (person_id, tree_id, name, g, birth_year, death_year, clan, notes_kk),
    )

    if rel == "child":
        anchor = _get_person_in_tree(conn, tree_id, anchor_id)
        if not anchor:
            raise ValueError("person_not_in_tree")
        ag = anchor.get("gender") or "unknown"
        if ag == "female":
            edge_rel = "mother"
        elif ag == "male":
            edge_rel = "father"
        else:
            edge_rel = "father"
        execute(
            conn,
            """
            INSERT INTO family_edges (tree_id, parent_id, child_id, relation)
            VALUES (?, ?, ?, ?)
            """,
            (tree_id, anchor_id, person_id, edge_rel),
        )
    else:
        parent_id, child_id = person_id, anchor_id
        taken = execute(
            conn,
            """
            SELECT 1 FROM family_edges
            WHERE tree_id = ? AND child_id = ? AND relation = ? LIMIT 1
            """,
            (tree_id, child_id, rel),
        ).fetchone()
        if taken:
            raise ValueError("parent_slot_taken")
        execute(
            conn,
            """
            INSERT INTO family_edges (tree_id, parent_id, child_id, relation)
            VALUES (?, ?, ?, ?)
            """,
            (tree_id, parent_id, child_id, rel),
        )

    execute(
        conn,
        "UPDATE family_trees SET updated_at = datetime('now') WHERE id = ?",
        (tree_id,),
    )
    person = _get_person_in_tree(conn, tree_id, person_id)
    assert person is not None
    return person
