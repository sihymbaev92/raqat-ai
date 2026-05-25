# -*- coding: utf-8 -*-
"""db.family_tree.repository — SQLite unit tests."""
from __future__ import annotations

import sqlite3

from db.family_tree.repository import (
    add_related_person,
    collect_ancestors,
    get_tree_view,
    upsert_self_person,
)
from db.family_tree_schema import ensure_family_tree_tables


def _conn(tmp_path):
    db = tmp_path / "family_tree.db"
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    ensure_family_tree_tables(conn)
    return conn


def test_family_tree_repository_flow(tmp_path):
    conn = _conn(tmp_path)
    pid = "user-test-001"
    upsert_self_person(conn, pid, name_kk="Жасulan", gender="male", clan_slug="argyn")
    view = get_tree_view(conn, pid)
    assert view["has_self"] is True
    assert view["self"]["name_kk"] == "Жасulan"

    add_related_person(conn, pid, name_kk="Әкем", relation="father", gender="male")
    add_related_person(conn, pid, name_kk="Анам", relation="mother", gender="female")
    father = next(p for p in get_tree_view(conn, pid)["parents"] if p["relation"] == "father")
    add_related_person(
        conn,
        pid,
        name_kk="Атам",
        relation="father",
        gender="male",
        relative_to_id=father["id"],
    )
    add_related_person(conn, pid, name_kk="Балам", relation="child", gender="male")

    final = get_tree_view(conn, pid)
    assert len(final["parents"]) == 2
    assert len(final["descendants"]) == 1
    assert len(collect_ancestors(conn, final["tree_id"], final["self"]["id"])) >= 3
    conn.close()


def test_family_tree_parent_slot_taken(tmp_path):
    conn = _conn(tmp_path)
    pid = "user-test-002"
    upsert_self_person(conn, pid, name_kk="Мен", gender="male")
    add_related_person(conn, pid, name_kk="Әкем", relation="father", gender="male")
    try:
        add_related_person(conn, pid, name_kk="Екінші әке", relation="father", gender="male")
        assert False, "expected parent_slot_taken"
    except ValueError as e:
        assert str(e) == "parent_slot_taken"
    conn.close()
