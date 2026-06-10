#!/usr/bin/env python3
"""VPS PostgreSQL: platform_users, usage ledger, event_log."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
except ImportError:
    pass

from db.get_db import get_db_writer  # noqa: E402
from db.dialect_sql import is_psycopg_connection, table_names  # noqa: E402


def _count(conn, sql: str, params=()) -> int:
    row = conn.execute(sql, params).fetchone()
    if row is None:
        return 0
    if hasattr(row, "keys"):
        return int(list(row.values())[0])
    return int(row[0])


def main() -> int:
    with get_db_writer() as conn:
        tables = table_names(conn)
        print("backend:", "postgresql" if is_psycopg_connection(conn) else "sqlite")
        for table in (
            "platform_users",
            "user_preferences",
            "event_log",
            "api_usage_ledger",
            "bookmarks",
        ):
            if table in tables:
                print(f"{table}: {_count(conn, f'SELECT COUNT(*) FROM {table}')}")

        if "api_usage_ledger" in tables:
            row = conn.execute(
                "SELECT MIN(created_at), MAX(created_at) FROM api_usage_ledger"
            ).fetchone()
            print("api_usage_ledger_range:", tuple(row.values()) if hasattr(row, "keys") else row)

        if "api_usage_ledger" in tables and is_psycopg_connection(conn):
            print(
                "api_usage_ledger_users_7d:",
                _count(
                    conn,
                    """
                    SELECT COUNT(DISTINCT platform_user_id) FROM api_usage_ledger
                    WHERE created_at::timestamptz > NOW() - INTERVAL '7 days'
                    """,
                ),
            )
            print(
                "api_usage_events_24h:",
                _count(
                    conn,
                    """
                    SELECT COUNT(*) FROM api_usage_ledger
                    WHERE created_at::timestamptz > NOW() - INTERVAL '24 hours'
                    """,
                ),
            )

        if "event_log" in tables and is_psycopg_connection(conn):
            print(
                "event_log_30d:",
                _count(
                    conn,
                    """
                    SELECT COUNT(*) FROM event_log
                    WHERE created_at::timestamptz > NOW() - INTERVAL '30 days'
                    """,
                ),
            )
            print(
                "event_log_active_users_30d:",
                _count(
                    conn,
                    """
                    SELECT COUNT(DISTINCT user_id) FROM event_log
                    WHERE created_at::timestamptz > NOW() - INTERVAL '30 days' AND user_id IS NOT NULL
                    """,
                ),
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
