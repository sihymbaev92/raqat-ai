# -*- coding: utf-8 -*-
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from config.settings import ADMIN_USER_IDS, DB_PATH
from db.connection import db_conn
from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection, is_sqlite_connection, table_names
from db.get_db import get_db_writer, is_postgresql_configured
from services.language_service import (
    _lang_db,
    ensure_user_preferences_row,
    ensure_user_preferences_table,
    get_supported_language_codes,
)

APP_STARTED_AT = datetime.now(timezone.utc)
RECENT_EVENT_WINDOW_MINUTES = 15

GEMINI_PROXY_EVENT_NAMES: tuple[str, ...] = (
    "ai_prompt",
    "halal_photo_ai",
    "halal_photo_ai_fail",
    "halal_text_ai",
    "halal_text_ai_fail",
)


def ensure_ops_tables() -> None:
    """event_log / feedback — SQLite немесе PostgreSQL DDL."""
    ensure_user_preferences_table()

    if is_postgresql_configured():
        with get_db_writer() as conn:
            tbl = table_names(conn)
            if "event_log" not in tbl:
                conn.execute(
                    """
                    CREATE TABLE event_log (
                        id BIGSERIAL PRIMARY KEY,
                        user_id BIGINT REFERENCES user_preferences(user_id) ON DELETE SET NULL,
                        event_type TEXT NOT NULL,
                        event_name TEXT NOT NULL,
                        detail TEXT,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            if "idx_event_log_created_at" not in _pg_index_names(conn):
                conn.execute(
                    "CREATE INDEX idx_event_log_created_at ON event_log(created_at)"
                )
            if "idx_event_log_event_name" not in _pg_index_names(conn):
                conn.execute(
                    "CREATE INDEX idx_event_log_event_name ON event_log(event_name)"
                )
            if "feedback" not in tbl:
                conn.execute(
                    """
                    CREATE TABLE feedback (
                        id BIGSERIAL PRIMARY KEY,
                        user_id BIGINT NOT NULL REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                        category TEXT NOT NULL,
                        message_text TEXT NOT NULL,
                        status TEXT NOT NULL DEFAULT 'new',
                        context TEXT,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            if "idx_feedback_status_created" not in _pg_index_names(conn):
                conn.execute(
                    """
                    CREATE INDEX idx_feedback_status_created
                    ON feedback(status, created_at DESC)
                    """
                )
        return

    with db_conn(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS event_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES user_preferences(user_id) ON DELETE SET NULL,
                event_type TEXT NOT NULL,
                event_name TEXT NOT NULL,
                detail TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_event_log_created_at
            ON event_log(created_at)
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_event_log_event_name
            ON event_log(event_name)
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES user_preferences(user_id) ON DELETE CASCADE,
                category TEXT NOT NULL,
                message_text TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'new',
                context TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_feedback_status_created
            ON feedback(status, created_at DESC)
            """
        )


def _pg_index_names(conn: Any) -> set[str]:
    rows = conn.execute(
        """
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public'
        """
    ).fetchall()
    return {str(r["indexname"]).lower() for r in rows}


def log_event(
    user_id: int | None,
    event_name: str,
    *,
    event_type: str = "action",
    detail: str | None = None,
) -> None:
    ensure_ops_tables()
    if user_id is not None:
        ensure_user_preferences_row(int(user_id))
    with _lang_db() as conn:
        _exec(
            conn,
            """
            INSERT INTO event_log (user_id, event_type, event_name, detail)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, event_type, event_name, detail),
        )


def save_feedback(
    user_id: int,
    category: str,
    message_text: str,
    *,
    context: str | None = None,
) -> int:
    ensure_ops_tables()
    ensure_user_preferences_row(int(user_id))
    with _lang_db() as conn:
        if is_psycopg_connection(conn):
            row = conn.execute(
                """
                INSERT INTO feedback (user_id, category, message_text, context)
                VALUES (%s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, category, message_text.strip(), context),
            ).fetchone()
            return int(row["id"]) if row else 0
        cur = conn.execute(
            """
            INSERT INTO feedback (user_id, category, message_text, context)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, category, message_text.strip(), context),
        )
        return int(cur.lastrowid or 0)


