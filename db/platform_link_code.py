# -*- coding: utf-8 -*-
"""6 таңбалы платформа байланыс коды: мобильді JWT ↔ Telegram бот."""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection, is_sqlite_connection
from db.get_db import get_db


def _link_code_secret() -> bytes:
    s = (os.getenv("RAQAT_LINK_CODE_HMAC_SECRET") or os.getenv("RAQAT_JWT_SECRET") or "").strip()
    if len(s) < 16:
        raise RuntimeError(
            "RAQAT_LINK_CODE_HMAC_SECRET or RAQAT_JWT_SECRET (min 16 chars) required for link codes"
        )
    return s.encode("utf-8")


def _hash_code(code: str) -> str:
    return hmac.new(_link_code_secret(), (code or "").strip().encode("utf-8"), hashlib.sha256).hexdigest()


def _ensure_platform_user_exists(conn, platform_user_id: str) -> None:
    row = _exec(
        conn,
        "SELECT platform_user_id FROM platform_identities WHERE platform_user_id = ? LIMIT 1",
        (platform_user_id,),
    ).fetchone()
    if not row:
        raise ValueError("unknown_platform_user")


def mint_platform_link_code(platform_user_id: str, *, ttl_minutes: int = 10) -> tuple[str, int]:
    """
    Жаңа 6 таңбалы код (plain) және TTL секунд.
    Бір platform_user_id үшін ескі кодтар жойылады.
    """
    pid = str(platform_user_id).strip()
    uuid.UUID(pid)
    code = f"{secrets.randbelow(1_000_000):06d}"
    exp = datetime.now(timezone.utc) + timedelta(minutes=max(1, min(ttl_minutes, 30)))
    ttl_sec = int((exp - datetime.now(timezone.utc)).total_seconds())

    with get_db() as conn:
        _ensure_platform_user_exists(conn, pid)
        _exec(
            conn,
            "DELETE FROM platform_link_codes WHERE platform_user_id = ?",
            (pid,),
        )
        if is_sqlite_connection(conn):
            _exec(
                conn,
                """
                INSERT INTO platform_link_codes (code_hash, platform_user_id, expires_at, created_at)
                VALUES (?, ?, ?, datetime('now'))
                """,
                (_hash_code(code), pid, exp.strftime("%Y-%m-%d %H:%M:%S")),
            )
        elif is_psycopg_connection(conn):
            _exec(
                conn,
                """
                INSERT INTO platform_link_codes (code_hash, platform_user_id, expires_at, created_at)
                VALUES (?, ?, ?, NOW())
                """,
                (_hash_code(code), pid, exp),
            )
        else:
            raise TypeError(f"Unsupported DB connection: {type(conn)!r}")

    return code, max(60, ttl_sec)


def redeem_platform_link_code(code: str, telegram_user_id: int) -> str:
    """
    Кодты Telegram id-ге байланыстырады; platform_user_id қайтарады.
    Сәтті болса код жойылады (бір реттік).
    """
    c = (code or "").strip()
    if len(c) != 6 or not c.isdigit():
        raise ValueError("invalid_code_format")
    tid = int(telegram_user_id)
    chash = _hash_code(c)

    with get_db() as conn:
        row = _exec(
            conn,
            """
            SELECT platform_user_id, expires_at FROM platform_link_codes
            WHERE code_hash = ?
            LIMIT 1
            """,
            (chash,),
        ).fetchone()
        if not row:
            raise ValueError("unknown_code")
        pid = str(row["platform_user_id"])
        exp_raw = row["expires_at"]
        if is_sqlite_connection(conn):
            exp = datetime.strptime(str(exp_raw), "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        else:
            exp = exp_raw
            if isinstance(exp, str):
                s = exp.replace("Z", "+00:00")
                exp = datetime.fromisoformat(s)
            if getattr(exp, "tzinfo", None) is None:
                exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp:
            _exec(conn, "DELETE FROM platform_link_codes WHERE code_hash = ?", (chash,))
            raise ValueError("code_expired")

        from db.platform_identity_chat import link_telegram_to_existing_platform_user_on_conn

        link_telegram_to_existing_platform_user_on_conn(conn, pid, tid)
        _exec(conn, "DELETE FROM platform_link_codes WHERE code_hash = ?", (chash,))

    return pid
