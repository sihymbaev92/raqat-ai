# -*- coding: utf-8 -*-
from aiogram import types
from handlers.onboarding import send_onboarding_message
from keyboards.menu import language_menu, main_menu
from services.ops_service import log_event
from services.language_service import get_language_name, get_user_lang, tr
from services.language_service import platform_link_paused
from services.platform_link_service import ensure_telegram_linked_on_platform
from state.memory import USER_STATE

async def start_handler(message: types.Message):
    uid = message.from_user.id
    log_event(uid, "start")
    if not platform_link_paused(uid):
        await ensure_telegram_linked_on_platform(uid)
    USER_STATE[uid] = None
    lang = get_user_lang(uid, default=None) or "kk"

    if get_user_lang(uid, default=None) is None:
        USER_STATE[uid] = "language_select"
        await message.answer(
            tr("choose_language", "en"),
            reply_markup=language_menu(None),
        )
        return

    await message.answer(
        tr("welcome", lang, language=get_language_name(lang)),
        reply_markup=main_menu(user_id=uid, lang=lang),
    )
    await send_onboarding_message(message)
