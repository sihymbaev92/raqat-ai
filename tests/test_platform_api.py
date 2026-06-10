# -*- coding: utf-8 -*-
"""Platform API smoke: /health, контент, refresh rotation (CI -k сүзгісімен сәйкес)."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

import pytest

pytest.importorskip("httpx")
pytest.importorskip("fastapi")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def _copy_db_and_migrate(monkeypatch, tmp_path: Path) -> None:
    src = ROOT / "global_clean.db"
    if not src.is_file():
        pytest.skip("global_clean.db missing")
    dst = tmp_path / "platform_api_tests.db"
    shutil.copy(src, dst)
    monkeypatch.setenv("RAQAT_DB_PATH", str(dst))
    from db.migrations import run_schema_migrations

    run_schema_migrations(str(dst))


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body.get("status") == "ok"
    assert "RAQAT" in (body.get("service") or "") or body.get("service")


def test_quran_surahs_returns_list(client, monkeypatch, tmp_path):
    monkeypatch.delenv("RAQAT_CONTENT_READ_SECRET", raising=False)
    _copy_db_and_migrate(monkeypatch, tmp_path)
    r = client.get("/api/v1/quran/surahs")
    assert r.status_code == 200, r.text
    data = r.json()
    surahs = data.get("surahs")
    assert isinstance(surahs, list) and len(surahs) >= 1


def test_quran_search_endpoint(client, monkeypatch, tmp_path):
    monkeypatch.delenv("RAQAT_CONTENT_READ_SECRET", raising=False)
    _copy_db_and_migrate(monkeypatch, tmp_path)
    r = client.get("/api/v1/quran/search", params={"q": "Алла", "limit": 3})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert isinstance(data.get("items"), list)


def test_hadith_search_endpoint_removed(client, monkeypatch, tmp_path):
    """Хадис API платформадан алынған."""
    monkeypatch.delenv("RAQAT_CONTENT_READ_SECRET", raising=False)
    _copy_db_and_migrate(monkeypatch, tmp_path)
    r = client.get("/api/v1/hadith/search", params={"q": "намаз", "limit": 5})
    assert r.status_code == 404, r.text


def test_hadith_table_reported_in_content_stats(client, monkeypatch, tmp_path):
    """Хадис кестесі жолы — /hadith/search fixture DB схемасына тәуелді емес."""
    _copy_db_and_migrate(monkeypatch, tmp_path)
    r = client.get("/api/v1/stats/content")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    hadith = (data.get("tables") or {}).get("hadith")
    assert hadith is not None
    assert int(hadith.get("rows") or 0) >= 0


def test_refresh_token_roundtrip_and_revokes_old(client, monkeypatch, tmp_path):
    monkeypatch.setenv("RAQAT_JWT_SECRET", "k" * 32)
    monkeypatch.setenv("RAQAT_BOT_LINK_SECRET", "bot-secret-32chars-minimum-xx")
    _copy_db_and_migrate(monkeypatch, tmp_path)
    tid = 77_007_042
    link = client.post(
        "/api/v1/auth/link/telegram",
        json={"telegram_user_id": tid},
        headers={"X-Raqat-Bot-Link-Secret": "bot-secret-32chars-minimum-xx"},
    )
    assert link.status_code == 200, link.text
    first = link.json()
    refresh_a = first["refresh_token"]
    assert refresh_a

    rot = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_a})
    assert rot.status_code == 200, rot.text
    second = rot.json()
    refresh_b = second["refresh_token"]
    assert refresh_b
    assert refresh_b != refresh_a

    replay = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_a})
    assert replay.status_code == 401
    detail = replay.json().get("detail") or {}
    if isinstance(detail, dict):
        assert detail.get("code") == "REFRESH_REVOKED"
