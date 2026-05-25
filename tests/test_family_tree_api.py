# -*- coding: utf-8 -*-
"""GET/PUT/POST /api/v1/me/genealogy — жеке отбасылық шежіре."""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

import pytest

pytest.importorskip("httpx")
pytest.importorskip("fastapi")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from db.migrations import run_schema_migrations


@pytest.fixture()
def auth_client(monkeypatch: pytest.MonkeyPatch):
    jwt_secret = "dev_" * 8
    monkeypatch.setenv("RAQAT_JWT_SECRET", jwt_secret)
    monkeypatch.setenv("RAQAT_AUTH_USERNAME", "admin")
    monkeypatch.setenv("RAQAT_AUTH_PASSWORD", "testpass123")
    for pg_key in ("DATABASE_URL", "DATABASE_URL_WRITER", "DATABASE_URL_READER"):
        monkeypatch.setenv(pg_key, "")

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    monkeypatch.setenv("RAQAT_DB_PATH", db_path)
    run_schema_migrations(db_path)

    for mod in ("platform_api.main", "main", "db.get_db"):
        sys.modules.pop(mod, None)

    from fastapi.testclient import TestClient

    from platform_api.main import app

    with TestClient(app) as client:
        r = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "testpass123"},
        )
        assert r.status_code == 200, r.text
        access = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {access}"}
        yield client, headers, db_path

    try:
        os.unlink(db_path)
    except OSError:
        pass


def test_family_tree_empty_then_self(auth_client):
    client, headers, _db = auth_client
    g = client.get("/api/v1/me/genealogy", headers=headers)
    assert g.status_code == 200, g.text
    body = g.json()
    assert body["ok"] is True
    assert body["has_self"] is False

    u = client.put(
        "/api/v1/me/genealogy/self",
        headers=headers,
        json={"name_kk": "Жасulan", "gender": "male", "clan_slug": "argyn", "birth_year": 1990},
    )
    assert u.status_code == 200, u.text
    self_body = u.json()
    assert self_body["has_self"] is True
    assert self_body["self"]["name_kk"] == "Жасulan"
    assert self_body["self"]["clan_slug"] == "argyn"


def test_family_tree_ancestors_and_children(auth_client):
    client, headers, _db = auth_client
    u = client.put(
        "/api/v1/me/genealogy/self",
        headers=headers,
        json={"name_kk": "Мен", "gender": "male"},
    )
    assert u.status_code == 200
    self_id = u.json()["self"]["id"]

    f = client.post(
        "/api/v1/me/genealogy/persons",
        headers=headers,
        json={"name_kk": "Әкем", "relation": "father", "gender": "male"},
    )
    assert f.status_code == 200, f.text

    m = client.post(
        "/api/v1/me/genealogy/persons",
        headers=headers,
        json={"name_kk": "Анам", "relation": "mother", "gender": "female"},
    )
    assert m.status_code == 200, m.text

    gf = client.post(
        "/api/v1/me/genealogy/persons",
        headers=headers,
        json={
            "name_kk": "Атам",
            "relation": "father",
            "gender": "male",
            "relative_to_id": f.json()["person"]["id"],
        },
    )
    assert gf.status_code == 200, gf.text

    c = client.post(
        "/api/v1/me/genealogy/persons",
        headers=headers,
        json={"name_kk": "Балам", "relation": "child", "gender": "male"},
    )
    assert c.status_code == 200, c.text

    g = client.get("/api/v1/me/genealogy", headers=headers)
    assert g.status_code == 200
    view = g.json()
    assert view["has_self"] is True
    assert len(view["parents"]) == 2
    assert len(view["ancestors"]) >= 1
    assert len(view["descendants"]) == 1
    assert view["descendants"][0]["name_kk"] == "Балам"
    assert view["self"]["id"] == self_id


def test_family_tree_requires_auth(auth_client):
    client, _headers, _db = auth_client
    r = client.get("/api/v1/me/genealogy")
    assert r.status_code == 401
