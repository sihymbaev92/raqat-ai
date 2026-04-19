# -*- coding: utf-8 -*-
from aiogram import types
from aiogram.exceptions import TelegramBadRequest

from handlers.onboarding import send_onboarding_message
from keyboards.menu import language_menu, main_menu
from services.language_service import (
    get_language_name,
    get_user_lang,
    set_user_lang,
    tr,
)
from services.ops_service import log_event
from services.voice_service import extract_language_choice, is_language_switch_command
from state.memory import USER_STATE


def _welcome_text(lang: str) -> str:
    return tr("welcome", lang, language=get_language_name(lang))


async def language_handler(message: types.Message):
    log_event(message.from_user.id, "language_open")
    USER_STATE[message.from_user.id] = "language_select"
    current = get_user_lang(message.from_user.id, default=None)
    await message.answer(
        tr("choose_language", current or "en"),
        reply_markup=language_menu(current),
    )


async def language_callback(callback: types.CallbackQuery):
    parts = (callback.data or "").split(":")
    if len(parts) < 2:
        await callback.answer()
        return

    lang = set_user_lang(callback.from_user.id, parts[1])
    log_event(callback.from_user.id, "language_saved", detail=lang)
    USER_STATE[callback.from_user.id] = None
    saved_text = tr("language_saved", lang, language=get_language_name(lang))

    try:
        await callback.message.edit_text(
            tr("choose_language", lang),
            reply_markup=language_menu(lang),
        )
    except TelegramBadRequest:
        pass

    await callback.message.answer(saved_text)
    await callback.message.answer(
        _welcome_text(lang),
        reply_markup=main_menu(user_id=callback.from_user.id, lang=lang),
    )
    await send_onboarding_message(callback.message, user_id=callback.from_user.id)
    await callback.answer()


async def language_text_router(message: types.Message):
    uid = message.from_user.id
    text = (message.text or "").strip()
    if not text:
        return

    state = USER_STATE.get(uid)
    in_language_mode = state == "language_select"
    if not in_language_mode and state is not None:
        return

    if not in_language_mode and not is_language_switch_command(text):
        return

    choice = extract_language_choice(text)
    if not choice:
        current = get_user_lang(uid, default=None)
        await message.answer(
            tr("choose_language", current or "en"),
            reply_markup=language_menu(current),
        )
        return

    lang = set_user_lang(uid, choice)
    log_event(uid, "language_saved", detail=lang)
    USER_STATE[uid] = None
    saved_text = tr("language_saved", lang, language=get_language_name(lang))
    await message.answer(saved_text)
    await message.answer(
        _welcome_text(lang),
        reply_markup=main_menu(user_id=uid, lang=lang),
    )
    await send_onboarding_message(message)
