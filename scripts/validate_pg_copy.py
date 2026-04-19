#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQLite ↔ PostgreSQL жол саны мен үлгілерді салыстыру (көшірмесіз).

Ішінде `migrate_sqlite_to_postgres.py --validate-only` шақырылады.

Мысал:
  .venv/bin/python scripts/validate_pg_copy.py --sqlite ./global_clean.db --pg-dsn "$PG_DSN"
  .venv/bin/python scripts/validate_pg_copy.py --sqlite ./global_clean.db --pg "$PG_DSN"
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--sqlite", required=True, help="SQLite db path")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--pg-dsn", help="postgresql://...")
    g.add_argument("--pg", dest="pg_dsn_alt", help="Синоним: --pg-dsn")
    args = p.parse_args()
    dsn = args.pg_dsn or args.pg_dsn_alt
    if not dsn:
        print("Need --pg-dsn or --pg", file=sys.stderr)
        return 2

    cmd = [
        sys.executable,
        str(ROOT / "scripts" / "migrate_sqlite_to_postgres.py"),
        "--sqlite",
        str(Path(args.sqlite).expanduser().resolve()),
        "--pg-dsn",
        dsn,
        "--validate-only",
    ]
    return subprocess.call(cmd, cwd=str(ROOT))


if __name__ == "__main__":
    raise SystemExit(main())
