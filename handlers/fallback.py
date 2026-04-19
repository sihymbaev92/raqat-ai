# -*- coding: utf-8 -*-
import logging
from aiogram import types
from keyboards.menu import main_menu
from services.language_service import get_user_lang, tr
from services.ops_service import log_event

logger = logging.getLogger("raqat_ai.fallback")

async def fallback_handler(message: types.Message):
    logger.info("FALLBACK uid=%s text=%s", getattr(message.from_user, "id", None), message.text)
    log_event(message.from_user.id, "fallback_unknown", detail=(message.text or "")[:120])
    lang = get_user_lang(message.from_user.id)
    await message.answer(
        tr("fallback_unknown", lang),
        reply_markup=main_menu(user_id=message.from_user.id, lang=lang),
    )