def list_feedback(*, limit: int = 10, status: str | None = None, category: str | None = None) -> list[dict[str, Any]]:
    ensure_ops_tables()
    where: list[str] = []
    params: list[Any] = []

    if status:
        where.append("status = ?")
        params.append(status)
    if category:
        where.append("category = ?")
        params.append(category)

    query = """
        SELECT id, user_id, category, message_text, status, context, created_at
        FROM feedback
    """
    if where:
        query += " WHERE " + " AND ".join(where)
    query += " ORDER BY id DESC LIMIT ?"
    params.append(max(1, int(limit)))

    with _lang_db() as conn:
        rows = _exec(conn, query, tuple(params)).fetchall()
    return [dict(row) for row in rows]


def update_feedback_status(feedback_id: int, status: str) -> bool:
    ensure_ops_tables()
    with _lang_db() as conn:
        cur = _exec(
            conn,
            """
            UPDATE feedback
            SET status = ?
            WHERE id = ?
            """,
            (status, int(feedback_id)),
        )
        return (getattr(cur, "rowcount", 0) or 0) > 0


def is_admin_user(user_id: int | None) -> bool:
    if user_id is None:
        return False
    return int(user_id) in ADMIN_USER_IDS


def admin_ids_configured() -> bool:
    return bool(ADMIN_USER_IDS)


def _count_c(conn: Any, sql: str, params: tuple = ()) -> int:
    row = _exec(conn, sql, params).fetchone()
    if not row:
        return 0
    if isinstance(row, dict) or hasattr(row, "keys"):
        v = row.get("c") if hasattr(row, "get") else row["c"]
    else:
        v = row[0]
    return int(v or 0)


def build_health_snapshot() -> dict[str, Any]:
    ensure_ops_tables()
    snapshot: dict[str, Any] = {
        "app_started_at": APP_STARTED_AT.isoformat(),
        "db_ok": False,
        "has_quran": False,
        "has_hadith": False,
        "user_count": 0,
        "feedback_new": 0,
        "events_last_15m": 0,
        "last_event_at": None,
        "quran_rows": 0,
        "hadith_rows": 0,
    }

    with _lang_db() as conn:
        snapshot["db_ok"] = True
        tables = table_names(conn)
        snapshot["has_quran"] = "quran" in tables
        snapshot["has_hadith"] = "hadith" in tables
        if "user_preferences" in tables:
            snapshot["user_count"] = _count_c(conn, "SELECT COUNT(*) AS c FROM user_preferences", ())
        snapshot["feedback_new"] = _count_c(
            conn, "SELECT COUNT(*) AS c FROM feedback WHERE status = 'new'", ()
        )
        if is_psycopg_connection(conn):
            snapshot["events_last_15m"] = _count_c(
                conn,
                """
                SELECT COUNT(*) AS c
                FROM event_log
                WHERE created_at >= CURRENT_TIMESTAMP - (%s::int * INTERVAL '1 minute')
                """,
                (RECENT_EVENT_WINDOW_MINUTES,),
            )
        else:
            snapshot["events_last_15m"] = _count_c(
                conn,
                """
                SELECT COUNT(*) AS c
                FROM event_log
                WHERE created_at >= datetime('now', ?)
                """,
                (f"-{RECENT_EVENT_WINDOW_MINUTES} minutes",),
            )
        row = _exec(conn, "SELECT MAX(created_at) AS m FROM event_log", ()).fetchone()
        snapshot["last_event_at"] = (row.get("m") if hasattr(row, "get") else row["m"]) if row else None
        if snapshot["has_quran"]:
            snapshot["quran_rows"] = _count_c(conn, "SELECT COUNT(*) AS c FROM quran", ())
        if snapshot["has_hadith"]:
            snapshot["hadith_rows"] = _count_c(conn, "SELECT COUNT(*) AS c FROM hadith", ())

    return snapshot


