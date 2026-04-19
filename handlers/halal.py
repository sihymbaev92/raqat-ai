# -*- coding: utf-8 -*-
import asyncio

from aiogram import types

from services.genai_service import analyze_halal_photo
from services.telegram_ai import ask_genai_telegram
from services.halal_service import analyze_halal_text
from services.language_service import get_user_lang
from services.ops_service import log_event
from state.ai_rate_limit import check_ai_rate_limit
from state.memory import USER_STATE


def _is_image_document(doc: types.Document | None) -> bool:
    """Telegram кейде суретті document ретінде жібереді (файл / сурет ретінде емес)."""
    if not doc:
        return False
    mt = (doc.mime_type or "").lower()
    if mt.startswith("image/"):
        return True
    fn = (doc.file_name or "").lower()
    return any(fn.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp", ".heic", ".gif", ".bmp"))


def halal_image_filter(message: types.Message) -> bool:
    """halal_check күйінде: сығылған фото немесе сурет document-і."""
    uid = message.from_user.id
    if USER_STATE.get(uid) != "halal_check":
        return False
    if message.photo:
        return True
    if _is_image_document(message.document):
        return True
    return False


def halal_text_only_filter(message: types.Message) -> bool:
    """halal_check күйінде мәтіндік кіріс: сурет/image document емес."""
    uid = message.from_user.id
    if USER_STATE.get(uid) != "halal_check":
        return False
    if message.photo:
        return False
    if _is_image_document(message.document):
        return False
    return True


async def halal_button_handler(message: types.Message, user_id: int | None = None):
    uid = user_id if user_id is not None else message.from_user.id
    USER_STATE[uid] = "halal_check"
    await message.answer(
        "🥗 <b>HALAL CHECK PRO</b>\n\n"
        "Өнім атауын немесе толық құрамын жазыңыз (немесе құрам суретін жіберіңіз).\n"
        "Алдымен қысқа жергілікті тексеру, содан кейін қажет болса AI қорытындысы.\n"
        "Харам / күмәнді / сенімді тұстар бөлек көрсетіледі."
    )


async def halal_router(message: types.Message):
    uid = message.from_user.id
    if USER_STATE.get(uid) != "halal_check":
        return

    if getattr(message, "photo", None):
        return

    text = (message.text or "").strip()
    result = analyze_halal_text(text)
    await message.answer(result["message"])
    USER_STATE[uid] = None

    if result["status"] == "empty":
        return

    allowed, rate_msg = check_ai_rate_limit(uid)
    if not allowed:
        if rate_msg:
            await message.answer(rate_msg)
        return

    ai_prompt = (
        "Төмендегі өнім не құрамды halal тұрғысынан қысқа сарапта.\n"
        "Формат:\n"
        "1. Негізгі қауіп\n"
        "2. Күмәнді тұс\n"
        "3. Не тексеру керек\n"
        "4. Қысқа қорытынды\n\n"
        "Егер нақты үкім жеткіліксіз болса, ашық айт.\n"
        "Соңғы мәтін 6 қысқа жолдан аспасын.\n\n"
        f"Өнім/құрам: {text}\n"
        f"Local status: {result['status']}"
    )
    ai_result = await ask_genai_telegram(ai_prompt, uid)

    if ai_result.startswith("AI "):
        log_event(uid, "halal_text_ai_fail", detail=ai_result[:120])
        return
    if ai_result.startswith("Сұрақты толық"):
        log_event(uid, "halal_text_ai_fail", detail=ai_result[:120])
        return

    await message.answer(f"🤖 <b>AI Сараптама</b>\n\n{ai_result}")
    log_event(uid, "halal_text_ai", detail=(text or "")[:100])


async def halal_image_router(message: types.Message):
    """
    Сығылған фото (photo) немесе «файл» ретінде жіберілген сурет (document, image/*).
    Тек halal_check күйінде; фильтр: halal_image_filter.
    """
    uid = message.from_user.id

    allowed, rate_msg = check_ai_rate_limit(uid)
    if not allowed:
        if rate_msg:
            await message.answer(rate_msg)
        log_event(uid, "halal_photo_rate_limited")
        return

    lang = get_user_lang(uid) or "kk"
    wait_msg = await message.answer(
        "📷 Суретті талдап жатырмын..." if lang == "kk" else "📷 Analyzing photo..."
    )

    image_bytes: bytes | None = None
    mime_type = "image/jpeg"
    try:
        if message.photo:
            photo = message.photo[-1]
            image_stream = await message.bot.download(photo)
            image_bytes = image_stream.getvalue()
        elif _is_image_document(message.document):
            doc = message.document
            assert doc is not None
            image_stream = await message.bot.download(doc)
            image_bytes = image_stream.getvalue()
            mt = (doc.mime_type or "").lower()
            if mt.startswith("image/"):
                mime_type = mt
            elif (doc.file_name or "").lower().endswith(".png"):
                mime_type = "image/png"
            elif (doc.file_name or "").lower().endswith(".webp"):
                mime_type = "image/webp"
    except Exception:
        await wait_msg.edit_text(
            "Суретті жүктей алмадым." if lang == "kk" else "Could not download photo."
        )
        log_event(uid, "halal_photo_download_fail")
        return

    if not image_bytes:
        await wait_msg.edit_text(
            "Сурет табылмады. Суретті сығылған түрде немесе сурет файлы ретінде жіберіңіз."
            if lang == "kk"
            else "No image found. Send as a photo or as an image file."
        )
        log_event(uid, "halal_photo_empty_payload")
        return

    result = await asyncio.to_thread(
        analyze_halal_photo,
        image_bytes,
        mime_type,
        lang,
    )
    if not result:
        await wait_msg.edit_text(
            "Суреттен анық қорытынды шығарылмады (AI уақытша қолжетімсіз немесе квота). "
            "Қайталаңыз немесе құрамды мәтінмен жіберіңіз."
            if lang == "kk"
            else "Could not analyze the image (AI unavailable or quota). Try again or send ingredients as text."
        )
        log_event(uid, "halal_photo_ai_fail", detail=f"bytes={len(image_bytes)}")
        return

    USER_STATE[uid] = None
    title = "🤖 <b>HALAL · Фото</b>\n\n" if lang == "kk" else "🤖 <b>HALAL · Photo</b>\n\n"
    await wait_msg.edit_text(title + result)
    log_event(uid, "halal_photo_ai", detail=f"bytes={len(image_bytes)} mime={mime_type}")
