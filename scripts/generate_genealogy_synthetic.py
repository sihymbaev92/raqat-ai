#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CLI wrapper — synthetic genealogy tree on PostgreSQL."""
from __future__ import annotations

import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)


def main() -> int:
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    from db.genealogy.synthetic import insert_synthetic_tree
    from db.get_db import get_db, is_postgresql_configured

    if not is_postgresql_configured():
        print("DATABASE_URL required")
        return 1
    with get_db() as conn:
        c = insert_synthetic_tree(conn, n)
        conn.commit()
    print(f"OK synthetic nodes={c}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
