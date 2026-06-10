# -*- coding: utf-8 -*-
"""POST /api/v1/auth/link/code — mint (Bearer) және redeem (bot secret)."""
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

client = TestClient(app)


def _prep_db(monkeypatch, tmp_path: Path) -> None:
    src = ROOT / "global_clean.db"
    if not src.is_file():
        pytest.skip("global_clean.db missing")
    dst = tmp_path / "link_code_tests.db"
    shutil.copy(src, dst)
    monkeypatch.setenv("RAQAT_DB_PATH", str(dst))
    from db.migrations import run_schema_migrations

    run_schema_migrations(str(dst))


def test_link_code_mint_and_redeem(monkeypatch, tmp_path):
    monkeypatch.setenv("RAQAT_JWT_SECRET", "k" * 32)
    monkeypatch.setenv("RAQAT_BOT_LINK_SECRET", "bot-secret-32chars-minimum-xx")
    _prep_db(monkeypatch, tmp_path)

    from db.password_login import ensure_platform_user_for_password_username
    from jwt_auth import create_token_pair

    pid = ensure_platform_user_for_password_username("link_code_mint_test")
    pair = create_token_pair(
        subject=pid,
        scopes=["ai", "content", "user"],
        platform_user_id=pid,
    )
    access = pair["access_token"]

    mint = client.post(
        "/api/v1/auth/link/code",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert mint.status_code == 200, mint.text
    body = mint.json()
    assert body.get("ok") is True
    code = body.get("code")
    assert isinstance(code, str) and len(code) == 6 and code.isdigit()

    tid_new = 88_001_456
    redeem = client.post(
        "/api/v1/auth/link/code",
        json={"code": code, "telegram_user_id": tid_new},
        headers={"X-Raqat-Bot-Link-Secret": "bot-secret-32chars-minimum-xx"},
    )
    assert redeem.status_code == 200, redeem.text
    rj = redeem.json()
    assert rj.get("access_token")
    assert rj.get("platform_user_id") == body.get("platform_user_id")
    assert rj.get("telegram_user_id") == tid_new

    replay = client.post(
        "/api/v1/auth/link/code",
        json={"code": code, "telegram_user_id": tid_new},
        headers={"X-Raqat-Bot-Link-Secret": "bot-secret-32chars-minimum-xx"},
    )
    assert replay.status_code == 404
