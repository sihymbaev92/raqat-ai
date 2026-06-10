# -*- coding: utf-8 -*-
"""Export A1/P0 clans to mobile offline bundled JSON."""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

OUT = os.path.join(ROOT, "mobile", "assets", "bundled", "genealogy-p0.json")


def build_snapshot() -> dict:
    from db.connection import db_conn
    from db.genealogy.repository import get_clan_detail, list_children
    from db.genealogy.persons_repository import persons_table_exists
    from db.genealogy_seed import GENEALOGY_P0_CLANS
    from db.migrations import run_schema_migrations

    from db.genealogy_persons_schema import ensure_genealogy_persons_tables
    from db.genealogy_persons_seed import upsert_genealogy_person_source_refs, upsert_genealogy_persons

    db_path = os.environ.get("RAQAT_DB_PATH", "global_clean.db")
    run_schema_migrations(db_path)
    from db.genealogy_seed import upsert_genealogy_default_source_refs, upsert_genealogy_p0_clans

    with db_conn(db_path) as conn:
        upsert_genealogy_p0_clans(conn)
        upsert_genealogy_default_source_refs(conn)
        ensure_genealogy_persons_tables(conn)
        upsert_genealogy_persons(conn)
        upsert_genealogy_person_source_refs(conn)
        conn.commit()
        roots = list_children(conn, None)
        nodes = []
        for clan in GENEALOGY_P0_CLANS:
            detail = get_clan_detail(conn, clan.id)
            if detail:
                nodes.append(detail)
        persons = []
        if persons_table_exists(conn):
            from db.genealogy_persons_seed import GENEALOGY_PERSON_DEFS

            for pdef in GENEALOGY_PERSON_DEFS:
                from db.genealogy.persons_repository import get_person_detail

                pd = get_person_detail(conn, pdef.id)
                if pd:
                    persons.append(pd)
    return {"version": 2, "engine": "p0", "roots": roots, "nodes": nodes, "persons": persons}


def main() -> int:
    snap = build_snapshot()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(snap, f, ensure_ascii=False, indent=2)
    print(f"OK  {OUT} ({len(snap['nodes'])} nodes, {len(snap.get('persons') or [])} persons)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
