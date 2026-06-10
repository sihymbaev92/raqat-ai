#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENEALOGY A1: Alembic migrate (PG) + P0 import + optional synthetic load.

  python scripts/seed_genealogy_a1.py
  python scripts/seed_genealogy_a1.py --synthetic 10000
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)


def _run_alembic() -> None:
    env = os.environ.copy()
    subprocess.check_call(
        [sys.executable, "-m", "alembic", "-c", os.path.join(ROOT, "alembic.ini"), "upgrade", "head"],
        cwd=ROOT,
        env=env,
    )


def main() -> int:
    p = argparse.ArgumentParser(description="Seed genealogy A1 on PostgreSQL")
    p.add_argument("--skip-alembic", action="store_true")
    p.add_argument("--synthetic", type=int, default=0, help="Extra synthetic tree nodes (perf test)")
    args = p.parse_args()

    from db.get_db import get_db, is_postgresql_configured

    if not is_postgresql_configured():
        print("FAIL DATABASE_URL required for A1 seed")
        return 1

    if not args.skip_alembic:
        try:
            _run_alembic()
        except subprocess.CalledProcessError as exc:
            print(f"WARN alembic failed ({exc}) — ensure alembic installed: pip install alembic sqlalchemy")
            return exc.returncode or 1

    from db.genealogy.importer import import_p0_clans_to_a1

    with get_db() as conn:
        stats = import_p0_clans_to_a1(conn)
        if args.synthetic > 0:
            from db.genealogy.synthetic import insert_synthetic_tree

            stats["synthetic"] = insert_synthetic_tree(conn, args.synthetic)
        conn.commit()

    print(f"OK  A1 seed: {stats}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
