# -*- coding: utf-8 -*-
"""Telegram «/» командалары тізімі — чатта көрінеді (BotFather емес, API арқылы)."""
from __future__ import annotations

import logging

from aiogram import Bot
from aiogram.types import BotCommand

logger = logging.getLogger("raqat_ai.bot_commands")


async def register_default_bot_commands(bot: Bot) -> None:
    """Жеке чаттар үшін негізгі командалар."""
    commands = [
        BotCommand(command="start", description="🏠 Бастау · басты мәзір"),
        BotCommand(command="menu", description="📋 Негізгі мәзір"),
        BotCommand(command="quran", description="📖 Құран"),
        BotCommand(command="hadith", description="📚 Хадис"),
        BotCommand(command="prayer", description="🕌 Намаз"),
        BotCommand(command="hajj", description="🕋 Қажылық"),
        BotCommand(command="wudu", description="💧 Дәрет"),
        BotCommand(command="qibla", description="🧭 Құбыла"),
        BotCommand(command="tasbih", description="📿 Тәсбих"),
        BotCommand(command="halal", description="🥗 Halal тексеру"),
        BotCommand(command="ai", description="🤖 RAQAT AI · КӨМЕКШІ"),
        BotCommand(command="body", description="🔗 Бот + платформа бір дене"),
        BotCommand(command="help", description="❓ Көмек / нұсқаулық"),
        BotCommand(command="lang", description="🌐 Тіл ауыстыру"),
        BotCommand(command="translate", description="🌐 Аударма тілі"),
        BotCommand(command="feedback", description="💬 Кері байланыс"),
    ]
    try:
        await bot.set_my_commands(commands)
        logger.info("Bot commands registered (%s items)", len(commands))
    except Exception as e:
        logger.warning("set_my_commands failed: %s", e)
