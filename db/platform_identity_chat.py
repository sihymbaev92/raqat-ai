# -*- coding: utf-8 -*-
"""
Платформа пайдаланушысы: telegram ↔ platform_user_id (uuid).
AI чат тарихы: бот пен platform_api бір кестеден оқиды/жазады.
"""
from __future__ import annotations

import logging
import sqlite3
import uuid
from contextlib import contextmanager
from typing import Any, Iterator

from db.connection import db_conn
from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection
from db.dialect_sql import table_names as _tables
from db.dialect_sql import unique_violation_types

logger = logging.getLogger("raqat_ai.platform_chat")

MAX_BODY_LEN = 20_000

_UNIQUE_INSERT_ERRORS: tuple[type[BaseException], ...] = (
    sqlite3.IntegrityError,
) + unique_violation_types()


def _trim(s: str) -> str:
    t = (s or "").strip()
    if len(t) > MAX_BODY_LEN:
        return t[: MAX_BODY_LEN - 1] + "…"
    return t


@contextmanager
def _platform_db(db_path: str) -> Iterator[Any]:
    """PostgreSQL DSN болса `get_db_writer()`, әйтпесе SQLite `db_path`."""
    from db.get_db import get_db_writer, is_postgresql_configured

    if is_postgresql_configured():
        with get_db_writer() as conn:
            yield conn
    else:
        with db_conn(db_path) as conn:
            yield conn


def ensure_platform_user_for_telegram(db_path: str, telegram_user_id: int) -> str:
    """telegram_user_id үшін platform_user_id қайтарады; қажет болса INSERT."""
    tid = int(telegram_user_id)
    with _platform_db(db_path) as conn:
        if "platform_identities" not in _tables(conn):
            raise RuntimeError("platform_identities missing: run DB migrations")
        row = _exec(
            conn,
            "SELECT platform_user_id FROM platform_identities WHERE telegram_user_id = ?",
            (tid,),
        ).fetchone()
        if row:
            return str(row["platform_user_id"])
        # SQLite: uuid Python-да; PostgreSQL-та әдепкі gen_random_uuid() үшін INSERT бағанасын қысқартқан дұрыс (келесі фаза).
        pid = str(uuid.uuid4())
        try:
            _exec(
                conn,
                """
                INSERT INTO platform_identities (platform_user_id, telegram_user_id, created_at, updated_at)
                VALUES (?, ?, datetime('now'), datetime('now'))
                """,
                (pid, tid),
            )
        except _UNIQUE_INSERT_ERRORS:
            row = _exec(
                conn,
                "SELECT platform_user_id FROM platform_identities WHERE telegram_user_id = ?",
                (tid,),
            ).fetchone()
            if row:
                return str(row["platform_user_id"])
            raise
        return pid


def link_telegram_to_existing_platform_user(
    db_path: str, platform_user_id: str, telegram_user_id: int
) -> None:
    """JWT sub = platform uuid болғанда tg байланысын қояды."""
    tid = int(telegram_user_id)
    pid = str(platform_user_id).strip()
    with _platform_db(db_path) as conn:
        if "platform_identities" not in _tables(conn):
            raise RuntimeError("platform_identities missing: run DB migrations")
        conflict = _exec(
            conn,
            """
            SELECT platform_user_id FROM platform_identities
            WHERE telegram_user_id = ? AND platform_user_id <> ?
            """,
            (tid, pid),
        ).fetchone()
        if conflict:
            raise ValueError("telegram_already_linked")
        row = _exec(
            conn,
            "SELECT platform_user_id, telegram_user_id FROM platform_identities WHERE platform_user_id = ?",
            (pid,),
        ).fetchone()
        if row:
            cur = row["telegram_user_id"]
            if cur is not None and int(cur) != tid:
                raise ValueError("platform_already_has_telegram")
            _exec(
                conn,
                """
                UPDATE platform_identities
                SET telegram_user_id = ?, updated_at = datetime('now')
                WHERE platform_user_id = ?
                """,
                (tid, pid),
            )
        else:
            _exec(
                conn,
                """
                INSERT INTO platform_identities (platform_user_id, telegram_user_id, created_at, updated_at)
                VALUES (?, ?, datetime('now'), datetime('now'))
                """,
                (pid, tid),
            )


def append_ai_exchange(
    db_path: str,
    platform_user_id: str,
    user_text: str,
    assistant_text: str,
    *,
    source: str = "api",
    client_id: str | None = None,
) -> None:
    u = _trim(user_text)
    a = _trim(assistant_text)
    if not u and not a:
        return
    src = (source or "api").strip()[:32] or "api"
    pid = str(platform_user_id).strip()
    cid = (client_id or "").strip()[:128] or None
    with _platform_db(db_path) as conn:
        if "platform_ai_chat_messages" not in _tables(conn):
            return
        if u:
            _exec(
                conn,
                """
                INSERT INTO platform_ai_chat_messages (platform_user_id, role, body, source, client_id, created_at)
                VALUES (?, 'user', ?, ?, ?, datetime('now'))
                """,
                (pid, u, src, cid),
            )
        if a:
            _exec(
                conn,
                """
                INSERT INTO platform_ai_chat_messages (platform_user_id, role, body, source, client_id, created_at)
                VALUES (?, 'assistant', ?, ?, ?, datetime('now'))
                """,
                (pid, a, src, cid),
            )


def append_telegram_ai_turn(
    db_path: str,
    telegram_user_id: int,
    user_text: str,
    assistant_text: str,
    *,
    source: str = "telegram",
) -> None:
    """Бот: tg id бойынша platform_user құрып, екі хабарламаны жазады."""
    try:
        pid = ensure_platform_user_for_telegram(db_path, telegram_user_id)
        append_ai_exchange(db_path, pid, user_text, assistant_text, source=source)
    except Exception:
        logger.exception("append_telegram_ai_turn failed")


def list_user_chat_history(
    db_path: str,
    platform_user_id: str,
    *,
    limit: int,
    before_id: int | None,
    role: str | None,
) -> tuple[list[dict[str, Any]], int | None]:
    """
    Хронологиялық (ескі → жаңа) бір бет.
    next_before_id: келесі «ескірек» бет үшін before_id ретінде жіберіңіз (толық бет болғанда ғана).
    """
    lim = max(1, min(int(limit), 200))
    pid = str(platform_user_id).strip()
    rfilter = (role or "").strip().lower()
    if rfilter not in ("", "user", "assistant"):
        rfilter = ""
    where = "platform_user_id = ?"
    params: list[Any] = [pid]
    if before_id is not None:
        where += " AND id < ?"
        params.append(int(before_id))
    if rfilter:
        where += " AND role = ?"
        params.append(rfilter)
    params.append(lim)
    with _platform_db(db_path) as conn:
        if "platform_ai_chat_messages" not in _tables(conn):
            return [], None
        rows = _exec(
            conn,
            f"""
            SELECT id, role, body, source, client_id, created_at
            FROM platform_ai_chat_messages
            WHERE {where}
            ORDER BY id DESC
            LIMIT ?
            """,
            tuple(params),
        ).fetchall()
    rev = list(reversed(rows))
    items: list[dict[str, Any]] = [
        {
            "id": int(r["id"]),
            "role": str(r["role"]),
            "body": str(r["body"]),
            "source": str(r["source"] or ""),
            "client_id": r["client_id"],
            "created_at": str(r["created_at"] or ""),
        }
        for r in rev
    ]
    next_before = int(rev[0]["id"]) if len(rev) == lim else None
    return items, next_before
