# -*- coding: utf-8 -*-
from aiogram import Dispatcher

from handlers.routes_callbacks_core import register_core_callback_handlers
from handlers.routes_callbacks_features import register_feature_callback_handlers


def register_callback_handlers(dp: Dispatcher) -> None:
    register_core_callback_handlers(dp)
    register_feature_callback_handlers(dp)
