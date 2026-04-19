# -*- coding: utf-8 -*-
from aiogram import Dispatcher
from aiogram.filters import Command

from handlers.start import start_handler
from handlers.onboarding import guide_handler
from handlers.language import language_handler
from handlers.translation import translation_handler
from handlers.feedback import content_feedback_handler, feedback_handler
from handlers.admin import admin_handler, feedbacks_handler, health_handler, qa_report_handler, stats_handler


def register_core_command_handlers(dp: Dispatcher) -> None:
    dp.message.register(start_handler, Command("start"))
    dp.message.register(start_handler, Command("menu"))
    dp.message.register(guide_handler, Command("help"))
    dp.message.register(guide_handler, Command("guide"))
    dp.message.register(language_handler, Command("lang"))
    dp.message.register(language_handler, Command("language"))
    dp.message.register(translation_handler, Command("translate"))
    dp.message.register(translation_handler, Command("translation"))
    dp.message.register(feedback_handler, Command("feedback"))
    dp.message.register(content_feedback_handler, Command("report"))
    dp.message.register(admin_handler, Command("admin"))
    dp.message.register(health_handler, Command("health"))
    dp.message.register(stats_handler, Command("stats"))
    dp.message.register(feedbacks_handler, Command("feedbacks"))
    dp.message.register(qa_report_handler, Command("qa_report"))
