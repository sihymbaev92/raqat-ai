# -*- coding: utf-8 -*-
"""Бот ↔ platform_api: POST /auth/link/telegram — identity + JWT (Bearer /users/me, /history)."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from config.settings import RAQAT_BOT_LINK_SECRET, RAQAT_PLATFORM_API_BASE
from services.language_service import set_platform_token_bundle

logger = logging.getLogger(__name__)


def platform_link_configured() -> bool:
    return bool(RAQAT_PLATFORM_API_BASE and RAQAT_BOT_LINK_SECRET)


async def ensure_telegram_linked_on_platform(telegram_user_id: int) -> bool:
    """
    /start кезінде шақырылады: API identity құрады (немесе табады) және JWT береді.
    Жауап `user_preferences.platform_token_bundle` ішінде сақталады.
    """
    if not platform_link_configured():
        logger.debug("platform link skipped: RAQAT_PLATFORM_API_BASE or RAQAT_BOT_LINK_SECRET empty")
        return False

    url = f"{RAQAT_PLATFORM_API_BASE}/api/v1/auth/link/telegram"
    body = {"telegram_user_id": int(telegram_user_id)}
    headers = {"X-Raqat-Bot-Link-Secret": RAQAT_BOT_LINK_SECRET}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(url, json=body, headers=headers)
    except Exception as e:
        logger.warning("platform link HTTP error: %s", e)
        return False

    if r.status_code != 200:
        logger.warning(
            "platform link failed: status=%s body=%s",
            r.status_code,
            (r.text or "")[:500],
        )
        return False

    try:
        data: dict[str, Any] = r.json()
    except Exception:
        logger.warning("platform link: invalid JSON")
        return False

    access = (data.get("access_token") or "").strip()
    if not access:
        logger.warning("platform link: no access_token in response")
        return False

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
        logger.exception("platform link: failed to save token bundle")
        return False

    logger.info(
        "platform link OK for telegram_user_id=%s platform_user_id=%s",
        telegram_user_id,
        data.get("platform_user_id"),
    )
    return True
