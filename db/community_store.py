# -*- coding: utf-8 -*-
"""Қауымдық дұға: тізім, жаңа жазба, әмин (SQLite + PostgreSQL)."""
from __future__ import annotations

import re
from typing import Any

from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection, is_sqlite_connection
from db.get_db import get_db


def _norm_body(raw: str) -> str:
    t = (raw or "").strip()
    t = re.sub(r"\s+", " ", t)
    return t


def count_recent_duas_by_client(client_id: str, hours: int = 24) -> int:
    cid = (client_id or "").strip()
    if not cid:
        return 999
    h = int(hours)
    with get_db() as conn:
        if is_sqlite_connection(conn):
            row = _exec(
                conn,
                """
                SELECT COUNT(*) AS c FROM community_dua
                WHERE client_id = ?
                  AND datetime(created_at) > datetime('now', ?)
                """,
                (cid, f"-{h} hours"),
            ).fetchone()
        elif is_psycopg_connection(conn):
            row = conn.execute(
                """
                SELECT COUNT(*)::bigint AS c FROM community_dua
                WHERE client_id = %s
                  AND created_at > NOW() - (%s * INTERVAL '1 hour')
                """,
                (cid, h),
            ).fetchone()
        else:
            return 999
        if not row:
            return 0
        try:
            return int(row["c"])
        except Exception:
            return int(row[0])


def list_duas(limit: int = 40) -> list[dict[str, Any]]:
    lim = max(1, min(int(limit), 100))
    with get_db() as conn:
        rows = _exec(
            conn,
            """
            SELECT id, body, amen_count, created_at
            FROM community_dua
            ORDER BY id DESC
            LIMIT ?
            """,
            (lim,),
        ).fetchall()
    out: list[dict[str, Any]] = []
    for r in rows or []:
        try:
            rid = int(r["id"])
            body = str(r["body"])
            ac = int(r["amen_count"])
            created = str(r["created_at"])
        except Exception:
            rid = int(r[0])
            body = str(r[1])
            ac = int(r[2])
            created = str(r[3])
        out.append(
            {"id": rid, "body": body, "amen_count": ac, "created_at": created}
        )
    return out


def create_dua(client_id: str, body: str) -> tuple[int | None, str | None]:
    cid = (client_id or "").strip()
    text = _norm_body(body)
    if len(cid) < 8:
        return None, "client_id_invalid"
    if len(text) < 3:
        return None, "body_too_short"
    if len(text) > 400:
        return None, "body_too_long"
    if count_recent_duas_by_client(cid, 24) >= 8:
        return None, "rate_limited"

    with get_db() as conn:
        if is_sqlite_connection(conn):
            cur = _exec(
                conn,
                "INSERT INTO community_dua (body, client_id) VALUES (?, ?)",
                (text, cid),
            )
            return int(cur.lastrowid), None
        if is_psycopg_connection(conn):
            row = conn.execute(
                """
                INSERT INTO community_dua (body, client_id)
                VALUES (%s, %s)
                RETURNING id
                """,
                (text, cid),
            ).fetchone()
            if not row:
                return None, "insert_failed"
            try:
                return int(row["id"]), None
            except Exception:
                return int(row[0]), None
    return None, "db_unsupported"


def add_amen(dua_id: int, client_id: str) -> tuple[bool, int | None, str | None]:
    did = int(dua_id)
    cid = (client_id or "").strip()
    if did < 1 or len(cid) < 8:
        return False, None, "bad_request"

    with get_db() as conn:
        row = _exec(
            conn, "SELECT id FROM community_dua WHERE id = ? LIMIT 1", (did,)
        ).fetchone()
        if not row:
            return False, None, "not_found"

        if is_sqlite_connection(conn):
            cur = _exec(
                conn,
                """
                INSERT OR IGNORE INTO community_dua_amen (dua_id, client_id)
                VALUES (?, ?)
                """,
                (did, cid),
            )
            inserted = getattr(cur, "rowcount", 0) == 1
        elif is_psycopg_connection(conn):
            cur = conn.execute(
                """
                INSERT INTO community_dua_amen (dua_id, client_id)
                VALUES (%s, %s)
                ON CONFLICT (dua_id, client_id) DO NOTHING
                """,
                (did, cid),
            )
            inserted = getattr(cur, "rowcount", 0) == 1
        else:
            return False, None, "db_unsupported"

        if inserted:
            _exec(
                conn,
                "UPDATE community_dua SET amen_count = amen_count + 1 WHERE id = ?",
                (did,),
            )

        cnt_row = _exec(
            conn,
            "SELECT amen_count FROM community_dua WHERE id = ? LIMIT 1",
            (did,),
        ).fetchone()
        try:
            total = int(cnt_row["amen_count"]) if cnt_row else 0
        except Exception:
            total = int(cnt_row[0]) if cnt_row else 0

    return inserted, total, None
