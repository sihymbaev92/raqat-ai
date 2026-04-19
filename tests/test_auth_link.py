# -*- coding: utf-8 -*-
"""POST /api/v1/auth/link/telegram — бот құпиясы, JWT claim-тер, клиент Bearer edge-case."""
from __future__ import annotations

import shutil
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import pytest

pytest.importorskip("httpx")
pytest.importorskip("fastapi")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from fastapi.testclient import TestClient  # noqa: E402

from jwt_auth import decode_access_token  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)


def _copy_db_and_migrate(monkeypatch, tmp_path: Path) -> None:
    src = ROOT / "global_clean.db"
    if not src.is_file():
        pytest.skip("global_clean.db missing")
    dst = tmp_path / "auth_link_tests.db"
    shutil.copy(src, dst)
    monkeypatch.setenv("RAQAT_DB_PATH", str(dst))
    from db.migrations import run_schema_migrations

    run_schema_migrations(str(dst))


def test_link_telegram_bot_secret_returns_uuid_and_scopes(monkeypatch, tmp_path):
    monkeypatch.setenv("RAQAT_JWT_SECRET", "k" * 32)
    monkeypatch.setenv("RAQAT_BOT_LINK_SECRET", "bot-secret-32chars-minimum-xx")
    _copy_db_and_migrate(monkeypatch, tmp_path)
    tid = 77_007_001
    r = client.post(
        "/api/v1/auth/link/telegram",
        json={"telegram_user_id": tid},
        headers={"X-Raqat-Bot-Link-Secret": "bot-secret-32chars-minimum-xx"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True
    assert body.get("access_token")
    assert body.get("refresh_token")
    pid = body.get("platform_user_id")
    assert pid
    uuid.UUID(pid)
    pl = decode_access_token(body["access_token"])
    assert pl.get("sub") == pid
    assert pl.get("telegram_user_id") == tid
    assert "ai" in (pl.get("scopes") or [])

    me = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    mj = me.json()
    assert mj.get("ok") is True
    assert mj.get("platform_user_id") == pid
    assert mj.get("telegram_user_id") == tid


def test_link_telegram_invalid_bot_secret_401(monkeypatch, tmp_path):
    monkeypatch.setenv("RAQAT_JWT_SECRET", "k" * 32)
    monkeypatch.setenv("RAQAT_BOT_LINK_SECRET", "correct-bot-link-secret-here")
    _copy_db_and_migrate(monkeypatch, tmp_path)
    r = client.post(
        "/api/v1/auth/link/telegram",
        json={"telegram_user_id": 1},
        headers={"X-Raqat-Bot-Link-Secret": "wrong"},
    )
    assert r.status_code == 401
    assert r.json().get("detail", {}).get("code") == "INVALID_BOT_LINK_SECRET"


def test_link_telegram_bot_header_but_secret_not_configured_503(monkeypatch, tmp_path):
    monkeypatch.setenv("RAQAT_JWT_SECRET", "k" * 32)
    monkeypatch.delenv("RAQAT_BOT_LINK_SECRET", raising=False)
    _copy_db_and_migrate(monkeypatch, tmp_path)
    r = client.post(
        "/api/v1/auth/link/telegram",
        json={"telegram_user_id": 1},
        headers={"X-Raqat-Bot-Link-Secret": "any"},
    )
    assert r.status_code == 503
    assert r.json().get("detail", {}).get("code") == "LINK_SECRET_NOT_CONFIGURED"


def test_link_telegram_missing_auth_401(monkeypatch, tmp_path):
    monkeypatch.setenv("RAQAT_JWT_SECRET", "k" * 32)
    _copy_db_and_migrate(monkeypatch, tmp_path)
    r = client.post("/api/v1/auth/link/telegram", json={"telegram_user_id": 42})
    assert r.status_code == 401


def test_link_telegram_idempotent_same_telegram_user(monkeypatch, tmp_path):
    monkeypatch.setenv("RAQAT_JWT_SECRET", "k" * 32)
    monkeypatch.setenv("RAQAT_BOT_LINK_SECRET", "idem-bot-secret-32chars-minimum")
    _copy_db_and_migrate(monkeypatch, tmp_path)
    tid = 88_888_001
    h = {"X-Raqat-Bot-Link-Secret": "idem-bot-secret-32chars-minimum"}
    a = client.post("/api/v1/auth/link/telegram", json={"telegram_user_id": tid}, headers=h).json()
    b = client.post("/api/v1/auth/link/telegram", json={"telegram_user_id": tid}, headers=h).json()
    assert a["platform_user_id"] == b["platform_user_id"]


def test_link_telegram_bearer_rejected_not_uuid_sub(monkeypatch, tmp_path):
    """Ескі/қате JWT: sub uuid емес және platform_user_id жоқ → Bearer /link/telegram 400."""
    monkeypatch.setenv("RAQAT_JWT_SECRET", "k" * 32)
    _copy_db_and_migrate(monkeypatch, tmp_path)
    now = datetime.now(timezone.utc)
    legacy = jwt.encode(
        {
            "sub": "admin-username-not-uuid",
            "scopes": ["ai", "content", "user"],
            "typ": "access",
            "sid": str(uuid.uuid4()),
            "iat": int(now.timestamp()),
            "exp": now + timedelta(minutes=30),
        },
        "k" * 32,
        algorithm="HS256",
    )
    r = client.post(
        "/api/v1/auth/link/telegram",
        json={"telegram_user_id": 99_001},
        headers={"Authorization": f"Bearer {legacy}"},
    )
    assert r.status_code == 400
    assert r.json().get("detail", {}).get("code") == "SUB_NOT_PLATFORM_UUID"
