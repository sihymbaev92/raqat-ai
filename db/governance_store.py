# -*- coding: utf-8 -*-
"""Refresh JTI revocation және API usage ledger (SQLite + PostgreSQL)."""
from __future__ import annotations

import json
from contextlib import contextmanager
from typing import Any

from db.connection import db_conn
from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection
from db.dialect_sql import table_names as _table_names


@contextmanager
def _connect(db_path: str):
    from db.get_db import get_db_writer, is_postgresql_configured

    if is_postgresql_configured():
        with get_db_writer() as conn:
            yield conn
    else:
        with db_conn(db_path) as conn:
            yield conn


def prune_expired_revocations(db_path: str) -> None:
    with _connect(db_path) as conn:
        if "revoked_refresh_jti" not in _table_names(conn):
            return
        if is_psycopg_connection(conn):
            _exec(
                conn,
                "DELETE FROM revoked_refresh_jti WHERE expires_at::timestamptz < NOW()",
                (),
            )
        else:
            conn.execute(
                "DELETE FROM revoked_refresh_jti WHERE datetime(expires_at) < datetime('now')"
            )


def is_refresh_jti_revoked(db_path: str, jti: str) -> bool:
    jti = (jti or "").strip()
    if not jti:
        return True
    with _connect(db_path) as conn:
        if "revoked_refresh_jti" not in _table_names(conn):
            return False
        row = _exec(
            conn,
            "SELECT 1 FROM revoked_refresh_jti WHERE jti = ? LIMIT 1",
            (jti,),
        ).fetchone()
        return bool(row)


def revoke_refresh_jti(db_path: str, jti: str, expires_at_iso: str) -> None:
    jti = (jti or "").strip()
    if not jti:
        return
    with _connect(db_path) as conn:
        if "revoked_refresh_jti" not in _table_names(conn):
            return
        _exec(
            conn,
            "INSERT OR IGNORE INTO revoked_refresh_jti (jti, expires_at) VALUES (?, ?)",
            (jti, expires_at_iso),
        )


def consume_refresh_jti_once(db_path: str, jti: str, expires_at_iso: str) -> bool:
    """
    Atomic refresh rotation gate.
    Returns True only for the first caller that inserts this JTI into revoke table.
    Concurrent callers for the same JTI get False (already consumed/revoked).
    """
    jti = (jti or "").strip()
    if not jti:
        return False
    with _connect(db_path) as conn:
        if "revoked_refresh_jti" not in _table_names(conn):
            return False
        cur = _exec(
            conn,
            "INSERT OR IGNORE INTO revoked_refresh_jti (jti, expires_at) VALUES (?, ?)",
            (jti, expires_at_iso),
        )
        try:
            return int(getattr(cur, "rowcount", 0) or 0) > 0
        except Exception:
            return False


def append_audit_event(
    db_path: str,
    *,
    action: str,
    route: str,
    actor_type: str,
    platform_user_id: str | None = None,
    telegram_user_id: int | None = None,
    summary: str | None = None,
) -> None:
    """Сәйкестік / қауіпсіздік audit (миграция 010 `audit_events`)."""
    act = (action or "").strip()[:128] or "unknown"
    rt = (route or "").strip()[:256] or ""
    at = (actor_type or "").strip()[:32] or "unknown"
    pid = (platform_user_id or "").strip() or None
    tid = int(telegram_user_id) if telegram_user_id is not None else None
    sm = (summary or "").strip()[:2000] or None
    with _connect(db_path) as conn:
        if "audit_events" not in _table_names(conn):
            return
        _exec(
            conn,
            """
            INSERT INTO audit_events (
                action, route, actor_type, platform_user_id, telegram_user_id, summary, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (act, rt, at, pid, tid, sm),
        )


def append_usage_event(
    db_path: str,
    *,
    event_type: str,
    route: str,
    source_auth: str,
    platform_user_id: str | None = None,
    telegram_user_id: int | None = None,
    units: int = 1,
    prompt_chars: int | None = None,
    response_chars: int | None = None,
    meta: dict[str, Any] | None = None,
) -> None:
    et = (event_type or "").strip()[:64] or "unknown"
    rt = (route or "").strip()[:256] or ""
    sa = (source_auth or "").strip()[:32] or "unknown"
    pid = (platform_user_id or "").strip() or None
    tid = int(telegram_user_id) if telegram_user_id is not None else None
    u = max(0, int(units))
    meta_s = json.dumps(meta, ensure_ascii=False)[:4000] if meta else None
    with _connect(db_path) as conn:
        if "api_usage_ledger" not in _table_names(conn):
            return
        _exec(
            conn,
            """
            INSERT INTO api_usage_ledger (
                event_type, route, platform_user_id, telegram_user_id,
                source_auth, units, prompt_chars, response_chars, meta_json, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (et, rt, pid, tid, sa, u, prompt_chars, response_chars, meta_s),
        )


def usage_summary_for_platform_user(
    db_path: str, platform_user_id: str, *, days: int = 30
) -> dict[str, Any]:
    pid = (platform_user_id or "").strip()
    d = max(1, min(int(days), 366))
    with _connect(db_path) as conn:
        if "api_usage_ledger" not in _table_names(conn):
            return {"ai_units": 0, "events": 0, "by_type": {}}
        if is_psycopg_connection(conn):
            rows = _exec(
                conn,
                """
                SELECT event_type, SUM(units) AS u, COUNT(*) AS c
                FROM api_usage_ledger
                WHERE platform_user_id = %s
                  AND created_at::timestamptz >= CURRENT_TIMESTAMP - (%s::int * INTERVAL '1 day')
                GROUP BY event_type
                """,
                (pid, d),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT event_type, SUM(units) AS u, COUNT(*) AS c
                FROM api_usage_ledger
                WHERE platform_user_id = ?
                  AND datetime(created_at) >= datetime('now', '-' || ? || ' days')
                GROUP BY event_type
                """,
                (pid, str(d)),
            ).fetchall()
    by_type: dict[str, dict[str, int]] = {}
    total_units = 0
    total_events = 0
    for r in rows:
        et = str(r["event_type"])
        u = int(r["u"] or 0)
        c = int(r["c"] or 0)
        by_type[et] = {"units": u, "count": c}
        total_units += u
        total_events += c
    return {"ai_units": total_units, "events": total_events, "by_type": by_type}
