# -*- coding: utf-8 -*-
from aiogram import Dispatcher

from handlers.routes_messages_common import register_common_message_handlers
from handlers.routes_messages_misc import register_misc_message_handlers
from handlers.routes_messages_quran import register_quran_message_handlers


def register_message_handlers(dp: Dispatcher) -> None:
    register_common_message_handlers(dp)
    register_quran_message_handlers(dp)
    register_misc_message_handlers(dp)
