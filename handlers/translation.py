# -*- coding: utf-8 -*-

from aiogram import types
from aiogram.exceptions import TelegramBadRequest

from keyboards.menu import translation_menu
from services.language_service import (
    get_language_name,
    get_user_content_lang,
    get_user_content_lang_preference,
    get_user_lang,
    normalize_lang_code,
    set_user_content_lang,
    tr,
)
from services.tts_reply import send_tts_if_enabled
from services.ops_service import log_event
from services.voice_service import extract_language_choice, normalize_voice_text
from state.memory import USER_STATE

TRANSLATION_HINTS = {
    "аударма",
    "аударманы",
    "translation",
    "translate",
    "перевод",
    "перевода",
    "мағына",
}

FOLLOW_UI_HINTS = {
    "интерфейс",
    "interface",
    "same as ui",
    "follow ui",
    "как интерфейс",
}


def _translation_status_label(ui_lang: str, user_id: int) -> str:
    preferred = get_user_content_lang_preference(user_id)
    actual = get_user_content_lang(user_id, default=ui_lang)
    if preferred is None:
        if ui_lang == "ru":
            return f"{get_language_name(actual)} (как интерфейс)"
        if ui_lang == "en":
            return f"{get_language_name(actual)} (follow interface)"
        return f"{get_language_name(actual)} (интерфейс тілімен бірге)"
    return get_language_name(actual)


def _tts_translation_opened(ui_lang: str) -> str:
    """Тек TTS үшін қысқа мәтін (инфографика/меню ұзындығын оқымайды)."""
    lang = normalize_lang_code(ui_lang or "kk")
    phrases = {
        "kk": (
            "Аударма баптауы ашылды. Құран мен хадис мәтінінің тілін "
            "төмендегі түймелерден немесе тізімнен таңдаңыз."
        ),
        "ru": (
            "Открыты настройки перевода. Выберите язык текста Корана и хадисов "
            "кнопками или из списка."
        ),
        "en": (
            "Translation settings are open. Choose the language for Quran and hadith text "
            "using the buttons or list below."
        ),
    }
    return phrases.get(lang) or phrases["en"]


def _translation_menu_text(ui_lang: str, user_id: int) -> str:
    return (
        f"{tr('choose_translation', ui_lang)}\n\n"
        f"{tr('translation_current', ui_lang, language=_translation_status_label(ui_lang, user_id))}"
    )


def _is_translation_request(text: str) -> bool:
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    return any(hint in normalized for hint in TRANSLATION_HINTS)


def _wants_follow_ui(text: str) -> bool:
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    return any(hint in normalized for hint in FOLLOW_UI_HINTS)


async def translation_handler(message: types.Message, *, user_id: int | None = None):
    uid = user_id or message.from_user.id
    ui_lang = get_user_lang(uid)
    USER_STATE[uid] = "translation_select"
    log_event(uid, "translation_open")
    await message.answer(
        _translation_menu_text(ui_lang, uid),
        reply_markup=translation_menu(ui_lang, get_user_content_lang_preference(uid)),
    )
    await send_tts_if_enabled(message, _tts_translation_opened(ui_lang), ui_lang)


async def translation_callback(callback: types.CallbackQuery):
    parts = (callback.data or "").split(":")
    if len(parts) < 2:
        await callback.answer()
        return

    uid = callback.from_user.id
    ui_lang = get_user_lang(uid)
    action = parts[1]

    if action == "open":
        USER_STATE[uid] = "translation_select"
        log_event(uid, "translation_open")
    elif action == "follow_ui":
        set_user_content_lang(uid, None)
        log_event(uid, "translation_saved", detail="follow_ui")
        USER_STATE[uid] = None
    elif action == "set" and len(parts) > 2:
        set_user_content_lang(uid, parts[2])
        log_event(uid, "translation_saved", detail=parts[2])
        USER_STATE[uid] = None
    else:
        await callback.answer()
        return

    try:
        await callback.message.edit_text(
            _translation_menu_text(ui_lang, uid),
            reply_markup=translation_menu(ui_lang, get_user_content_lang_preference(uid)),
        )
    except TelegramBadRequest:
        await callback.message.answer(
            _translation_menu_text(ui_lang, uid),
            reply_markup=translation_menu(ui_lang, get_user_content_lang_preference(uid)),
        )

    preferred = get_user_content_lang_preference(uid)
    if preferred is None:
        confirm = tr(
            "translation_follow_ui",
            ui_lang,
            language=get_language_name(get_user_lang(uid)),
        )
        await callback.answer(confirm, show_alert=False)
        await send_tts_if_enabled(callback.message, confirm, ui_lang)
    else:
        confirm = tr("translation_saved", ui_lang, language=get_language_name(preferred))
        await callback.answer(confirm, show_alert=False)
        await send_tts_if_enabled(callback.message, confirm, ui_lang)


async def translation_text_router(message: types.Message):
    uid = message.from_user.id
    text = (message.text or "").strip()
    if not text:
        return

    state = USER_STATE.get(uid)
    in_translation_mode = state == "translation_select"
    if not in_translation_mode and state is not None:
        return

    if not in_translation_mode and not _is_translation_request(text):
        return

    ui_lang = get_user_lang(uid)

    if _wants_follow_ui(text):
        set_user_content_lang(uid, None)
        USER_STATE[uid] = None
        log_event(uid, "translation_saved", detail="follow_ui")
        txt = tr("translation_follow_ui", ui_lang, language=get_language_name(get_user_lang(uid)))
        await message.answer(txt)
        await send_tts_if_enabled(message, txt, ui_lang)
        return

    choice = extract_language_choice(text)
    if not choice:
        USER_STATE[uid] = "translation_select"
        log_event(uid, "translation_open")
        await message.answer(
            _translation_menu_text(ui_lang, uid),
            reply_markup=translation_menu(ui_lang, get_user_content_lang_preference(uid)),
        )
        await send_tts_if_enabled(message, _tts_translation_opened(ui_lang), ui_lang)
        return

    set_user_content_lang(uid, choice)
    log_event(uid, "translation_saved", detail=choice)
    USER_STATE[uid] = None
    saved = tr("translation_saved", ui_lang, language=get_language_name(choice))
    await message.answer(saved)
    await send_tts_if_enabled(message, saved, ui_lang)
