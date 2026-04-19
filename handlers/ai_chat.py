# -*- coding: utf-8 -*-
import logging
from aiogram import types
from config.settings import DB_PATH
from db.platform_identity_chat import append_telegram_ai_turn
from services.telegram_ai import ask_genai_telegram
from services.ops_service import log_event
from state.ai_rate_limit import check_ai_rate_limit
from state.memory import USER_STATE

TRIGGERS = ("а raqat", "a raqat", "raqat", "рақат", "а рақат")
logger = logging.getLogger("raqat_ai.ai")


def _extract_ai_prompt(text: str, *, state_trigger: bool) -> str:
    stripped = (text or "").strip()
    if not stripped:
        return ""

    lowered = stripped.lower()
    for trigger in sorted(TRIGGERS, key=len, reverse=True):
        if lowered.startswith(trigger):
            remainder = stripped[len(trigger):]
            return remainder.lstrip(" ,:;!-").strip()

    return stripped if state_trigger else stripped


async def ai_button_handler(message: types.Message):
    logger.info("AI button uid=%s text=%s", getattr(message.from_user, "id", None), message.text)
    log_event(message.from_user.id, "open_ai")
    USER_STATE[message.from_user.id] = "ai_chat"
    await message.answer("🤖 <b>RAQAT AI</b>\n\nСұрағыңызды жазыңыз.")

async def ai_router(message: types.Message):
    logger.info("AI router uid=%s text=%s", getattr(message.from_user, "id", None), message.text)
    text = message.text or ""
    lower = text.lower().strip()
    uid = message.from_user.id

    direct_trigger = any(lower.startswith(trigger) for trigger in TRIGGERS)
    state_trigger = USER_STATE.get(uid) == "ai_chat"

    if not direct_trigger and not state_trigger:
        return

    wait_msg = await message.answer("⏳ Жауап дайындалуда…")
    prompt = _extract_ai_prompt(text, state_trigger=state_trigger)

    if not prompt:
        await wait_msg.edit_text("Сұрақты толық жазыңыз.")
        USER_STATE[uid] = None
        return

    allowed, rate_msg = check_ai_rate_limit(uid)
    if not allowed:
        await wait_msg.edit_text(rate_msg or "⏳ Қысқа күте тұрыңыз.")
        USER_STATE[uid] = None
        return

    log_event(uid, "ai_prompt", detail=prompt[:120])
    result = await ask_genai_telegram(prompt, uid)

    try:
        append_telegram_ai_turn(DB_PATH, uid, prompt, result, source="telegram")
    except Exception as exc:
        logger.warning("append_telegram_ai_turn failed uid=%s: %s", uid, exc)

    try:
        await wait_msg.edit_text(result)
    except Exception:
        try:
            await message.answer(result)
        except Exception as exc:
            logger.warning("Could not deliver AI reply uid=%s: %s", uid, exc)

    USER_STATE[uid] = None
