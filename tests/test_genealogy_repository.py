# -*- coding: utf-8 -*-
from db.connection import db_conn
from db.genealogy.repository import get_clan_detail, list_children
from db.genealogy_seed import upsert_genealogy_default_source_refs, upsert_genealogy_p0_clans
from db.migrations import run_schema_migrations


def test_p0_repository_list_and_detail(tmp_path):
    db = tmp_path / "g.db"
    run_schema_migrations(str(db))
    conn = db_conn(str(db))
    try:
        upsert_genealogy_p0_clans(conn)
        upsert_genealogy_default_source_refs(conn)
        conn.commit()
        roots = list_children(conn, None)
        assert len(roots) == 3
        slugs = {r["slug"] for r in roots}
        assert slugs == {"uly_zhuz", "orta_zhuz", "kishi_zhuz"}
        children = list_children(conn, "uly_zhuz")
        child_slugs = {c["slug"] for c in children}
        assert {"uisin", "alban"}.issubset(child_slugs)
        assert len(child_slugs) >= 8
        detail = get_clan_detail(conn, "dulat")
        assert detail is not None
        assert detail["engine"] == "p0"
        assert "uisin" in detail["breadcrumbs"]
        assert detail["breadcrumbs"][-1] == "dulat"
        assert len(detail.get("sources") or []) >= 1
        assert detail.get("description_kk")
        dulat_children = list_children(conn, "dulat")
        dulat_child_slugs = {c["slug"] for c in dulat_children}
        assert {"botbay", "tobyqty"}.issubset(dulat_child_slugs)
        botbay = get_clan_detail(conn, "botbay")
        assert botbay is not None
        assert botbay["level"] == 4
        alban_children = {c["slug"] for c in list_children(conn, "alban")}
        assert {"saryzhas", "tana", "karauyl"}.issubset(alban_children)
        nayman_children = {c["slug"] for c in list_children(conn, "nayman")}
        assert {"sadyr", "bura", "karke"}.issubset(nayman_children)
        suan_children = {c["slug"] for c in list_children(conn, "suan")}
        assert {"makshym", "kete_suan", "borik"}.issubset(suan_children)
        kongrat_children = {c["slug"] for c in list_children(conn, "kongrat")}
        assert {"kozhaman", "kobenshi", "kurak"}.issubset(kongrat_children)
        tabyn_children = {c["slug"] for c in list_children(conn, "tabyn")}
        assert {"zhappas", "kaldama", "baimuly"}.issubset(tabyn_children)
    finally:
        conn.close()
