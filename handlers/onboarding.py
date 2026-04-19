# -*- coding: utf-8 -*-
from aiogram import types

from handlers.feedback import open_feedback_flow
from handlers.halal import halal_button_handler
from handlers.translation import translation_handler
from keyboards.menu import onboarding_menu
from services.language_service import (
    get_user_lang,
    has_seen_onboarding,
    mark_onboarding_seen,
    tr,
)
from services.ops_service import log_event
from state.memory import USER_STATE

GUIDE_ALIASES = {
    "guide",
    "help",
    "көмек",
    "нұсқаулық",
    "инструкция",
}


def _guide_text(lang: str) -> str:
    if lang == "ru":
        return (
            "🚀 <b>Быстрый старт</b>\n\n"
            "1. Нажмите <b>📖 Коран</b> и начните поиск по слову.\n"
            "2. Нажмите <b>🌐 Перевод</b>, если хотите отдельный язык перевода.\n"
            "3. Для halal-проверки отправьте фото упаковки.\n"
            "4. Если увидите ошибку, отправьте <code>/feedback</code>."
        )
    if lang == "en":
        return (
            "🚀 <b>Quick Start</b>\n\n"
            "1. Open <b>📖 Quran</b> and search by keyword.\n"
            "2. Open <b>🌐 Translation</b> if you want a separate content language.\n"
            "3. For halal checking, send a package photo.\n"
            "4. If you notice an issue, send <code>/feedback</code>."
        )
    return (
        "🚀 <b>Жылдам бастау</b>\n\n"
        "1. <b>📖 ҚҰРАН</b> бөліміне кіріп, сөзбен іздеп көріңіз.\n"
        "2. <b>🌐 Аударма</b> арқылы контент тілін бөлек қойыңыз.\n"
        "3. Halal тексеру үшін қаптама фотосын жіберіңіз.\n"
        "4. Қате не ұсыныс болса, <code>/feedback</code> жіберіңіз."
    )


async def send_onboarding_message(
    message: types.Message,
    *,
    force: bool = False,
    user_id: int | None = None,
) -> bool:
    uid = user_id or message.from_user.id
    if not force and has_seen_onboarding(uid):
        return False

    lang = get_user_lang(uid)
    mark_onboarding_seen(uid)
    log_event(uid, "onboarding_shown")
    await message.answer(
        _guide_text(lang),
        reply_markup=onboarding_menu(lang),
    )
    return True


async def guide_handler(message: types.Message):
    USER_STATE[message.from_user.id] = None
    await send_onboarding_message(message, force=True, user_id=message.from_user.id)


def is_guide_request_text(text: str | None) -> bool:
    normalized = " ".join((text or "").lower().replace("ё", "е").split())
    return normalized in GUIDE_ALIASES


async def guide_text_router(message: types.Message):
    uid = message.from_user.id
    if USER_STATE.get(uid) is not None:
        return
    if not is_guide_request_text(message.text):
        return
    await guide_handler(message)


async def onboarding_callback(callback: types.CallbackQuery):
    uid = callback.from_user.id
    lang = get_user_lang(uid)
    action = (callback.data or "").split(":")[-1]
    mark_onboarding_seen(uid)

    if action == "translation":
        log_event(uid, "onboarding_translation_open")
        await callback.answer()
        await translation_handler(callback.message, user_id=uid)
        return

    if action == "quran_search":
        USER_STATE[uid] = "quran_search"
        log_event(uid, "onboarding_quran_search")
        await callback.message.answer(tr("quran_search_prompt", lang))
        await callback.answer()
        return

    if action == "halal":
        log_event(uid, "onboarding_halal_open")
        await callback.answer()
        await halal_button_handler(callback.message, user_id=uid)
        return

    if action == "feedback":
        log_event(uid, "onboarding_feedback_open")
        await callback.answer()
        await open_feedback_flow(callback.message, user_id=uid)
        return

    await callback.answer("OK", show_alert=False)
