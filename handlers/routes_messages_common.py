# -*- coding: utf-8 -*-
from aiogram import Dispatcher, F

from handlers.feedback import feedback_handler, feedback_text_router, is_feedback_request_text
from handlers.language import language_text_router
from handlers.onboarding import guide_text_router, is_guide_request_text
from handlers.translation import translation_text_router
from handlers.hadith import hadith_show, hadith_search_router
from services.voice_service import is_language_switch_command
from state.memory import USER_STATE
from services.language_service import menu_text_matches


def _state_is(expected: str):
    return lambda message: USER_STATE.get(message.from_user.id) == expected


def _state_prefix(prefix: str):
    return lambda message: (USER_STATE.get(message.from_user.id) or "").startswith(prefix)


def _menu_action(action: str):
    return lambda message: menu_text_matches(getattr(message, "text", None), action)


def register_common_message_handlers(dp: Dispatcher) -> None:
    dp.message.register(hadith_show, _menu_action("hadith"))
    dp.message.register(feedback_handler, _menu_action("feedback"))
    dp.message.register(guide_text_router, F.text.func(is_guide_request_text))
    dp.message.register(language_text_router, _state_is("language_select"))
    dp.message.register(language_text_router, F.text.func(is_language_switch_command))
    dp.message.register(translation_text_router, _state_is("translation_select"))
    dp.message.register(
        translation_text_router,
        F.text.func(
            lambda t: t
            and any(token in t.lower() for token in ("аударма", "translation", "перевод", "translate", "мағына"))
        ),
    )
    dp.message.register(feedback_text_router, _state_prefix("feedback:"))
    dp.message.register(feedback_text_router, F.text.func(is_feedback_request_text))
    dp.message.register(hadith_search_router, _state_is("hadith_search"))
