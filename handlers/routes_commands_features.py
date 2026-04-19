# -*- coding: utf-8 -*-
from aiogram import Dispatcher
from aiogram.filters import Command

from handlers.quran import khatm_handler, quran_handler, tajwid_handler
from handlers.hadith import hadith_show
from handlers.ai_chat import ai_button_handler
from handlers.qibla import qibla_request_handler
from handlers.tasbih import tasbih_handler
from handlers.prayer import prayer_handler, purification_handler
from handlers.hajj import hajj_handler
from handlers.halal import halal_button_handler
from handlers.unified_body import unified_body_handler


def register_feature_command_handlers(dp: Dispatcher) -> None:
    dp.message.register(quran_handler, Command("quran"))
    dp.message.register(tajwid_handler, Command("tajwid"))
    dp.message.register(khatm_handler, Command("khatm"))
    dp.message.register(hadith_show, Command("hadith"))
    dp.message.register(ai_button_handler, Command("ai"))
    dp.message.register(qibla_request_handler, Command("qibla"))
    dp.message.register(tasbih_handler, Command("tasbih"))
    dp.message.register(prayer_handler, Command("prayer"))
    dp.message.register(hajj_handler, Command("hajj"))
    dp.message.register(purification_handler, Command("wudu"))
    dp.message.register(halal_button_handler, Command("halal"))
    dp.message.register(unified_body_handler, Command("body"))
