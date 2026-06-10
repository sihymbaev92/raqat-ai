# -*- coding: utf-8 -*-
"""replace_tree_sync_payload — толық ағаш синхрон."""
from __future__ import annotations

import sqlite3

from db.family_tree.repository import export_tree_sync_payload, replace_tree_sync_payload, upsert_self_person
from db.family_tree_schema import ensure_family_tree_tables


def _conn(tmp_path):
    db = tmp_path / "family_tree_sync.db"
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    ensure_family_tree_tables(conn)
    return conn


def test_replace_tree_sync_roundtrip(tmp_path):
    conn = _conn(tmp_path)
    pid = "user-sync-001"
    upsert_self_person(conn, pid, name_kk="Мен", gender="male")
    payload = replace_tree_sync_payload(
        conn,
        pid,
        self_id="p-self",
        persons=[
            {
                "id": "p-self",
                "name_kk": "Мен",
                "gender": "male",
                "is_self": True,
                "father_id": "p-dad",
                "mother_id": None,
            },
            {
                "id": "p-dad",
                "name_kk": "Әке",
                "gender": "male",
                "father_id": None,
                "mother_id": None,
            },
        ],
    )
    assert payload["has_self"] is True
    assert len(payload["persons"]) == 2
    sync = export_tree_sync_payload(conn, pid)
    assert sync["persons"][0]["father_id"] == "p-dad"
    conn.close()
