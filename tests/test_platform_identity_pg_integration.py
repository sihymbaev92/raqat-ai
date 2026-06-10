# -*- coding: utf-8 -*-
"""Platform identity hot path on PostgreSQL (Sprint 1 #102)."""
from __future__ import annotations

import os

import pytest


@pytest.mark.integration
def test_ensure_platform_user_for_telegram_on_pg(monkeypatch: pytest.MonkeyPatch):
    dsn = (os.getenv("RAQAT_PG_TEST_DSN") or "").strip()
    if not dsn:
        pytest.skip("RAQAT_PG_TEST_DSN орнатылмаған")
    pytest.importorskip("psycopg")

    monkeypatch.setenv("DATABASE_URL", dsn)
    monkeypatch.setenv("DATABASE_URL_WRITER", dsn)
    monkeypatch.setenv("RAQAT_PG_USE_POOL", "1")

    from db.platform_identity_chat import ensure_platform_user_for_telegram

    tid = 9_990_010_102
    pid1 = ensure_platform_user_for_telegram("ignored.db", tid)
    pid2 = ensure_platform_user_for_telegram("ignored.db", tid)
    assert pid1
    assert pid1 == pid2
