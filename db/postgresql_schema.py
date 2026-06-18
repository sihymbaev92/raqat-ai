# -*- coding: utf-8 -*-
"""PostgreSQL bootstrap schema shared by API startup and migration tooling."""
from __future__ import annotations

from typing import Any

from db.dialect_sql import is_psycopg_connection

POSTGRESQL_CORE_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS platform_identities (
    platform_user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT UNIQUE,
    apple_sub TEXT UNIQUE,
    google_sub TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS platform_ai_chat_messages (
    id BIGSERIAL PRIMARY KEY,
    platform_user_id UUID NOT NULL REFERENCES platform_identities(platform_user_id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    body TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'unknown',
    client_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS revoked_refresh_jti (
    jti TEXT PRIMARY KEY NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS api_usage_ledger (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    route TEXT NOT NULL,
    platform_user_id UUID REFERENCES platform_identities(platform_user_id) ON DELETE SET NULL,
    telegram_user_id BIGINT,
    source_auth TEXT NOT NULL,
    units INTEGER NOT NULL DEFAULT 1,
    prompt_chars INTEGER,
    response_chars INTEGER,
    meta_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS quran (
    id BIGINT PRIMARY KEY,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    surah_name TEXT,
    text_ar TEXT,
    text_kk TEXT,
    text_ru TEXT,
    text_en TEXT,
    translit TEXT,
    updated_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS hadith (
    id BIGINT PRIMARY KEY,
    source TEXT,
    text_ar TEXT,
    text_kk TEXT,
    text_ru TEXT,
    text_en TEXT,
    grade TEXT,
    updated_at TIMESTAMPTZ,
    is_repeated SMALLINT NOT NULL DEFAULT 0,
    original_id BIGINT NULL
);
CREATE INDEX IF NOT EXISTS idx_platform_identities_telegram ON platform_identities(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_platform_chat_user_id ON platform_ai_chat_messages(platform_user_id, id);
CREATE INDEX IF NOT EXISTS idx_platform_chat_user_created ON platform_ai_chat_messages(platform_user_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_chat_user_client
    ON platform_ai_chat_messages(platform_user_id, client_id)
    WHERE client_id IS NOT NULL AND BTRIM(client_id) <> '';
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_platform ON api_usage_ledger(platform_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_quran_surah_ayah ON quran(surah, ayah);
CREATE INDEX IF NOT EXISTS idx_quran_updated_at ON quran(updated_at);
CREATE INDEX IF NOT EXISTS idx_hadith_updated_at ON hadith(updated_at);
CREATE INDEX IF NOT EXISTS idx_hadith_is_repeated ON hadith(is_repeated);
CREATE INDEX IF NOT EXISTS idx_hadith_original_id ON hadith(original_id);
"""


def ensure_postgresql_core_tables(conn: Any) -> None:
    if not is_psycopg_connection(conn):
        raise TypeError(f"Unsupported PostgreSQL connection: {type(conn)!r}")
    conn.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    conn.execute(POSTGRESQL_CORE_SCHEMA_SQL)


def ensure_postgresql_app_tables(conn: Any) -> None:
    """Create every table required by the FastAPI app in PostgreSQL mode."""
    ensure_postgresql_core_tables(conn)

    from db.community_schema import ensure_community_tables
    from db.oauth_phone_schema import ensure_oauth_phone_tables
    from db.platform_link_code_schema import ensure_platform_link_code_tables
    from db.user_data_schema import ensure_user_data_tables

    ensure_community_tables(conn)
    ensure_user_data_tables(conn)
    ensure_oauth_phone_tables(conn)
    ensure_platform_link_code_tables(conn)
