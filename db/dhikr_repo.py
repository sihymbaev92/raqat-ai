# -*- coding: utf-8 -*-
"""Зікір (тасбих) жолдары — SQLite `dhikr` кестесі."""
from __future__ import annotations

import sqlite3
from typing import Any


def dhikr_table_exists(conn: sqlite3.Connection) -> bool:
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='dhikr' LIMIT 1"
    ).fetchone()
    return row is not None


def list_dhikrs(conn: sqlite3.Connection, *, limit: int = 40) -> list[sqlite3.Row]:
    if not dhikr_table_exists(conn):
        return []
    lim = max(1, min(int(limit), 200))
    return list(
        conn.execute(
            """
            SELECT id, slug, text_ar, text_kk, text_ru, text_en, default_target, phase_rule, sort_order
            FROM dhikr
            ORDER BY sort_order ASC, id ASC
            LIMIT ?
            """,
            (lim,),
        ).fetchall()
    )


def get_dhikr(conn: sqlite3.Connection, dhikr_id: int) -> sqlite3.Row | None:
    if not dhikr_table_exists(conn):
        return None
    return conn.execute(
        """
        SELECT id, slug, text_ar, text_kk, text_ru, text_en, default_target, phase_rule, sort_order
        FROM dhikr WHERE id = ?
        """,
        (int(dhikr_id),),
    ).fetchone()


def first_dhikr_id(conn: sqlite3.Connection) -> int | None:
    rows = list_dhikrs(conn, limit=1)
    if not rows:
        return None
    return int(rows[0]["id"])
