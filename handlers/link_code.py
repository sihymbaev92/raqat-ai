# -*- coding: utf-8 -*-
"""6 таңбалы мобильді байланыс коды (Telegram хабарламасы)."""
from __future__ import annotations

from aiogram import types
from aiogram.filters import Command

from services.language_service import get_user_lang, tr
from services.ops_service import log_event
from services.platform_link_code_service import (
    is_platform_link_code_text,
    redeem_platform_link_code_on_platform,
)
from services.platform_link_service import platform_link_configured

_SILENT_ERRORS = frozenset(
    {
        None,
        "UNKNOWN_CODE",
        "INVALID_CODE_FORMAT",
        "http_error",
        "not_configured",
        "invalid_json",
        "no_token",
        "save_failed",
    }
)


async def link_code_message_handler(message: types.Message) -> None:
    uid = message.from_user.id
    lang = get_user_lang(uid, default="kk")
    text = (message.text or "").strip()

    if not is_platform_link_code_text(text):
        return

    log_event(uid, "link_code_redeem_attempt")

    if not platform_link_configured():
        await message.answer(tr("link_code_api_not_configured", lang))
        return

    ok, err = await redeem_platform_link_code_on_platform(uid, text)
    if ok:
        await message.answer(tr("link_code_success", lang))
        return

    if err in _SILENT_ERRORS or (err or "").startswith("http_404"):
        return

    key = {
        "CODE_EXPIRED": "link_code_expired",
        "TELEGRAM_ALREADY_LINKED": "link_code_telegram_taken",
        "PLATFORM_ALREADY_HAS_TELEGRAM": "link_code_platform_has_tg",
    }.get(err or "", "link_code_failed")
    await message.answer(tr(key, lang))


async def link_code_help_handler(message: types.Message) -> None:
    """Қолданба аккаунтын Telegram-ға байлау нұсқаулығы."""
    lang = get_user_lang(message.from_user.id, default="kk")
    await message.answer(tr("link_code_help", lang))
