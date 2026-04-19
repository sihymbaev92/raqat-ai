# -*- coding: utf-8 -*-
from aiogram import Dispatcher, F

from handlers.hadith import hadith_callback
from handlers.language import language_callback
from handlers.onboarding import onboarding_callback
from handlers.feedback import feedback_callback
from handlers.admin import admin_callback
from handlers.translation import translation_callback


def register_core_callback_handlers(dp: Dispatcher) -> None:
    dp.callback_query.register(hadith_callback, F.data.startswith("hadith:"))
    dp.callback_query.register(language_callback, F.data.startswith("lang:"))
    dp.callback_query.register(onboarding_callback, F.data.startswith("onboarding:"))
    dp.callback_query.register(feedback_callback, F.data.startswith("feedback:"))
    dp.callback_query.register(admin_callback, F.data.startswith("admin:"))
    dp.callback_query.register(translation_callback, F.data.startswith("translate:"))
