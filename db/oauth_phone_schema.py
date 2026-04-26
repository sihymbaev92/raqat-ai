# -*- coding: utf-8 -*-
"""OAuth (Google/Apple) және телефон OTP ↔ platform_user_id кестелері."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import is_psycopg_connection, is_sqlite_connection


def ensure_oauth_phone_tables(conn: Any) -> None:
    if is_sqlite_connection(conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS platform_oauth_links (
                provider TEXT NOT NULL,
                oauth_subject TEXT NOT NULL,
                platform_user_id TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY (provider, oauth_subject),
                FOREIGN KEY (platform_user_id) REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS platform_phone_logins (
                phone_e164 TEXT PRIMARY KEY NOT NULL,
                platform_user_id TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (platform_user_id) REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS phone_otp_challenges (
                challenge_id TEXT PRIMARY KEY NOT NULL,
                phone_e164 TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_phone_otp_phone ON phone_otp_challenges(phone_e164)"
        )
        return
    if is_psycopg_connection(conn):
        # platform_identities.platform_user_id — UUID (migrate_sqlite_to_postgres BOOTSTRAP_DDL)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS platform_oauth_links (
                provider TEXT NOT NULL,
                oauth_subject TEXT NOT NULL,
                platform_user_id UUID NOT NULL UNIQUE REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (provider, oauth_subject)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS platform_phone_logins (
                phone_e164 TEXT PRIMARY KEY NOT NULL,
                platform_user_id UUID NOT NULL UNIQUE REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS phone_otp_challenges (
                challenge_id TEXT PRIMARY KEY NOT NULL,
                phone_e164 TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_phone_otp_phone ON phone_otp_challenges(phone_e164)"
        )
        return
    raise TypeError(f"Unsupported DB connection: {type(conn)!r}")
