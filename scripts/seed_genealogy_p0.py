#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GENEALOGY-P0: upsert catalog + default source refs (SQLite or PostgreSQL)."""
from __future__ import annotations

import argparse
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from db.connection import db_conn
from db.genealogy_schema import ensure_genealogy_tables
from db.genealogy_seed import upsert_genealogy_default_source_refs, upsert_genealogy_p0_clans
from db.migrations import run_schema_migrations


def main() -> int:
    p = argparse.ArgumentParser(description="Seed genealogy P0 clans (idempotent upsert)")
    p.add_argument("--db", default=os.environ.get("RAQAT_DB_PATH", "global_clean.db"))
    p.add_argument("--postgres", action="store_true", help="Use DATABASE_URL / get_db() instead of SQLite file")
    p.add_argument("--skip-migrations", action="store_true")
    args = p.parse_args()

    if args.postgres:
        from db.get_db import get_db, is_postgresql_configured

        if not is_postgresql_configured():
            print("FAIL DATABASE_URL required for --postgres")
            return 1
        with get_db() as conn:
            ensure_genealogy_tables(conn)
            n_clans = upsert_genealogy_p0_clans(conn)
            n_refs = upsert_genealogy_default_source_refs(conn)
            conn.commit()
        print(f"OK  upserted {n_clans} clans, {n_refs} source refs -> PostgreSQL")
        return 0

    if not args.skip_migrations:
        run_schema_migrations(args.db)

    with db_conn(args.db) as conn:
        ensure_genealogy_tables(conn)
        n_clans = upsert_genealogy_p0_clans(conn)
        n_refs = upsert_genealogy_default_source_refs(conn)
        conn.commit()
    print(f"OK  upserted {n_clans} clans, {n_refs} source refs -> {args.db}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
