# -*- coding: utf-8 -*-
"""Дауысты жауап (TTS): HTML-дан тазалау және synthesize_speech."""
from __future__ import annotations

import asyncio
import logging
import re

from aiogram import types
from aiogram.types import BufferedInputFile

from services.genai_service import synthesize_speech
from services.language_service import get_user_voice_reply_enabled

logger = logging.getLogger("raqat_ai.tts")


def plain_text_for_tts(html_or_text: str) -> str:
    """Тегтерді алып тастайды — TTS тек мәтінді оқиды."""
    if not html_or_text:
        return ""
    t = re.sub(r"<[^>]+>", " ", html_or_text)
    return " ".join(t.split())


async def send_tts_if_enabled(message: types.Message, text: str, lang: str) -> None:
    """Қолданушыда дауысты жауап қосулы болса, аудио жібереді."""
    if not get_user_voice_reply_enabled(message.from_user.id):
        return
    cleaned = plain_text_for_tts(text)
    if not cleaned.strip():
        return

    payload = await asyncio.to_thread(synthesize_speech, cleaned, lang)
    if not payload:
        return

    audio_bytes, _mime_type, filename = payload
    try:
        await message.answer_audio(
            audio=BufferedInputFile(audio_bytes, filename=filename),
            title="RAQAT Voice",
            performer="RAQAT AI · КӨМЕКШІ",
        )
    except Exception as exc:
        logger.warning("TTS send failed uid=%s: %s", message.from_user.id, exc)
