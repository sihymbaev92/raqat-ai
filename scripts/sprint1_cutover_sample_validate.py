#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pre/post cutover: SQLite vs PG sample parity (platform_identities + chat counts).

Usage:
  python scripts/sprint1_cutover_sample_validate.py \\
    --sqlite ./global_clean.db --pg-dsn "$PG_DSN" --sample 10
"""
from __future__ import annotations

import argparse
import random
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _sqlite_users(db_path: str, n: int) -> list[tuple[str, int | None]]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            """
            SELECT platform_user_id, telegram_user_id
            FROM platform_identities
            ORDER BY RANDOM()
            LIMIT ?
            """,
            (n,),
        ).fetchall()
        return [(str(r["platform_user_id"]), r["telegram_user_id"]) for r in rows]
    finally:
        conn.close()


def _sqlite_chat_count(db_path: str, pid: str) -> int:
    conn = sqlite3.connect(db_path)
    try:
        row = conn.execute(
            "SELECT COUNT(*) AS c FROM platform_ai_chat_messages WHERE platform_user_id = ?",
            (pid,),
        ).fetchone()
        return int(row[0]) if row else 0
    finally:
        conn.close()


def _pg_chat_count(dsn: str, pid: str) -> int:
    import psycopg

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM platform_ai_chat_messages WHERE platform_user_id = %s",
                (pid,),
            )
            row = cur.fetchone()
            return int(row[0]) if row else 0


def _pg_has_user(dsn: str, pid: str, tid: int | None) -> bool:
    import psycopg

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM platform_identities WHERE platform_user_id = %s LIMIT 1",
                (pid,),
            )
            if not cur.fetchone():
                return False
            if tid is None:
                return True
            cur.execute(
                """
                SELECT 1 FROM platform_identities
                WHERE platform_user_id = %s AND telegram_user_id = %s LIMIT 1
                """,
                (pid, tid),
            )
            return cur.fetchone() is not None


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--sqlite", required=True)
    p.add_argument("--pg-dsn", required=True)
    p.add_argument("--sample", type=int, default=10)
    p.add_argument("--seed", type=int, default=0, help="0 = random each run")
    args = p.parse_args()

    sqlite = str(Path(args.sqlite).expanduser().resolve())
    if not Path(sqlite).is_file():
        print(f"SQLite not found: {sqlite}", file=sys.stderr)
        return 2

    try:
        import psycopg  # noqa: F401
    except ImportError:
        print("psycopg required: pip install -r requirements-postgres.txt", file=sys.stderr)
        return 2

    if args.seed:
        random.seed(args.seed)

    users = _sqlite_users(sqlite, max(1, args.sample))
    if not users:
        print("[sample] no platform_identities rows — skip")
        return 0

    mismatches = 0
    for pid, tid in users:
        if not _pg_has_user(args.pg_dsn, pid, tid):
            print(f"MISMATCH identity missing in PG: {pid} tid={tid}")
            mismatches += 1
            continue
        sc = _sqlite_chat_count(sqlite, pid)
        pc = _pg_chat_count(args.pg_dsn, pid)
        if sc != pc:
            print(f"MISMATCH chat count pid={pid}: sqlite={sc} pg={pc}")
            mismatches += 1
        else:
            print(f"OK pid={pid} chats={sc}")

    if mismatches:
        print(f"--- sample validate FAILED ({mismatches} mismatches) ---", file=sys.stderr)
        return 3
    print(f"--- sample validate OK ({len(users)} users) ---")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
