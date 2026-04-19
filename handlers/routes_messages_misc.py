# -*- coding: utf-8 -*-
from aiogram import Dispatcher, F

from handlers.qibla import qibla_request_handler, qibla_location_handler
from handlers.ai_chat import TRIGGERS, ai_button_handler, ai_router
from handlers.tasbih import tasbih_handler
from handlers.prayer import men_prayer_handler, prayer_handler, purification_handler, women_prayer_handler
from handlers.hajj import hajj_handler
from handlers.halal import (
    halal_button_handler,
    halal_image_filter,
    halal_image_router,
    halal_router,
    halal_text_only_filter,
)
from handlers.unified_body import unified_body_handler
from handlers.language import language_handler
from handlers.fallback import fallback_handler
from services.language_service import menu_text_matches
from state.memory import USER_STATE


def _menu_action(action: str):
    return lambda message: menu_text_matches(getattr(message, "text", None), action)


def _is_ai_prompt(message) -> bool:
    text = (message.text or "").lower()
    if not text:
        return False
    state = USER_STATE.get(message.from_user.id)
    if state is not None and state != "ai_chat":
        return False
    return state == "ai_chat" or text.startswith(TRIGGERS)


def register_misc_message_handlers(dp: Dispatcher) -> None:
    dp.message.register(qibla_request_handler, _menu_action("qibla"))
    dp.message.register(qibla_location_handler, F.location)
    dp.message.register(qibla_request_handler, F.text.func(lambda t: t and ("құбыла" in t.lower() or "qibla" in t.lower())))

    dp.message.register(ai_button_handler, _menu_action("ai"))
    dp.message.register(ai_router, _is_ai_prompt)
    dp.message.register(ai_button_handler, F.text.func(lambda t: t and ("ai" in t.lower() or "рақат" in t.lower() or "raqat" in t.lower())))

    dp.message.register(tasbih_handler, _menu_action("tasbih"))
    dp.message.register(tasbih_handler, F.text.func(lambda t: t and ("тәспі" in t.lower() or "тасбих" in t.lower() or "tasbih" in t.lower())))

    dp.message.register(prayer_handler, _menu_action("prayer"))
    dp.message.register(hajj_handler, _menu_action("hajj"))
    dp.message.register(purification_handler, _menu_action("wudu"))
    dp.message.register(men_prayer_handler, F.text.func(lambda t: t and ("ер намазы" in t.lower() or "ер кісі" in t.lower())))
    dp.message.register(women_prayer_handler, F.text.func(lambda t: t and ("әйел намазы" in t.lower() or "әйел кісі" in t.lower())))
    dp.message.register(prayer_handler, F.text.func(lambda t: t and ("намаз" in t.lower() or "prayer" in t.lower())))
    dp.message.register(
        purification_handler,
        F.text.func(lambda t: t and ("дәрет" in t.lower() or "daret" in t.lower() or "wudu" in t.lower() or "тазалық" in t.lower())),
    )
    dp.message.register(
        hajj_handler,
        F.text.func(lambda t: t and ("қажылық" in t.lower() or "қажы" in t.lower() or "hajj" in t.lower() or "хадж" in t.lower())),
    )

    dp.message.register(halal_button_handler, _menu_action("halal"))
    dp.message.register(unified_body_handler, _menu_action("unified"))
    dp.message.register(language_handler, _menu_action("language"))
    dp.message.register(halal_image_router, F.func(halal_image_filter))
    dp.message.register(halal_router, F.func(halal_text_only_filter))
    dp.message.register(halal_button_handler, F.text.func(lambda t: t and ("halal" in t.lower() or "халал" in t.lower())))

    dp.message.register(fallback_handler)
