# -*- coding: utf-8 -*-
"""GET/PUT /api/v1/me/quran-last-read — auth payload + SQLite store."""
from __future__ import annotations

import tempfile
import sqlite3
from pathlib import Path

import pytest

pytest.importorskip("httpx")
pytest.importorskip("fastapi")

ROOT = Path(__file__).resolve().parents[1]
PLATFORM_USER_ID = "11111111-1111-7111-8111-111111111111"

from db.migrations import run_schema_migrations


@pytest.fixture()
def auth_client(monkeypatch: pytest.MonkeyPatch):
    for pg_key in ("DATABASE_URL", "DATABASE_URL_WRITER", "DATABASE_URL_READER"):
        monkeypatch.delenv(pg_key, raising=False)

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    monkeypatch.setenv("RAQAT_DB_PATH", db_path)
    run_schema_migrations(db_path)
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            INSERT INTO platform_identities (platform_user_id, created_at, updated_at)
            VALUES (?, datetime('now'), datetime('now'))
            """,
            (PLATFORM_USER_ID,),
        )

    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from platform_api import progress_routes

    app = FastAPI()
    app.include_router(progress_routes.router)
    app.dependency_overrides[progress_routes.get_current_user] = lambda: {"sub": PLATFORM_USER_ID}
    with TestClient(app) as client:
        yield client, {}, db_path

    try:
        Path(db_path).unlink()
    except OSError:
        pass


def test_quran_last_read_get_put_roundtrip(auth_client):
    client, headers, _db = auth_client
    g = client.get("/api/v1/me/quran-last-read", headers=headers)
    assert g.status_code == 200, g.text
    empty = g.json()
    assert empty["ok"] is True
    assert empty.get("global") is None
    assert empty.get("by_surah") == {}

    payload = {
        "global": {"surah": 2, "ayah": 255, "ts": "2026-05-25T00:00:00.000Z"},
        "by_surah": {"2": 255},
    }
    u = client.put("/api/v1/me/quran-last-read", headers=headers, json=payload)
    assert u.status_code == 200, u.text
    body = u.json()
    assert body["ok"] is True
    assert body["global"]["surah"] == 2
    assert body["global"]["ayah"] == 255
    assert body["by_surah"]["2"] == 255

    g2 = client.get("/api/v1/me/quran-last-read", headers=headers)
    assert g2.json()["global"]["ayah"] == 255
