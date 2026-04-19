# -*- coding: utf-8 -*-
from aiogram import Dispatcher

from handlers.routes_commands_core import register_core_command_handlers
from handlers.routes_commands_features import register_feature_command_handlers


def register_command_handlers(dp: Dispatcher) -> None:
    register_core_command_handlers(dp)
    register_feature_command_handlers(dp)
