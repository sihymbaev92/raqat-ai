# -*- coding: utf-8 -*-
"""
Бірлік тесттер: түбір .env-тегі DATABASE_URL PostgreSQL-ге бұрылмасын — get_db()
SQLite (tmp RAQAT_DB_PATH) қолдануы керек. Интеграциялық PG тесттер осыдан босатылады.
"""
from __future__ import annotations

import os

# Redis жоқ ортада platform_api main импорты үшін (міндетті Redis startup өшіріледі)
os.environ["RAQAT_REDIS_REQUIRED"] = "0"

import pytest


@pytest.fixture(autouse=True)
def _redis_optional_for_api_tests(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RAQAT_REDIS_REQUIRED", "0")


@pytest.fixture(autouse=True)
def _sqlite_mode_for_api_tests(monkeypatch: pytest.MonkeyPatch, request: pytest.FixtureRequest) -> None:
    nodeid = request.node.nodeid
    if "test_pg_migrate_integration" in nodeid:
        return
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_WRITER", raising=False)
    monkeypatch.delenv("DATABASE_URL_READER", raising=False)
    try:
        from db.get_db import close_postgresql_pools

        close_postgresql_pools()
    except Exception:
        pass
