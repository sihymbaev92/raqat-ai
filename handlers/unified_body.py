# -*- coding: utf-8 -*-
"""Бір батырма: бот ↔ платформа ↔ қолданба JWT (қосу / боттағы токенді өшіру)."""
from __future__ import annotations

from aiogram import types

from services.language_service import (
    get_platform_token_bundle,
    get_user_lang,
    set_platform_link_paused,
    tr,
)
from services.ops_service import log_event
from services.platform_link_service import ensure_telegram_linked_on_platform, platform_link_configured


def _has_saved_access(user_id: int) -> bool:
    b = get_platform_token_bundle(user_id)
    return bool(b and str(b.get("access_token") or "").strip())


async def unified_body_handler(message: types.Message):
    uid = message.from_user.id
    lang = get_user_lang(uid, default="kk")
    log_event(uid, "unified_body_toggle")

    if not platform_link_configured():
        await message.answer(tr("unified_body_api_not_configured", lang))
        return

    if _has_saved_access(uid):
        set_platform_link_paused(uid)
        await message.answer(tr("unified_body_disconnected", lang))
        return

    ok = await ensure_telegram_linked_on_platform(uid)
    if ok:
        await message.answer(tr("unified_body_connected", lang))
    else:
        await message.answer(tr("unified_body_connect_failed", lang))
