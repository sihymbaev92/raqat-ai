from __future__ import annotations

import sqlite3
from pathlib import Path

from app.core.config import settings


def _redis_readiness_block() -> dict[str, object]:
    """Redis опциялы; `/ready` негізгі `ok` әлі SQLite DB үшін."""
    try:
        from app.infrastructure.redis_client import get_redis_client

        client = get_redis_client()
        if client is None:
            return {"status": "unavailable", "detail": "no_connection_or_ping_failed"}
        return {"status": "ok"}
    except Exception as exc:  # pragma: no cover
        return {"status": "error", "detail": str(exc)[:200]}


def readiness_ping() -> dict[str, object]:
    db_path = Path(settings.db_path)
    if not db_path.is_absolute():
        db_path = (Path(__file__).resolve().parents[3] / db_path).resolve()

    if not db_path.exists():
        return {
            "ok": False,
            "db_path": str(db_path),
            "reason": "db_not_found",
            "redis": _redis_readiness_block(),
        }

    try:
        conn = sqlite3.connect(str(db_path))
        conn.execute("SELECT 1")
        conn.close()
        return {"ok": True, "db_path": str(db_path), "redis": _redis_readiness_block()}
    except Exception as exc:  # pragma: no cover
        return {"ok": False, "db_path": str(db_path), "reason": str(exc), "redis": _redis_readiness_block()}

