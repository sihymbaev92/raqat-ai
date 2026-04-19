# -*- coding: utf-8 -*-
import logging
from aiogram import types
from aiogram.utils.keyboard import ReplyKeyboardBuilder

from keyboards.menu import main_menu
from services.language_service import get_user_lang
from services.ops_service import log_event
from services.qibla_service import calculate_qibla, compass_arrow, format_qibla_compass

logger = logging.getLogger("raqat_ai.qibla")

async def qibla_request_handler(message: types.Message):
    logger.info("QIBLA request uid=%s text=%s", getattr(message.from_user, "id", None), message.text)
    log_event(message.from_user.id, "open_qibla")
    kb = ReplyKeyboardBuilder()
    kb.button(text="📍 Локация жіберу", request_location=True)
    await message.answer(
        "🕋 <b>Құбыла Компасы</b>\n\n"
        "Дәл бағыт шығару үшін локацияңызды жіберіңіз.",
        reply_markup=kb.as_markup(resize_keyboard=True),
    )


async def qibla_location_handler(message: types.Message):
    logger.info(
        "QIBLA location uid=%s lat=%s lon=%s",
        getattr(message.from_user, "id", None),
        getattr(message.location, 'latitude', None),
        getattr(message.location, 'longitude', None),
    )
    if not message.location:
        return

    log_event(message.from_user.id, "qibla_location")
    angle = calculate_qibla(message.location.latitude, message.location.longitude)
    arrow, label = compass_arrow(angle)
    text = (
        "🕋 <b>Құбыла компасы</b>\n\n"
        f"Сіздің тұсыңыздан Мәккеге бағыт: <b>{angle:.2f}°</b> {arrow} <b>{label}</b>\n\n"
        f"{format_qibla_compass(angle)}\n\n"
        "<b>Қалай қолдану керек:</b> телефон компасының <b>солтүстігі (N)</b> нақты солтүстікке "
        "сәйкес келетіндей ұстаңыз; сағат тілі бағытында <b>солтүстіктен</b> "
        f"<b>{angle:.1f}°</b> бұрышта құбыла жатыр."
    )
    lang = get_user_lang(message.from_user.id)
    await message.answer(text, reply_markup=main_menu(user_id=message.from_user.id, lang=lang))
