#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Қауым дұға кестелерін бір рет жасау (PostgreSQL немесе SQLite).

Өндірісте API `/api/v1/community/duas` 503 берсе, серверді қайта іске қосыңыз
немесе осы скриптті орындаңыз:

  cd /path/to/raqat_bot && .venv/bin/python scripts/ensure_community_dua_tables.py

Қажетті env: DATABASE_URL (немесе SQLite үшін RAQAT_DB_PATH / DB_PATH).
"""
from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

try:
    from dotenv import load_dotenv

    load_dotenv(_ROOT / ".env")
except ImportError:
    pass


def main() -> int:
    from db.community_schema import ensure_community_tables
    from db.dialect_sql import is_psycopg_connection
    from db.get_db import get_db, is_postgresql_configured

    mode = "PostgreSQL" if is_postgresql_configured() else "SQLite"
    print(f"=== ensure_community_dua tables ({mode}) ===")
    try:
        with get_db() as conn:
            ensure_community_tables(conn)
            if is_psycopg_connection(conn):
                conn.commit()
        print("OK: community_dua, community_dua_amen")
        return 0
    except Exception as e:
        print(f"FAILED: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
