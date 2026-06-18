# -*- coding: utf-8 -*-
"""Тек оқу: хадис/Құран кестелерінің санағы (платформа API)."""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Any

from app.infrastructure.redis_url import normalize_redis_url
from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection, is_sqlite_connection, table_names
from db.get_db import get_db_reader, is_postgresql_configured, sqlite_database_path

POSTGRESQL_REQUIRED_TABLES = frozenset(
    {
        "platform_identities",
        "platform_ai_chat_messages",
        "revoked_refresh_jti",
        "api_usage_ledger",
        "platform_password_logins",
        "platform_oauth_links",
        "platform_phone_logins",
        "phone_otp_challenges",
        "platform_hatim_read",
        "platform_quran_last_read",
        "platform_quran_ayah_markers",
        "platform_link_codes",
        "community_dua",
        "community_dua_amen",
        "quran",
        "hadith",
    }
)


def resolve_db_path() -> Path:
    """Жолды `db.get_db.sqlite_database_path()` арқылы ботпен бірдей етіп шешеді."""
    return Path(sqlite_database_path())


def _redis_readiness_legacy() -> dict[str, Any]:
    """Опциялы Redis күйі (legacy `main.py` /ready)."""
    try:
        import redis
    except ImportError:
        return {"status": "skipped", "detail": "redis_package_absent"}
    url = normalize_redis_url(os.getenv("RAQAT_REDIS_URL") or "redis://127.0.0.1:6379/0")
    try:
        c = redis.Redis.from_url(url, decode_responses=True)
        c.ping()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "unavailable", "detail": str(e)[:200]}


def readiness_ping() -> dict[str, Any]:
    """
    Kubernetes / балансер readiness: `get_db_reader()` арқылы қысқа сұраныс.
    PostgreSQL немесе SQLite — бір интерфейс.
    """
    backend = "postgresql" if is_postgresql_configured() else "sqlite"
    redis_block = _redis_readiness_legacy()
    try:
        with get_db_reader() as conn:
            _exec(conn, "SELECT 1", ()).fetchone()
            if backend == "postgresql":
                existing = table_names(conn)
                missing = sorted(POSTGRESQL_REQUIRED_TABLES - existing)
                if missing:
                    return {
                        "ok": False,
                        "status": "unready",
                        "backend": backend,
                        "error": "missing_required_tables",
                        "missing_tables": missing,
                        "redis": redis_block,
                    }
    except Exception as e:
        return {
            "ok": False,
            "status": "unready",
            "backend": backend,
            "error": str(e)[:400],
            "redis": redis_block,
        }
    out: dict[str, Any] = {"ok": True, "status": "ready", "backend": backend, "redis": redis_block}
    if (os.getenv("RAQAT_READINESS_REQUIRE_REDIS") or "").strip().lower() in ("1", "true", "yes"):
        if redis_block.get("status") != "ok":
            out["ok"] = False
            out["status"] = "unready"
            out["redis_required"] = True
    return out


def _import_hint_kk() -> str:
    return (
        "Импорт серверде: scripts/import_hadith_from_open_sources.py, "
        "scripts/import_quran_kk_qurankarim.py, содан кейін create_hadith_fts.py "
        "(немесе --db / RAQAT_DB_PATH). API тек оқу: осы stats."
    )


def _scalar_count(row: Any) -> int:
    if row is None:
        return 0
    if isinstance(row, dict):
        return int(next(iter(row.values())))
    return int(row[0])


def _table_column_names_lower(conn: Any, table: str) -> set[str]:
    if table not in ("hadith", "quran"):
        raise ValueError(table)
    if is_sqlite_connection(conn):
        rows = _exec(conn, f"PRAGMA table_info({table})", ()).fetchall()
        return {str(r[1]).lower() for r in rows}
    if is_psycopg_connection(conn):
        rows = _exec(
            conn,
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            """,
            (table.lower(),),
        ).fetchall()
        colset: set[str] = set()
        for r in rows:
            if isinstance(r, dict):
                colset.add(str(r["column_name"]).lower())
            else:
                colset.add(str(r[0]).lower())
        return colset
    return set()


def _fill_content_stats_tables(conn: Any, tables: set[str]) -> dict[str, Any]:
    """hadith / quran / hadith_fts — SQLite немесе PostgreSQL."""
    out_tables: dict[str, Any] = {}

    if "hadith" in tables:
        total = _scalar_count(_exec(conn, "SELECT COUNT(*) AS n FROM hadith", ()).fetchone())
        hadith_block: dict[str, Any] = {"rows": total}
        cols = _table_column_names_lower(conn, "hadith")
        if "text_kk" in cols:
            kk = _scalar_count(
                _exec(
                    conn,
                    """
                    SELECT COUNT(*) AS n FROM hadith
                    WHERE TRIM(COALESCE(text_kk, '')) <> ''
                    """,
                    (),
                ).fetchone()
            )
            hadith_block["text_kk_filled"] = kk
            hadith_block["text_kk_pct"] = round(100.0 * kk / total, 1) if total else 0.0
        out_tables["hadith"] = hadith_block
    else:
        out_tables["hadith"] = None

    if "quran" in tables:
        total = _scalar_count(_exec(conn, "SELECT COUNT(*) AS n FROM quran", ()).fetchone())
        quran_block: dict[str, Any] = {"rows": total}
        cols = _table_column_names_lower(conn, "quran")
        if "text_kk" in cols:
            kk = _scalar_count(
                _exec(
                    conn,
                    """
                    SELECT COUNT(*) AS n FROM quran
                    WHERE TRIM(COALESCE(text_kk, '')) <> ''
                    """,
                    (),
                ).fetchone()
            )
            quran_block["text_kk_filled"] = kk
            quran_block["text_kk_pct"] = round(100.0 * kk / total, 1) if total else 0.0
        out_tables["quran"] = quran_block
    else:
        out_tables["quran"] = None

    if "hadith_fts" in tables:
        try:
            fts_n = _scalar_count(_exec(conn, "SELECT COUNT(*) AS n FROM hadith_fts", ()).fetchone())
            out_tables["hadith_fts"] = {"rows": fts_n}
        except Exception as exc:
            out_tables["hadith_fts"] = {"rows": None, "error": str(exc)[:200]}
    else:
        out_tables["hadith_fts"] = None

    return out_tables


def _get_content_stats_postgresql() -> dict[str, Any]:
    try:
        with get_db_reader() as conn:
            tables = table_names(conn)
            return {
                "ok": True,
                "backend": "postgresql",
                "path": None,
                "tables": _fill_content_stats_tables(conn, tables),
                "import_hint_kk": _import_hint_kk(),
            }
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)[:400],
            "backend": "postgresql",
        }


def get_content_stats() -> dict:
    """
    Құран/хадис жол санын қайтарады.
    PostgreSQL (`DATABASE_URL`) немесе SQLite файл (`RAQAT_DB_PATH` / әдепкі global_clean.db).
    """
    if is_postgresql_configured():
        return _get_content_stats_postgresql()

    path = resolve_db_path()
    if not path.is_file():
        return {
            "ok": False,
            "error": "db_not_found",
            "path": str(path),
        }

    uri = f"file:{path}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    try:
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        return {
            "ok": True,
            "backend": "sqlite",
            "path": str(path),
            "tables": _fill_content_stats_tables(conn, tables),
            "import_hint_kk": _import_hint_kk(),
        }
    finally:
        conn.close()
