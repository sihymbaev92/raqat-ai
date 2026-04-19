# -*- coding: utf-8 -*-
import asyncio
from unittest.mock import AsyncMock, patch

from services import platform_link_service as pls


def test_ensure_telegram_linked_skips_without_config(monkeypatch):
    monkeypatch.setattr(pls, "RAQAT_PLATFORM_API_BASE", "")
    monkeypatch.setattr(pls, "RAQAT_BOT_LINK_SECRET", "")
    assert asyncio.run(pls.ensure_telegram_linked_on_platform(12345)) is False


def test_ensure_telegram_linked_success_saves_bundle(monkeypatch, tmp_path):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_WRITER", raising=False)
    monkeypatch.setattr(pls, "RAQAT_PLATFORM_API_BASE", "http://127.0.0.1:8787")
    monkeypatch.setattr(pls, "RAQAT_BOT_LINK_SECRET", "secret_test_value")

    import services.language_service as ls

    dbp = str(tmp_path / "t.db")
    monkeypatch.setattr(ls, "DB_PATH", dbp)

    from services.language_service import get_platform_token_bundle, set_user_lang

    set_user_lang(999001, "kk")

    mock_resp = AsyncMock()
    mock_resp.status_code = 200
    mock_resp.json = lambda: {
        "ok": True,
        "access_token": "acc_test",
        "refresh_token": "ref_test",
        "expires_in": 1800,
        "platform_user_id": "550e8400-e29b-41d4-a716-446655440000",
        "telegram_user_id": 999001,
        "scopes": ["ai", "content", "user"],
    }
    mock_resp.text = ""

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_resp)

    with patch("services.platform_link_service.httpx.AsyncClient", return_value=mock_client):
        ok = asyncio.run(pls.ensure_telegram_linked_on_platform(999001))

    assert ok is True
    bundle = get_platform_token_bundle(999001)
    assert bundle is not None
    assert bundle.get("access_token") == "acc_test"
    assert bundle.get("platform_user_id") == "550e8400-e29b-41d4-a716-446655440000"


def test_clear_platform_token_bundle(monkeypatch, tmp_path):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_WRITER", raising=False)
    import services.language_service as ls

    dbp = str(tmp_path / "clear_bundle.db")
    monkeypatch.setattr(ls, "DB_PATH", dbp)

    from services.language_service import (
        clear_platform_token_bundle,
        get_platform_token_bundle,
        set_platform_token_bundle,
        set_user_lang,
    )

    set_user_lang(42, "kk")
    set_platform_token_bundle(42, {"access_token": "x", "refresh_token": "y"})
    assert get_platform_token_bundle(42) is not None
    clear_platform_token_bundle(42)
    assert get_platform_token_bundle(42) is None


def test_platform_link_pause_and_resume(monkeypatch, tmp_path):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL_WRITER", raising=False)
    import services.language_service as ls

    dbp = str(tmp_path / "pause.db")
    monkeypatch.setattr(ls, "DB_PATH", dbp)

    from services.language_service import (
        get_platform_token_bundle,
        platform_link_paused,
        set_platform_link_paused,
        set_platform_token_bundle,
        set_user_lang,
    )

    set_user_lang(7, "kk")
    set_platform_link_paused(7)
    assert platform_link_paused(7) is True
    assert get_platform_token_bundle(7) == {"_paused": True}
    set_platform_token_bundle(7, {"access_token": "a", "refresh_token": "r"})
    assert platform_link_paused(7) is False
