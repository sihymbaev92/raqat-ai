# -*- coding: utf-8 -*-
"""
Хадис қайталануы: кітап ішіндегі қайта келген жолдарды `is_repeated=1` деп белгілеу
және іздеу/рандомда әдепкі түрде тек бірегей (`is_repeated=0`) жолдар.
"""
from __future__ import annotations

from typing import Any

from db.dialect_sql import is_psycopg_connection, is_sqlite_connection


def hadith_table_columns(conn: Any) -> set[str]:
    if is_sqlite_connection(conn):
        rows = conn.execute("PRAGMA table_info(hadith)").fetchall()
        return {str(r[1]).lower() for r in rows}
    if is_psycopg_connection(conn):
        rows = conn.execute(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND lower(table_name) = 'hadith'
            """
        ).fetchall()
        out: set[str] = set()
        for r in rows:
            if isinstance(r, dict):
                out.add(str(r.get("column_name", "")).lower())
            else:
                out.add(str(r[0]).lower())
        return out
    return set()


def hadith_unique_only_sql_suffix(conn: Any, table_alias: str | None = None) -> str:
    """WHERE соңына қосу: тек кітаптық «бірінші» жол (қайталанбас)."""
    cols = hadith_table_columns(conn)
    if "is_repeated" not in cols:
        return ""
    prefix = f"{table_alias}." if table_alias else ""
    return f" AND COALESCE({prefix}is_repeated, 0) = 0"
