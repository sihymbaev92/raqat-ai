# -*- coding: utf-8 -*-
"""Телефон OTP және phone_e164 ↔ platform_user_id."""
from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from db.dialect_sql import execute as _exec
from db.dialect_sql import is_psycopg_connection, is_sqlite_connection
from db.get_db import get_db

_E164_RE = re.compile(r"^\+[1-9]\d{6,14}$")


def normalize_phone_e164(raw: str) -> str:
    s = (raw or "").strip().replace(" ", "")
    if not s.startswith("+"):
        s = "+" + s.lstrip("+")
    if not _E164_RE.match(s):
        raise ValueError("invalid_phone_e164")
    return s


def _otp_secret() -> bytes:
    s = (os.getenv("RAQAT_OTP_HMAC_SECRET") or os.getenv("RAQAT_JWT_SECRET") or "").strip()
    if len(s) < 16:
        raise RuntimeError("RAQAT_OTP_HMAC_SECRET or RAQAT_JWT_SECRET (min 16 chars) required for phone OTP")
    return s.encode("utf-8")


def _hash_code(code: str) -> str:
    return hmac.new(_otp_secret(), (code or "").strip().encode("utf-8"), hashlib.sha256).hexdigest()


def create_otp_challenge(phone_e164: str) -> tuple[str, str]:
    """challenge_id, plain_code (6 цифр) — plain_code тек SMS жіберу үшін."""
    phone = normalize_phone_e164(phone_e164)
    cid = str(uuid.uuid4())
    code = f"{secrets.randbelow(1_000_000):06d}"
    exp = datetime.now(timezone.utc) + timedelta(minutes=10)

    with get_db() as conn:
        if is_sqlite_connection(conn):
            _exec(
                conn,
                "DELETE FROM phone_otp_challenges WHERE phone_e164 = ?",
                (phone,),
            )
            _exec(
                conn,
                """
                INSERT INTO phone_otp_challenges (challenge_id, phone_e164, code_hash, expires_at, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
                """,
                (cid, phone, _hash_code(code), exp.strftime("%Y-%m-%d %H:%M:%S")),
            )
        elif is_psycopg_connection(conn):
            conn.execute("DELETE FROM phone_otp_challenges WHERE phone_e164 = %s", (phone,))
            conn.execute(
                """
                INSERT INTO phone_otp_challenges (challenge_id, phone_e164, code_hash, expires_at, created_at)
                VALUES (%s, %s, %s, %s, NOW())
                """,
                (cid, phone, _hash_code(code), exp),
            )
        else:
            raise TypeError(f"Unsupported DB connection: {type(conn)!r}")

    return cid, code


def verify_otp_and_consume(challenge_id: str, code: str) -> str:
    """Сәтті болса phone_e164 қайтарады."""
    cid = (challenge_id or "").strip()
    if not cid:
        raise ValueError("empty_challenge")
    c = (code or "").strip()
    if len(c) != 6 or not c.isdigit():
        raise ValueError("invalid_code_format")

    with get_db() as conn:
        row = _exec(
            conn,
            """
            SELECT phone_e164, code_hash, expires_at FROM phone_otp_challenges
            WHERE challenge_id = ?
            LIMIT 1
            """,
            (cid,),
        ).fetchone()
        if not row:
            raise ValueError("unknown_challenge")
        try:
            phone = str(row["phone_e164"])
            chash = str(row["code_hash"])
            exp_raw = row["expires_at"]
        except Exception:
            phone = str(row[0])
            chash = str(row[1])
            exp_raw = row[2]

        now = datetime.now(timezone.utc)
        if is_sqlite_connection(conn) and isinstance(exp_raw, str):
            try:
                exp_dt = datetime.fromisoformat(exp_raw.replace("Z", "+00:00"))
                if exp_dt.tzinfo is None:
                    exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            except Exception:
                raise ValueError("otp_expired") from None
        else:
            exp_dt = exp_raw if isinstance(exp_raw, datetime) else now
            if getattr(exp_dt, "tzinfo", None) is None and exp_dt is not None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)

        if now > exp_dt:
            _exec(conn, "DELETE FROM phone_otp_challenges WHERE challenge_id = ?", (cid,))
            raise ValueError("otp_expired")

        if not hmac.compare_digest(chash, _hash_code(c)):
            raise ValueError("wrong_code")

        _exec(conn, "DELETE FROM phone_otp_challenges WHERE challenge_id = ?", (cid,))
        return normalize_phone_e164(phone)


def ensure_platform_user_for_phone(phone_e164: str) -> str:
    phone = normalize_phone_e164(phone_e164)
    with get_db() as conn:
        row = _exec(
            conn,
            "SELECT platform_user_id FROM platform_phone_logins WHERE phone_e164 = ? LIMIT 1",
            (phone,),
        ).fetchone()
        if row:
            try:
                return str(row["platform_user_id"])
            except Exception:
                return str(row[0])

        pid = str(uuid.uuid4())
        if is_sqlite_connection(conn):
            _exec(
                conn,
                """
                INSERT INTO platform_identities (platform_user_id, telegram_user_id, created_at, updated_at)
                VALUES (?, NULL, datetime('now'), datetime('now'))
                """,
                (pid,),
            )
            _exec(
                conn,
                """
                INSERT INTO platform_phone_logins (phone_e164, platform_user_id, created_at)
                VALUES (?, ?, datetime('now'))
                """,
                (phone, pid),
            )
            return pid
        if is_psycopg_connection(conn):
            conn.execute(
                """
                INSERT INTO platform_identities (platform_user_id, telegram_user_id, created_at, updated_at)
                VALUES (%s, NULL, NOW(), NOW())
                """,
                (pid,),
            )
            conn.execute(
                """
                INSERT INTO platform_phone_logins (phone_e164, platform_user_id, created_at)
                VALUES (%s, %s, NOW())
                """,
                (phone, pid),
            )
            return pid
        raise TypeError(f"Unsupported DB connection: {type(conn)!r}")
