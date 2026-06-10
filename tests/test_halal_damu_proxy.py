# -*- coding: utf-8 -*-
"""halaldamu.kz platform proxy — allowlist, cache, routes."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

pytest.importorskip("httpx")
pytest.importorskip("fastapi")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from fastapi.testclient import TestClient  # noqa: E402

from halal_damu_proxy import (  # noqa: E402
    clear_halal_damu_cache,
    fetch_halal_damu_json,
    validate_halal_damu_path,
)
from main import app  # noqa: E402

client = TestClient(app)


def test_validate_path_allowlist():
    assert validate_halal_damu_path("halal-bot/v1/products") == "halal-bot/v1/products"
    assert validate_halal_damu_path("halal-bot/v1/companies/42") == "halal-bot/v1/companies/42"
    with pytest.raises(ValueError, match="path_not_allowed"):
        validate_halal_damu_path("wp/v2/posts")


def test_fetch_caches_successful_response():
    clear_halal_damu_cache()
    payload = {"success": True, "items": []}
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = json.dumps(payload).encode("utf-8")

    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.get.return_value = mock_resp

    with patch("halal_damu_proxy.httpx.Client", return_value=mock_client):
        s1, body1, h1 = fetch_halal_damu_json("halal-bot/v1/products", {"barcode": "4601234567890"})
        s2, body2, h2 = fetch_halal_damu_json("halal-bot/v1/products", {"barcode": "4601234567890"})

    assert s1 == 200 and body1 == payload
    assert h1.get("X-Raqat-Halal-Cache") == "miss"
    assert s2 == 200 and body2 == payload
    assert h2.get("X-Raqat-Halal-Cache") == "hit"
    assert mock_client.get.call_count == 1


def test_proxy_route_status():
    r = client.get("/api/v1/halal-damu/status")
    assert r.status_code == 200
    body = r.json()
    assert body.get("ok") is True
    assert body.get("enabled") is True
    assert "halaldamu" in (body.get("origin") or "")


def test_proxy_route_forbidden_path():
    r = client.get("/api/v1/halal-damu/wp/v2/posts")
    assert r.status_code == 403


def test_cache_clear_requires_secret_when_configured(monkeypatch):
    monkeypatch.setenv("RAQAT_CONTENT_READ_SECRET", "test-secret-123")
    clear_halal_damu_cache()
    denied = client.post("/api/v1/halal-damu/cache/clear")
    assert denied.status_code == 401
    ok = client.post(
        "/api/v1/halal-damu/cache/clear",
        headers={"X-Raqat-Content-Secret": "test-secret-123"},
    )
    assert ok.status_code == 200
    assert ok.json().get("ok") is True


def test_cache_clear_open_when_secret_unset(monkeypatch):
    monkeypatch.delenv("RAQAT_CONTENT_READ_SECRET", raising=False)
    r = client.post("/api/v1/halal-damu/cache/clear")
    assert r.status_code == 200
