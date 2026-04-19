# -*- coding: utf-8 -*-
"""Telegram handler-лер үшін ask_genai: уақыт шегі + қате жұмсақ өңдеу."""
from __future__ import annotations

import asyncio
import logging

from config.settings import RAQAT_BOT_AI_WAIT_TOTAL
from services.genai_service import ask_genai

logger = logging.getLogger("raqat_ai.telegram")


async def ask_genai_telegram(prompt: str, user_id: int | None = None) -> str:
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(ask_genai, prompt, user_id),
            timeout=RAQAT_BOT_AI_WAIT_TOTAL,
        )
    except asyncio.TimeoutError:
        logger.warning(
            "ask_genai timeout uid=%s after %.0fs",
            user_id,
            RAQAT_BOT_AI_WAIT_TOTAL,
        )
        return (
            "⏱️ Жауап күту уақыты бітті. Қысқарақ сұрақ жазыңыз немесе минуттан кейін қайталаңыз."
        )
    except Exception as exc:
        logger.exception("ask_genai failed uid=%s: %s", user_id, exc)
        return "Қосылу кезінде қате шықты. Кейінірек қайта көріңіз."
