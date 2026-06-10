# -*- coding: utf-8 -*-
from db.connection import db_conn
from db.genealogy.persons_repository import get_person_detail, list_persons_by_clan
from db.genealogy_persons_schema import ensure_genealogy_persons_tables
from db.genealogy_persons_seed import (
    PERSON_COUNT,
    upsert_genealogy_person_source_refs,
    upsert_genealogy_persons,
)
from db.genealogy_seed import upsert_genealogy_default_source_refs, upsert_genealogy_p0_clans
from db.migrations import run_schema_migrations


def test_genealogy_persons_seed_and_list(tmp_path):
    db = tmp_path / "gp.db"
    run_schema_migrations(str(db))
    conn = db_conn(str(db))
    try:
        upsert_genealogy_p0_clans(conn)
        upsert_genealogy_default_source_refs(conn)
        ensure_genealogy_persons_tables(conn)
        n = upsert_genealogy_persons(conn)
        upsert_genealogy_person_source_refs(conn)
        conn.commit()
        assert n == PERSON_COUNT
        argyn_people = list_persons_by_clan(conn, "argyn")
        slugs = {p["slug"] for p in argyn_people}
        assert "abai_kunanbayev" in slugs
        assert "gennady_golovkin" in slugs
        abai = get_person_detail(conn, "abai_kunanbayev")
        assert abai is not None
        assert abai["era"] == "historical"
        assert len(abai.get("sources") or []) >= 1
    finally:
        conn.close()
