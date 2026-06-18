# -*- coding: utf-8 -*-
from __future__ import annotations

import hashlib
import os
from datetime import datetime, timezone
from typing import Any

from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection, table_names
from db.get_db import get_db_writer


USAGE_SOURCES = {"web", "app", "telegram", "api", "unknown"}


def _trim(value: Any, limit: int) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:limit]


def _hash_value(value: str | None) -> str | None:
    text = (value or "").strip()
    if not text:
        return None
    salt = (
        os.getenv("RAQAT_USAGE_HASH_SALT")
        or os.getenv("RAQAT_JWT_SECRET")
        or os.getenv("RAQAT_BOT_SYNC_SECRET")
        or "raqat-usage-v1"
    )
    return hashlib.sha256(f"{salt}:{text}".encode("utf-8")).hexdigest()


def ensure_client_usage_tables() -> None:
    with get_db_writer() as conn:
        tables = table_names(conn)
        if "client_usage_events" not in tables:
            if is_psycopg_connection(conn):
                conn.execute(
                    """
                    CREATE TABLE client_usage_events (
                        id BIGSERIAL PRIMARY KEY,
                        source TEXT NOT NULL,
                        event_name TEXT NOT NULL,
                        session_id TEXT,
                        platform_user_id UUID,
                        telegram_user_id BIGINT,
                        path TEXT,
                        screen TEXT,
                        app_version TEXT,
                        build_number TEXT,
                        user_agent_hash TEXT,
                        ip_hash TEXT,
                        detail TEXT,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            else:
                conn.execute(
                    """
                    CREATE TABLE client_usage_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        source TEXT NOT NULL,
                        event_name TEXT NOT NULL,
                        session_id TEXT,
                        platform_user_id TEXT,
                        telegram_user_id INTEGER,
                        path TEXT,
                        screen TEXT,
                        app_version TEXT,
                        build_number TEXT,
                        user_agent_hash TEXT,
                        ip_hash TEXT,
                        detail TEXT,
                        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
        if is_psycopg_connection(conn):
            idx = {
                str(r["indexname"]).lower()
                for r in conn.execute(
                    "SELECT indexname FROM pg_indexes WHERE schemaname = 'public'"
                ).fetchall()
            }
            if "idx_client_usage_created" not in idx:
                conn.execute("CREATE INDEX idx_client_usage_created ON client_usage_events(created_at)")
            if "idx_client_usage_source_created" not in idx:
                conn.execute(
                    "CREATE INDEX idx_client_usage_source_created ON client_usage_events(source, created_at)"
                )
            if "idx_client_usage_session_created" not in idx:
                conn.execute(
                    "CREATE INDEX idx_client_usage_session_created ON client_usage_events(session_id, created_at)"
                )
        else:
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_client_usage_created ON client_usage_events(created_at)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_client_usage_source_created ON client_usage_events(source, created_at)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_client_usage_session_created ON client_usage_events(session_id, created_at)"
            )


def record_client_usage_event(
    *,
    source: str,
    event_name: str,
    session_id: str | None = None,
    platform_user_id: str | None = None,
    telegram_user_id: int | None = None,
    path: str | None = None,
    screen: str | None = None,
    app_version: str | None = None,
    build_number: str | None = None,
    user_agent: str | None = None,
    ip: str | None = None,
    detail: str | None = None,
) -> None:
    ensure_client_usage_tables()
    src = source if source in USAGE_SOURCES else "unknown"
    with get_db_writer() as conn:
        _exec(
            conn,
            """
            INSERT INTO client_usage_events (
                source, event_name, session_id, platform_user_id, telegram_user_id,
                path, screen, app_version, build_number, user_agent_hash, ip_hash, detail
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                src,
                _trim(event_name, 80) or "unknown",
                _trim(session_id, 96),
                _trim(platform_user_id, 64),
                telegram_user_id,
                _trim(path, 240),
                _trim(screen, 120),
                _trim(app_version, 32),
                _trim(build_number, 32),
                _hash_value(user_agent),
                _hash_value(ip),
                _trim(detail, 500),
            ),
        )


def _count_row(conn: Any, sql: str, params: tuple[Any, ...]) -> dict[str, int]:
    row = _exec(conn, sql, params).fetchone()
    if row is None:
        return {}
    data = dict(row) if hasattr(row, "keys") else {}
    return {k: int(v or 0) for k, v in data.items()}


def _period_clause(conn: Any) -> str:
    if is_psycopg_connection(conn):
        return "created_at >= CURRENT_TIMESTAMP - (?::int * INTERVAL '1 hour')"
    return "created_at >= datetime('now', ?)"


def _period_param(conn: Any, hours: int) -> tuple[Any, ...]:
    if is_psycopg_connection(conn):
        return (hours,)
    return (f"-{hours} hours",)


def build_client_usage_summary(hours: int = 24) -> dict[str, Any]:
    ensure_client_usage_tables()
    h = max(1, int(hours))
    now = datetime.now(timezone.utc).isoformat()
    with get_db_writer() as conn:
        clause = _period_clause(conn)
        params = _period_param(conn, h)
        totals = _count_row(
            conn,
            f"""
            SELECT
                COUNT(*) AS events,
                COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS sessions,
                COUNT(DISTINCT platform_user_id) FILTER (WHERE platform_user_id IS NOT NULL) AS platform_users,
                COUNT(DISTINCT telegram_user_id) FILTER (WHERE telegram_user_id IS NOT NULL) AS telegram_users,
                COUNT(DISTINCT ip_hash) FILTER (WHERE ip_hash IS NOT NULL) AS unique_ips
            FROM client_usage_events
            WHERE {clause}
            """
            if is_psycopg_connection(conn)
            else f"""
            SELECT
                COUNT(*) AS events,
                COUNT(DISTINCT CASE WHEN session_id IS NOT NULL THEN session_id END) AS sessions,
                COUNT(DISTINCT CASE WHEN platform_user_id IS NOT NULL THEN platform_user_id END) AS platform_users,
                COUNT(DISTINCT CASE WHEN telegram_user_id IS NOT NULL THEN telegram_user_id END) AS telegram_users,
                COUNT(DISTINCT CASE WHEN ip_hash IS NOT NULL THEN ip_hash END) AS unique_ips
            FROM client_usage_events
            WHERE {clause}
            """,
            params,
        )
        by_source_rows = _exec(
            conn,
            f"""
            SELECT
                source,
                COUNT(*) AS events,
                COUNT(DISTINCT session_id) AS sessions,
                COUNT(DISTINCT platform_user_id) AS platform_users,
                COUNT(DISTINCT telegram_user_id) AS telegram_users
            FROM client_usage_events
            WHERE {clause}
            GROUP BY source
            ORDER BY events DESC
            """,
            params,
        ).fetchall()
        top_rows = _exec(
            conn,
            f"""
            SELECT event_name, COUNT(*) AS events
            FROM client_usage_events
            WHERE {clause}
            GROUP BY event_name
            ORDER BY events DESC
            LIMIT 12
            """,
            params,
        ).fetchall()
        last = _exec(conn, "SELECT MAX(created_at) AS last_event_at FROM client_usage_events", ()).fetchone()

    return {
        "ok": True,
        "generated_at": now,
        "hours": h,
        "totals": totals,
        "by_source": [dict(r) for r in by_source_rows],
        "top_events": [dict(r) for r in top_rows],
        "last_event_at": (dict(last).get("last_event_at") if last is not None and hasattr(last, "keys") else None),
    }