def build_analytics_summary(*, hours: int = 24) -> dict[str, Any]:
    ensure_ops_tables()
    h = max(1, int(hours))
    summary: dict[str, Any] = {
        "hours": h,
        "events": 0,
        "active_users": 0,
        "top_events": [],
        "gemini_proxy_rows": [],
        "gemini_proxy_total": 0,
        "feedback_by_category": {},
        "feedback_open": 0,
        "last_event_at": None,
    }

    with _lang_db() as conn:
        if is_psycopg_connection(conn):
            summary["events"] = _count_c(
                conn,
                """
                SELECT COUNT(*) AS c
                FROM event_log
                WHERE created_at >= CURRENT_TIMESTAMP - (%s::int * INTERVAL '1 hour')
                """,
                (h,),
            )
            summary["active_users"] = _count_c(
                conn,
                """
                SELECT COUNT(*) AS c
                FROM (
                    SELECT DISTINCT user_id FROM event_log
                    WHERE created_at >= CURRENT_TIMESTAMP - (%s::int * INTERVAL '1 hour')
                      AND user_id IS NOT NULL
                ) t
                """,
                (h,),
            )
            rows = _exec(
                conn,
                """
                SELECT event_name, COUNT(*) AS total
                FROM event_log
                WHERE created_at >= CURRENT_TIMESTAMP - (%s::int * INTERVAL '1 hour')
                GROUP BY event_name
                ORDER BY total DESC, event_name ASC
                LIMIT 8
                """,
                (h,),
            ).fetchall()
            ph = ",".join(["%s"] * len(GEMINI_PROXY_EVENT_NAMES))
            gem_rows = conn.execute(
                f"""
                SELECT event_name, COUNT(*) AS total
                FROM event_log
                WHERE created_at >= CURRENT_TIMESTAMP - (%s::int * INTERVAL '1 hour')
                  AND event_name IN ({ph})
                GROUP BY event_name
                ORDER BY total DESC, event_name ASC
                """,
                (h,) + GEMINI_PROXY_EVENT_NAMES,
            ).fetchall()
        else:
            hp = f"-{h} hours"
            summary["events"] = _count_c(
                conn,
                """
                SELECT COUNT(*) AS c
                FROM event_log
                WHERE created_at >= datetime('now', ?)
                """,
                (hp,),
            )
            summary["active_users"] = _count_c(
                conn,
                """
                SELECT COUNT(*) AS c
                FROM event_log
                WHERE created_at >= datetime('now', ?)
                  AND user_id IS NOT NULL
                """,
                (hp,),
            )
            rows = _exec(
                conn,
                """
                SELECT event_name, COUNT(*) AS total
                FROM event_log
                WHERE created_at >= datetime('now', ?)
                GROUP BY event_name
                ORDER BY total DESC, event_name ASC
                LIMIT 8
                """,
                (hp,),
            ).fetchall()
            placeholders = ",".join("?" * len(GEMINI_PROXY_EVENT_NAMES))
            gem_rows = _exec(
                conn,
                f"""
                SELECT event_name, COUNT(*) AS total
                FROM event_log
                WHERE created_at >= datetime('now', ?)
                  AND event_name IN ({placeholders})
                GROUP BY event_name
                ORDER BY total DESC, event_name ASC
                """,
                (hp,) + GEMINI_PROXY_EVENT_NAMES,
            ).fetchall()
        summary["top_events"] = [dict(row) for row in rows]
        summary["gemini_proxy_rows"] = [dict(row) for row in gem_rows]
        summary["gemini_proxy_total"] = sum(int(r["total"]) for r in gem_rows)

        summary["feedback_open"] = _count_c(
            conn, "SELECT COUNT(*) AS c FROM feedback WHERE status = 'new'", ()
        )
        if is_psycopg_connection(conn):
            feedback_rows = _exec(
                conn,
                """
                SELECT category, COUNT(*) AS total
                FROM feedback
                WHERE created_at >= CURRENT_TIMESTAMP - (%s::int * INTERVAL '1 hour')
                GROUP BY category
                ORDER BY total DESC, category ASC
                """,
                (h,),
            ).fetchall()
        else:
            feedback_rows = _exec(
                conn,
                """
                SELECT category, COUNT(*) AS total
                FROM feedback
                WHERE created_at >= datetime('now', ?)
                GROUP BY category
                ORDER BY total DESC, category ASC
                """,
                (f"-{h} hours",),
            ).fetchall()
        summary["feedback_by_category"] = {
            row["category"]: int(row["total"]) for row in feedback_rows
        }
        row = _exec(conn, "SELECT MAX(created_at) AS m FROM event_log", ()).fetchone()
        summary["last_event_at"] = (row.get("m") if hasattr(row, "get") else row["m"]) if row else None

    return summary


