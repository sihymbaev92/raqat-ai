# -*- coding: utf-8 -*-
from aiogram import Dispatcher

from handlers.routes_callbacks import register_callback_handlers
from handlers.routes_commands import register_command_handlers
from handlers.routes_messages import register_message_handlers


def register_all_handlers(dp: Dispatcher) -> None:
    register_command_handlers(dp)
    register_callback_handlers(dp)
    register_message_handlers(dp)
