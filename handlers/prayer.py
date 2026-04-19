# -*- coding: utf-8 -*-
import logging

from aiogram import types
from aiogram.exceptions import TelegramBadRequest
from aiogram.types import FSInputFile

from services.prayer_content import build_prayer_text
from services.prayer_menu import (
    ALL_SECTION_KEYS,
    MAIN_MENU_INTRO,
    SUBMENU_INTRO,
    SUBMENU_SECTIONS,
    build_leaf_markup,
    build_main_markup,
    build_sub_markup,
    parse_prayer_callback,
)

logger = logging.getLogger("raqat_ai.prayer")


async def _send_prayer_infographics(message: types.Message, section: str) -> None:
    """Қазақ инфографикалары бар тарауларға сурет жіберу (мәтіннен кейін)."""
    from services.prayer_visuals import iter_visual_payloads

    for item in iter_visual_payloads(section):
        cap = (item.get("caption") or "").strip() or None
        try:
            if item.get("kind") == "local" and item.get("path"):
                await message.answer_photo(FSInputFile(item["path"]), caption=cap)
            elif item.get("kind") == "url" and item.get("photo"):
                await message.answer_photo(item["photo"], caption=cap)
        except Exception:
            logger.exception("prayer infographic send failed section=%s item=%s", section, item)


async def prayer_handler(message: types.Message):
    await message.answer(
        MAIN_MENU_INTRO,
        reply_markup=build_main_markup(),
    )


async def purification_handler(message: types.Message):
    """Меню «дәрет» / /wudu — тек дәрет ішкі мәзірін ашады (4 түйме емес, 2)."""
    await message.answer(
        SUBMENU_INTRO["wudu"],
        reply_markup=build_sub_markup("wudu"),
    )


async def send_prayer_section_message(message: types.Message, section: str) -> None:
    """Дауыс және басқа қолданушылар үшін нақты тарауды жіберу."""
    if section not in ALL_SECTION_KEYS:
        section = "times"
    text = build_prayer_text(section)
    markup = build_leaf_markup(section)
    await message.answer(text, reply_markup=markup)
    await _send_prayer_infographics(message, section)


async def men_prayer_handler(message: types.Message):
    await send_prayer_section_message(message, "men")


async def women_prayer_handler(message: types.Message):
    await send_prayer_section_message(message, "women")


async def prayer_callback(callback: types.CallbackQuery):
    kind, value = parse_prayer_callback(callback.data)

    if kind == "menu":
        text = MAIN_MENU_INTRO
        markup = build_main_markup()
    elif kind == "sub":
        sid = value or ""
        if sid not in SUBMENU_SECTIONS:
            text = MAIN_MENU_INTRO
            markup = build_main_markup()
        else:
            text = SUBMENU_INTRO[sid]
            markup = build_sub_markup(sid)
    elif kind == "leaf":
        section = value or "menu"
        if section not in ALL_SECTION_KEYS:
            text = MAIN_MENU_INTRO
            markup = build_main_markup()
        else:
            text = build_prayer_text(section)
            markup = build_leaf_markup(section)
    try:
        await callback.message.edit_text(text, reply_markup=markup)
    except TelegramBadRequest:
        await callback.message.answer(text, reply_markup=markup)

    if kind == "leaf" and (value or "") in ALL_SECTION_KEYS:
        await _send_prayer_infographics(callback.message, value or "")

    await callback.answer()
