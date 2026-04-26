# -*- coding: utf-8 -*-
"""
Telegram бот ↔ орталық DB: user_preferences, bookmarks, stats.
Барлық жазу/оқу `X-Raqat-Bot-Sync-Secret` + `RAQAT_BOT_SYNC_SECRET` (сервер .env).
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from bot_sync_security import require_bot_sync_secret
from db.dialect_sql import execute as _exec
from db.dialect_sql import table_names

router = APIRouter(prefix="/api/v1/bot/sync", tags=["bot-sync"])


class BotUserUpsert(BaseModel):
    user_id: int = Field(..., description="Telegram user id")
    lang: str = Field("kk", min_length=2, max_length=12)
    username: str | None = None
    full_name: str | None = None


class BotBookmarkCreate(BaseModel):
    user_id: int
    surah: int = Field(..., ge=1, le=114)
    ayah: int = Field(..., ge=1)
    text_ar: str = ""
    text_lang: str = ""


def _require_tables(conn: Any, need: set[str]) -> None:
    have = table_names(conn)
    missing = need - have
    if missing:
        raise HTTPException(
            503,
            detail={"code": "SCHEMA_MISSING", "missing": sorted(missing)},
        )


def _upsert_user_preferences(conn: Any, body: BotUserUpsert) -> None:
    _require_tables(conn, {"user_preferences"})
    uid = int(body.user_id)
    lc = (body.lang or "kk").strip() or "kk"
    un = (body.username or "").strip() or None
    fn = (body.full_name or "").strip() or None
    row = _exec(conn, "SELECT user_id FROM user_preferences WHERE user_id = ?", (uid,)).fetchone()
    if row:
        _exec(
            conn,
            """
            UPDATE user_preferences SET
                lang_code = ?,
                telegram_username = COALESCE(?, telegram_username),
                full_name = COALESCE(?, full_name),
                updated_at = datetime('now')
            WHERE user_id = ?
            """,
            (lc, un, fn, uid),
        )
    else:
        _exec(
            conn,
            """
            INSERT INTO user_preferences (user_id, lang_code, telegram_username, full_name, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            """,
            (uid, lc, un, fn),
        )


@router.post("/user")
def bot_sync_user_upsert(
    body: BotUserUpsert,
    _: None = Depends(require_bot_sync_secret),
):
    from db.get_db import get_db_writer

    with get_db_writer() as conn:
        _upsert_user_preferences(conn, body)
        if hasattr(conn, "commit"):
            try:
                conn.commit()
            except Exception:
                pass
    return {"ok": True}


@router.get("/user/{user_id}/lang")
def bot_sync_user_lang(
    user_id: int,
    _: None = Depends(require_bot_sync_secret),
):
    from db.get_db import get_db_writer

    with get_db_writer() as conn:
        _require_tables(conn, {"user_preferences"})
        row = _exec(
            conn,
            "SELECT lang_code FROM user_preferences WHERE user_id = ? LIMIT 1",
            (int(user_id),),
        ).fetchone()
    if not row:
        return {"ok": True, "lang": "kk"}
    lang = row["lang_code"] if isinstance(row, dict) else row[0]
    return {"ok": True, "lang": (lang or "kk").strip() or "kk"}


@router.post("/bookmark")
def bot_sync_bookmark_add(
    body: BotBookmarkCreate,
    _: None = Depends(require_bot_sync_secret),
):
    from db.get_db import get_db_writer

    with get_db_writer() as conn:
        _require_tables(conn, {"user_preferences", "bookmarks"})
        _upsert_user_preferences(
            conn,
            BotUserUpsert(user_id=body.user_id, lang="kk"),
        )
        _exec(
            conn,
            """
            INSERT INTO bookmarks (user_id, surah, ayah, text_ar, text_lang)
            VALUES (?, ?, ?, ?, ?)
            """,
            (int(body.user_id), int(body.surah), int(body.ayah), body.text_ar or "", body.text_lang or ""),
        )
        if hasattr(conn, "commit"):
            try:
                conn.commit()
            except Exception:
                pass
    return {"ok": True}


@router.get("/bookmarks/{user_id}")
def bot_sync_bookmarks_list(
    user_id: int,
    limit: int = 20,
    _: None = Depends(require_bot_sync_secret),
):
    from db.get_db import get_db_writer

    lim = max(1, min(int(limit), 100))
    with get_db_writer() as conn:
        _require_tables(conn, {"bookmarks"})
        rows = _exec(
            conn,
            """
            SELECT id, user_id, surah, ayah, text_ar, text_lang, created_at
            FROM bookmarks WHERE user_id = ?
            ORDER BY id DESC LIMIT ?
            """,
            (int(user_id), lim),
        ).fetchall()
    out = []
    for r in rows:
        out.append(dict(r))
    return {"ok": True, "items": out}


@router.get("/stats")
def bot_sync_stats(_: None = Depends(require_bot_sync_secret)):
    from db.get_db import get_db_writer

    with get_db_writer() as conn:
        tables = table_names(conn)
        users = 0
        marks = 0
        if "user_preferences" in tables:
            row = _exec(conn, "SELECT COUNT(*) AS c FROM user_preferences", ()).fetchone()
            users = int(row["c"] if isinstance(row, dict) else row[0])
        if "bookmarks" in tables:
            row = _exec(conn, "SELECT COUNT(*) AS c FROM bookmarks", ()).fetchone()
            marks = int(row["c"] if isinstance(row, dict) else row[0])
    return {"ok": True, "users": users, "bookmarks": marks}


@router.get("/user-ids")
def bot_sync_user_ids(_: None = Depends(require_bot_sync_secret)):
    from db.get_db import get_db_writer

    with get_db_writer() as conn:
        _require_tables(conn, {"user_preferences"})
        rows = _exec(conn, "SELECT user_id FROM user_preferences", ()).fetchall()
    ids = [int(r["user_id"]) for r in rows]
    return {"ok": True, "user_ids": ids}
