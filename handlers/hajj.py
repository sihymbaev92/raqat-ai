# -*- coding: utf-8 -*-
from aiogram import types
from aiogram.exceptions import TelegramBadRequest

from services.hajj_content import build_hajj_text
from services.hajj_menu import (
    ALL_SECTION_KEYS,
    MAIN_MENU_INTRO,
    SUBMENU_INTRO,
    build_leaf_markup,
    build_main_markup,
    build_sub_markup,
    parse_hajj_callback,
)


async def hajj_handler(message: types.Message):
    await message.answer(MAIN_MENU_INTRO, reply_markup=build_main_markup())


async def hajj_callback(callback: types.CallbackQuery):
    kind, value = parse_hajj_callback(callback.data)

    if kind == "menu":
        text = MAIN_MENU_INTRO
        markup = build_main_markup()
    elif kind == "sub":
        sid = value or ""
        if sid not in (
            "basics",
            "hajj_days",
            "main_rites",
            "umrah",
            "reminders",
        ):
            text = MAIN_MENU_INTRO
            markup = build_main_markup()
        else:
            text = SUBMENU_INTRO.get(sid, MAIN_MENU_INTRO)
            markup = build_sub_markup(sid)
    elif kind == "leaf":
        section = value or ""
        if section not in ALL_SECTION_KEYS:
            text = MAIN_MENU_INTRO
            markup = build_main_markup()
        else:
            text = build_hajj_text(section)
            markup = build_leaf_markup(section)
    else:
        text = MAIN_MENU_INTRO
        markup = build_main_markup()

    try:
        await callback.message.edit_text(text, reply_markup=markup)
    except TelegramBadRequest:
        await callback.message.answer(text, reply_markup=markup)

    await callback.answer()
