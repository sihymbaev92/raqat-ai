# -*- coding: utf-8 -*-
"""GET /api/v1/ai/kb/status — kb_only flag + index stats (Sprint 1 #105)."""
from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import patch

import pytest

pytest.importorskip("httpx")
pytest.importorskip("fastapi")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

import ai_routes  # noqa: E402


@pytest.fixture(autouse=True)
def _ai_anonymous(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("RAQAT_AI_ALLOW_ANONYMOUS", "1")
    for pg_key in ("DATABASE_URL", "DATABASE_URL_WRITER"):
        monkeypatch.delenv(pg_key, raising=False)


def _reload_app():
    from fastapi.testclient import TestClient
    from fastapi import FastAPI

    app = FastAPI()
    app.include_router(ai_routes.router)
    app.dependency_overrides[ai_routes.require_ai_access_with_rate_limit] = lambda: None
    return TestClient(app)


def test_ai_kb_status_kb_only_flag(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("RAQAT_AI_KB_ONLY", "1")

    fake_stats = {"documents": 10, "chunks": 100, "by_site": {"fatua": 5, "muftyat": 5}}

    with patch.object(ai_routes, "islamic_kb_enabled", return_value=True), patch.object(
        ai_routes, "kb_stats", return_value=fake_stats
    ):
        with _reload_app() as client:
            r = client.get("/api/v1/ai/kb/status")
            assert r.status_code == 200, r.text
            body = r.json()
            assert body["ok"] is True
            assert body["enabled"] is True
            assert body["kb_only"] is True
            assert body["documents"] == 10
            assert body["chunks"] == 100


def test_ai_kb_status_disabled_when_kb_off(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("RAQAT_AI_KB_ONLY", raising=False)

    with patch.object(ai_routes, "islamic_kb_enabled", return_value=False):
        with _reload_app() as client:
            r = client.get("/api/v1/ai/kb/status")
            assert r.status_code == 200, r.text
            body = r.json()
            assert body["ok"] is True
            assert body["enabled"] is False
            assert "kb_only" not in body or body.get("kb_only") is not True
