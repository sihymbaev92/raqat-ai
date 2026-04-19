# -*- coding: utf-8 -*-
from aiogram import Dispatcher, F

from handlers.quran import khatm_handler, quran_handler, quran_khatm_router, quran_search_router, tajwid_handler
from services.language_service import menu_text_matches
from state.memory import USER_STATE


def _state_is(expected: str):
    return lambda message: USER_STATE.get(message.from_user.id) == expected


def _menu_action(action: str):
    return lambda message: menu_text_matches(getattr(message, "text", None), action)


def register_quran_message_handlers(dp: Dispatcher) -> None:
    dp.message.register(quran_handler, _menu_action("quran"))
    dp.message.register(quran_search_router, _state_is("quran_search"))
    dp.message.register(quran_khatm_router, _state_is("quran_khatm_set"))
    dp.message.register(quran_handler, F.text.func(lambda t: t and "құран" in t.lower()))
    dp.message.register(tajwid_handler, _menu_action("tajwid"))
    dp.message.register(
        tajwid_handler,
        F.text.func(
            lambda t: t and ("тәжуид" in t.lower() or "tajwid" in t.lower() or "араб әріп" in t.lower() or "арабша әріп" in t.lower())
        ),
    )
    dp.message.register(khatm_handler, _menu_action("khatm"))
    dp.message.register(
        khatm_handler,
        F.text.func(lambda t: t and ("хатым" in t.lower() or "khatm" in t.lower() or "хатм" in t.lower())),
    )
