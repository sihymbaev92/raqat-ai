# -*- coding: utf-8 -*-
"""Telegram бот: мобильді 6 таңбалы кодты POST /auth/link/code арқылы растау."""
from __future__ import annotations

import logging
import re
from typing import Any

import httpx

from config.settings import RAQAT_BOT_LINK_SECRET, RAQAT_PLATFORM_API_BASE
from services.language_service import set_platform_token_bundle
from services.platform_link_service import platform_link_configured

logger = logging.getLogger(__name__)

_LINK_CODE_RE = re.compile(r"^\d{6}$")


def is_platform_link_code_text(text: str | None) -> bool:
    t = (text or "").strip()
    return bool(_LINK_CODE_RE.match(t))


async def redeem_platform_link_code_on_platform(telegram_user_id: int, code: str) -> tuple[bool, str | None]:
    """
    Сәтті болса (True, None); қате болса (False, error_code).
    """
    if not platform_link_configured():
        return False, "not_configured"

    url = f"{RAQAT_PLATFORM_API_BASE}/api/v1/auth/link/code"
    headers = {"X-Raqat-Bot-Link-Secret": RAQAT_BOT_LINK_SECRET}
    body = {"code": code.strip(), "telegram_user_id": int(telegram_user_id)}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(url, json=body, headers=headers)
    except Exception as e:
        logger.warning("link code redeem HTTP error: %s", e)
        return False, "http_error"

    if r.status_code != 200:
        logger.warning("link code redeem failed: status=%s body=%s", r.status_code, (r.text or "")[:400])
        try:
            detail = r.json().get("detail") or {}
            if isinstance(detail, dict):
                return False, str(detail.get("code") or f"http_{r.status_code}")
        except Exception:
            pass
        return False, f"http_{r.status_code}"

    try:
        data: dict[str, Any] = r.json()
    except Exception:
        return False, "invalid_json"

    access = (data.get("access_token") or "").strip()
    if not access:
        return False, "no_token"

    bundle = {
        "access_token": data.get("access_token"),
        "refresh_token": data.get("refresh_token"),
        "expires_in": data.get("expires_in"),
        "refresh_expires_in": data.get("refresh_expires_in"),
        "scopes": data.get("scopes"),
        "platform_user_id": data.get("platform_user_id"),
        "telegram_user_id": data.get("telegram_user_id"),
    }
    try:
        set_platform_token_bundle(int(telegram_user_id), bundle)
    except Exception:
        logger.exception("link code: failed to save token bundle")
        return False, "save_failed"

    logger.info(
        "link code OK telegram_user_id=%s platform_user_id=%s",
        telegram_user_id,
        data.get("platform_user_id"),
    )
    return True, None