def _existing_columns(table_name: str) -> set[str]:
    t = table_name.lower()
    with _lang_db() as conn:
        if is_sqlite_connection(conn):
            rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
            return {str(row[1]).lower() for row in rows}
        if is_psycopg_connection(conn):
            rows = conn.execute(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = 'public' AND lower(table_name) = %s
                """,
                (t,),
            ).fetchall()
            return {str(r["column_name"]).lower() for r in rows}
    return set()


def _count_nonempty_rows(table_name: str, columns: list[str]) -> int:
    if not columns:
        return 0
    checks = " OR ".join(
        f"NULLIF(TRIM(COALESCE({column}, '')), '') IS NOT NULL" for column in columns
    )
    with _lang_db() as conn:
        return _count_c(conn, f"SELECT COUNT(*) AS c FROM {table_name} WHERE {checks}", ())


def build_translation_coverage_summary() -> dict[str, list[dict[str, Any]]]:
    ensure_ops_tables()
    supported = get_supported_language_codes()
    summaries: dict[str, list[dict[str, Any]]] = defaultdict(list)

    with _lang_db() as conn:
        quran_total = _count_c(conn, "SELECT COUNT(*) AS c FROM quran", ())
        hadith_total = _count_c(conn, "SELECT COUNT(*) AS c FROM hadith", ())

    total_by_table = {"quran": quran_total, "hadith": hadith_total}
    columns_by_table = {
        "quran": _existing_columns("quran"),
        "hadith": _existing_columns("hadith"),
    }

    for table_name in ("quran", "hadith"):
        total = total_by_table[table_name]
        existing = columns_by_table[table_name]
        for code in supported:
            candidate_columns = ["text_kk", "text_kz"] if code == "kk" else [f"text_{code}"]
            usable = [column for column in candidate_columns if column in existing]
            count = _count_nonempty_rows(table_name, usable) if usable else 0
            percent = round((count / total) * 100, 1) if total else 0.0
            summaries[table_name].append(
                {
                    "lang": code,
                    "columns": usable,
                    "count": count,
                    "total": total,
                    "percent": percent,
                }
            )

    return dict(summaries)


def build_content_qa_summary() -> dict[str, Any]:
    coverage = build_translation_coverage_summary()
    recent_content_reports = list_feedback(limit=8, category="content")
    weakest: list[dict[str, Any]] = []

    for table_name, rows in coverage.items():
        for row in rows:
            weakest.append(
                {
                    "table": table_name,
                    "lang": row["lang"],
                    "percent": row["percent"],
                    "count": row["count"],
                    "total": row["total"],
                }
            )

    weakest.sort(key=lambda item: (item["percent"], item["table"], item["lang"]))
    return {
        "coverage": coverage,
        "weakest": weakest[:8],
        "recent_content_reports": recent_content_reports,
    }
