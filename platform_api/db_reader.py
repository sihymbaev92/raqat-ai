# -*- coding: utf-8 -*-
"""Тек оқу: хадис/Құран кестелерінің санағы (платформа API)."""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Any

from app.infrastructure.redis_url import normalize_redis_url
from db.dialect_sql import execute as _exec
from db.get_db import get_db_reader, is_postgresql_configured, sqlite_database_path


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


def get_content_stats() -> dict:
    """
    SQLite дерекқорынан жол санын қайтарады.
    Файл жоқ немесе кесте жоқ болса ok=False.
    """
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
        out: dict = {"ok": True, "path": str(path), "tables": {}}

        if "hadith" in tables:
            total = int(conn.execute("SELECT COUNT(*) FROM hadith").fetchone()[0])
            hadith_block: dict = {"rows": total}
            cols = {
                row[1]
                for row in conn.execute("PRAGMA table_info(hadith)").fetchall()
            }
            if "text_kk" in cols:
                kk = int(
                    conn.execute(
                        """
                        SELECT COUNT(*) FROM hadith
                        WHERE TRIM(COALESCE(text_kk, '')) <> ''
                        """
                    ).fetchone()[0]
                )
                hadith_block["text_kk_filled"] = kk
                hadith_block["text_kk_pct"] = round(100.0 * kk / total, 1) if total else 0.0
            out["tables"]["hadith"] = hadith_block
        else:
            out["tables"]["hadith"] = None

        if "quran" in tables:
            total = int(conn.execute("SELECT COUNT(*) FROM quran").fetchone()[0])
            quran_block: dict = {"rows": total}
            cols = {
                row[1] for row in conn.execute("PRAGMA table_info(quran)").fetchall()
            }
            if "text_kk" in cols:
                kk = int(
                    conn.execute(
                        """
                        SELECT COUNT(*) FROM quran
                        WHERE TRIM(COALESCE(text_kk, '')) <> ''
                        """
                    ).fetchone()[0]
                )
                quran_block["text_kk_filled"] = kk
                quran_block["text_kk_pct"] = round(100.0 * kk / total, 1) if total else 0.0
            out["tables"]["quran"] = quran_block
        else:
            out["tables"]["quran"] = None

        return out
    finally:
        conn.close()
