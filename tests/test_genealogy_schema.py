# -*- coding: utf-8 -*-
"""Genealogy schema migration + P0 seed."""
from __future__ import annotations

from db.connection import db_conn
from db.genealogy_seed import P0_CLAN_COUNT, upsert_genealogy_default_source_refs, upsert_genealogy_p0_clans
from db.migrations import run_schema_migrations


def test_migration_020_creates_genealogy_tables(tmp_path):
    db = tmp_path / "genealogy.db"
    run_schema_migrations(str(db))
    conn = db_conn(str(db))
    try:
        tables = {
            row[0]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        }
        assert "genealogy_clans" in tables
        assert "genealogy_source_refs" in tables
        versions = {
            int(r[0]) for r in conn.execute("SELECT version FROM schema_migrations").fetchall()
        }
        assert 20 in versions
    finally:
        conn.close()


def test_genealogy_p0_seed_upsert_idempotent(tmp_path):
    db = tmp_path / "genealogy.db"
    run_schema_migrations(str(db))
    conn = db_conn(str(db))
    try:
        n1 = upsert_genealogy_p0_clans(conn)
        upsert_genealogy_default_source_refs(conn)
        conn.commit()
        n2 = upsert_genealogy_p0_clans(conn)
        conn.commit()
        count = conn.execute("SELECT COUNT(*) FROM genealogy_clans").fetchone()[0]
        assert n1 == P0_CLAN_COUNT
        assert n2 == P0_CLAN_COUNT
        assert count == P0_CLAN_COUNT
        row = conn.execute(
            "SELECT parent_id, level FROM genealogy_clans WHERE id = 'dulat'"
        ).fetchone()
        assert row[0] == "uisin"
        assert row[1] == 3
    finally:
        conn.close()
