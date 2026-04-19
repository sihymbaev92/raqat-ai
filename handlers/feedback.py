# -*- coding: utf-8 -*-
from aiogram import types

from keyboards.menu import feedback_menu
from services.language_service import get_user_lang
from services.ops_service import log_event, save_feedback
from state.memory import USER_STATE

FEEDBACK_TRIGGER_ALIASES = {
    "feedback",
    "пікір",
    "кері байланыс",
    "отзыв",
    "обратная связь",
}


def _feedback_text(key: str, lang: str, **kwargs) -> str:
    templates = {
        "open": {
            "kk": "💬 <b>Кері байланыс</b>\n\nНе қалдырғыңыз келеді?\nТүрін таңдаңыз, сосын қысқаша жазыңыз.",
            "ru": "💬 <b>Обратная связь</b>\n\nЧто хотите отправить?\nВыберите тип, затем напишите короткое сообщение.",
            "en": "💬 <b>Feedback</b>\n\nWhat would you like to send?\nChoose a type, then write a short message.",
        },
        "bug": {
            "kk": "🐞 Қай жерде қате болғанын жазыңыз. Қаласаңыз команда/бөлімді де қосыңыз.",
            "ru": "🐞 Опишите ошибку. Если можете, добавьте команду или раздел.",
            "en": "🐞 Describe the bug. If possible, include the command or section.",
        },
        "idea": {
            "kk": "💡 Ұсынысыңызды жазыңыз. Нені жақсартсақ пайдалы болатынын айтыңыз.",
            "ru": "💡 Напишите идею. Расскажите, что было бы полезно улучшить.",
            "en": "💡 Share your idea. Tell us what improvement would be useful.",
        },
        "content": {
            "kk": "🧪 Контент/QA мәселесін жазыңыз. Мысалы: сүре, хадис, аударма немесе мәтіндегі қате.",
            "ru": "🧪 Опишите проблему контента/QA. Например: сура, хадис, перевод или ошибка в тексте.",
            "en": "🧪 Describe the content/QA issue. For example: surah, hadith, translation, or text issue.",
        },
        "saved": {
            "kk": "Рақмет, feedback сақталды. ID: <b>#{feedback_id}</b>",
            "ru": "Спасибо, отзыв сохранен. ID: <b>#{feedback_id}</b>",
            "en": "Thanks, your feedback has been saved. ID: <b>#{feedback_id}</b>",
        },
        "cancelled": {
            "kk": "Кері байланыс жіберу тоқтатылды.",
            "ru": "Отправка обратной связи отменена.",
            "en": "Feedback submission cancelled.",
        },
        "too_short": {
            "kk": "Кемі 4 таңба жазыңыз.",
            "ru": "Напишите хотя бы 4 символа.",
            "en": "Please write at least 4 characters.",
        },
    }
    bucket = templates.get(key, {})
    template = bucket.get(lang) or bucket.get("en") or bucket.get("kk") or key
    return template.format(**kwargs)


def _state_category(uid: int) -> str | None:
    state = USER_STATE.get(uid)
    if not state or not state.startswith("feedback:"):
        return None
    return state.split(":", 1)[1]


def is_feedback_request_text(text: str | None) -> bool:
    normalized = " ".join((text or "").lower().replace("ё", "е").split())
    return normalized in FEEDBACK_TRIGGER_ALIASES


async def open_feedback_flow(message: types.Message, *, user_id: int | None = None) -> None:
    uid = user_id or message.from_user.id
    lang = get_user_lang(uid)
    USER_STATE[uid] = "feedback:select"
    log_event(uid, "feedback_open")
    await message.answer(
        _feedback_text("open", lang),
        reply_markup=feedback_menu(lang),
    )


async def feedback_handler(message: types.Message):
    await open_feedback_flow(message, user_id=message.from_user.id)


async def content_feedback_handler(message: types.Message):
    uid = message.from_user.id
    lang = get_user_lang(uid)
    USER_STATE[uid] = "feedback:content"
    log_event(uid, "feedback_content_open")
    await message.answer(_feedback_text("content", lang))


async def feedback_callback(callback: types.CallbackQuery):
    parts = (callback.data or "").split(":")
    if len(parts) < 2:
        await callback.answer()
        return

    uid = callback.from_user.id
    lang = get_user_lang(uid)
    action = parts[1]

    if action == "open":
        USER_STATE[uid] = "feedback:select"
        await callback.message.answer(
            _feedback_text("open", lang),
            reply_markup=feedback_menu(lang),
        )
        await callback.answer()
        return

    if action == "cancel":
        USER_STATE[uid] = None
        await callback.answer(_feedback_text("cancelled", lang), show_alert=False)
        return

    if action not in {"bug", "idea", "content"}:
        await callback.answer()
        return

    USER_STATE[uid] = f"feedback:{action}"
    log_event(uid, f"feedback_category_{action}")
    await callback.message.answer(_feedback_text(action, lang))
    await callback.answer()


async def feedback_text_router(message: types.Message):
    uid = message.from_user.id
    text = (message.text or "").strip()
    if not text:
        return

    state_category = _state_category(uid)
    if state_category is None:
        if USER_STATE.get(uid) is not None:
            return
        if not is_feedback_request_text(text):
            return
        await open_feedback_flow(message)
        return

    if state_category == "select":
        await open_feedback_flow(message)
        return

    if len(text) < 4:
        await message.answer(_feedback_text("too_short", get_user_lang(uid)))
        return

    feedback_id = save_feedback(uid, state_category, text)
    USER_STATE[uid] = None
    lang = get_user_lang(uid)
    log_event(uid, "feedback_saved", detail=state_category)
    await message.answer(_feedback_text("saved", lang, feedback_id=feedback_id))
