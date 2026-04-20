# -*- coding: utf-8 -*-
import asyncio
from html import escape
import logging
import re

from aiogram import types
from handlers.feedback import open_feedback_flow
from handlers.hadith import hadith_show, send_hadith_search_results
from handlers.halal import halal_button_handler
from handlers.onboarding import guide_handler
from handlers.prayer import prayer_handler, send_prayer_section_message
from handlers.qibla import qibla_request_handler
from handlers.quran import (
    SURA_PAGE_SIZE,
    khatm_handler,
    match_surah_from_text,
    quran_handler,
    send_quran_search_results,
    send_quran_audio_message,
    send_repeated_quran_audio_message,
    send_surah_audio_message,
    show_surah_message,
    tajwid_handler,
)
from handlers.start import start_handler
from handlers.tasbih import apply_tasbih_action, send_tasbih_message, tasbih_handler
from handlers.translation import translation_handler
from keyboards.menu import main_menu
from services.genai_service import transcribe_voice_command
from services.telegram_ai import ask_genai_telegram
from services.tts_reply import send_tts_if_enabled
from services.language_service import (
    get_language_name,
    get_user_lang,
    get_user_voice_reply_enabled,
    set_user_content_lang,
    set_user_lang,
    set_user_voice_reply_enabled,
    tr,
)
from services.ops_service import log_event
from services.voice_service import (
    extract_tasbih_action,
    extract_hadith_search_query,
    extract_language_choice,
    extract_quran_search_query,
    extract_voice_mode_toggle,
    is_feedback_request,
    is_guide_request,
    is_language_switch_command,
    is_next_ayah_command,
    is_prev_ayah_command,
    is_repeat_last_command,
    is_translation_menu_request,
    is_translation_switch_command,
    is_voice_help_request,
    match_prayer_section_command,
    normalize_voice_text,
    wants_translation_follow_ui,
    is_halal_section_request,
)
from state.ai_rate_limit import check_ai_rate_limit
from state.memory import USER_STATE, VOICE_CONTEXT

logger = logging.getLogger("raqat_ai.voice")


def _voice_text(key: str, lang: str, **kwargs) -> str:
    templates = {
        "wait": {
            "kk": "🎙 Дауысты танып жатырмын...",
            "ru": "🎙 Распознаю голос...",
            "en": "🎙 Recognizing your voice...",
        },
        "heard": {
            "kk": "🎙 Түсінгенім: <b>{transcript}</b>",
            "ru": "🎙 Я понял: <b>{transcript}</b>",
            "en": "🎙 I heard: <b>{transcript}</b>",
        },
        "unknown": {
            "kk": (
                "Дауысты анық түсіне алмадым.\n\n"
                "Мысалы: <i>Құран</i>, <i>халал</i>, <i>Тәжуид</i>, <i>Хатым</i>, "
                "<i>Ясин аудио</i>, <i>дауыспен басқару</i>, <i>орысша</i> деп айтып көріңіз."
            ),
            "ru": (
                "Не удалось уверенно распознать голос.\n\n"
                "Попробуйте сказать: <i>Коран</i>, <i>Таджвид</i>, "
                "<i>Хатм</i>, <i>Ясин аудио</i>, <i>русский</i>."
            ),
            "en": (
                "I couldn't clearly recognize the voice message.\n\n"
                "Try saying: <i>Quran</i>, <i>Tajwid</i>, "
                "<i>Khatm</i>, <i>Yasin audio</i>, <i>English</i>."
            ),
        },
        "busy": {
            "kk": "🤖 RAQAT AI · КӨМЕКШІ жауап дайындап жатыр...",
            "ru": "🤖 RAQAT AI готовит ответ...",
            "en": "🤖 RAQAT AI is preparing a reply...",
        },
        "error": {
            "kk": "Бірақ орындау кезінде қате шықты. Қайта айтып көріңіз.",
            "ru": "Но при выполнении произошла ошибка. Попробуйте еще раз.",
            "en": "But an error happened while executing it. Please try again.",
        },
        "open_menu": {
            "kk": "Басты мәзірді ашып жатырмын...",
            "ru": "Открываю главное меню...",
            "en": "Opening the main menu...",
        },
        "open_quran": {
            "kk": "Құран бөлімін ашып жатырмын...",
            "ru": "Открываю раздел Корана...",
            "en": "Opening the Quran section...",
        },
        "open_tajwid": {
            "kk": "Тәжуид бөлімін ашып жатырмын...",
            "ru": "Открываю раздел таджвида...",
            "en": "Opening the tajwid section...",
        },
        "open_khatm": {
            "kk": "Хатым бөлімін ашып жатырмын...",
            "ru": "Открываю раздел хатма...",
            "en": "Opening the khatm section...",
        },
        "open_hadith": {
            "kk": "Хадис бөлімін ашып жатырмын...",
            "ru": "Открываю раздел хадисов...",
            "en": "Opening the hadith section...",
        },
        "open_translation": {
            "kk": "Аударма баптарын ашып жатырмын...",
            "ru": "Открываю настройки перевода...",
            "en": "Opening translation settings...",
        },
        "translation_follow_ui": {
            "kk": "Аударма енді интерфейс тілімен бірге өзгереді.",
            "ru": "Перевод теперь следует за языком интерфейса.",
            "en": "Translation now follows the interface language.",
        },
        "search_quran": {
            "kk": "Құраннан іздеп жатырмын: {query}",
            "ru": "Ищу в Коране: {query}",
            "en": "Searching the Quran for: {query}",
        },
        "search_hadith": {
            "kk": "Хадистен іздеп жатырмын: {query}",
            "ru": "Ищу в хадисах: {query}",
            "en": "Searching hadith for: {query}",
        },
        "open_prayer": {
            "kk": "Намаз бөлімін ашып жатырмын...",
            "ru": "Открываю раздел намаза...",
            "en": "Opening the prayer section...",
        },
        "open_prayer_section": {
            "kk": "Намаз тармағын ашып жатырмын...",
            "ru": "Открываю подраздел намаза...",
            "en": "Opening the prayer subsection...",
        },
        "open_qibla": {
            "kk": "Құбыла бөлімін ашып жатырмын...",
            "ru": "Открываю раздел киблы...",
            "en": "Opening the qibla section...",
        },
        "open_tasbih": {
            "kk": "Тәспі бөлімін ашып жатырмын...",
            "ru": "Открываю раздел тасбиха...",
            "en": "Opening the tasbih section...",
        },
        "tasbih_updated": {
            "kk": "Тәспі жаңартылды.",
            "ru": "Тасбих обновлен.",
            "en": "Tasbih updated.",
        },
        "open_halal": {
            "kk": "Халал тексеру бөлімін ашып жатырмын...",
            "ru": "Открываю halal-проверку...",
            "en": "Opening the halal checker...",
        },
        "open_feedback": {
            "kk": "Кері байланыс бөлімін ашып жатырмын...",
            "ru": "Открываю обратную связь...",
            "en": "Opening feedback...",
        },
        "open_guide": {
            "kk": "Жылдам нұсқаулықты ашып жатырмын...",
            "ru": "Открываю быстрый гид...",
            "en": "Opening the quick guide...",
        },
        "open_wudu": {
            "kk": "Дәрет бөлімін ашып жатырмын...",
            "ru": "Открываю раздел омовения...",
            "en": "Opening the wudu section...",
        },
        "open_surah": {
            "kk": "Қажетті сүрені ашып жатырмын...",
            "ru": "Открываю нужную суру...",
            "en": "Opening the requested surah...",
        },
        "open_audio": {
            "kk": "Сүре аудиосын ашып жатырмын...",
            "ru": "Открываю аудио суры...",
            "en": "Opening the surah audio...",
        },
        "repeat_audio": {
            "kk": "Насир әл-Қатами аудиосын {count} рет қосып жатырмын...",
            "ru": "Запускаю аудио Насира аль-Катами {count} раз...",
            "en": "Playing Nasser Al Qatami audio {count} times...",
        },
        "next_ayah": {
            "kk": "Келесі аятты қосып жатырмын...",
            "ru": "Включаю следующий аят...",
            "en": "Playing the next ayah...",
        },
        "prev_ayah": {
            "kk": "Алдыңғы аятты қосып жатырмын...",
            "ru": "Включаю предыдущий аят...",
            "en": "Playing the previous ayah...",
        },
        "repeat_last": {
            "kk": "Соңғы аятты қайта қосып жатырмын...",
            "ru": "Повторяю последний аят...",
            "en": "Repeating the last ayah...",
        },
        "lang_saved": {
            "kk": "Тіл ауыстырылды: {language}.",
            "ru": "Язык переключен: {language}.",
            "en": "Language switched to {language}.",
        },
        "translation_saved": {
            "kk": "Аударма тілі ауыстырылды: {language}.",
            "ru": "Язык перевода переключен: {language}.",
            "en": "Translation language switched to {language}.",
        },
    }
    lang = (lang or "kk").lower()
    bucket = templates.get(key, {})
    template = bucket.get(lang) or bucket.get("en") or bucket.get("kk") or key
    return template.format(**kwargs)


def _voice_help_text(lang: str, enabled: bool) -> str:
    status = tr("voice_mode_on", lang) if enabled else tr("voice_mode_off", lang)
    if lang == "ru":
        return (
            "🎙 <b>Голосовое управление</b>\n\n"
            f"{status}\n\n"
            "Отправьте голосовое сообщение, и бот попробует выполнить команду.\n\n"
            "<b>Примеры:</b>\n"
            "• <i>Коран</i>\n"
            "• <i>найди в Коране сабр</i>\n"
            "• <i>Ясин аудио</i>\n"
            "• <i>русский</i>\n"
            "• <i>перевод на русский</i>\n"
            "• <i>включи голос</i> / <i>выключи голос</i>\n\n"
            "Команды: <code>/voice</code>, <code>/voice_on</code> и <code>/voice_off</code>."
        )
    if lang == "en":
        return (
            "🎙 <b>Voice Control</b>\n\n"
            f"{status}\n\n"
            "Send a voice message and the bot will try to execute the command.\n\n"
            "<b>Examples:</b>\n"
            "• <i>Quran</i>\n"
            "• <i>search Quran mercy</i>\n"
            "• <i>Yasin audio</i>\n"
            "• <i>English</i>\n"
            "• <i>translation English</i>\n"
            "• <i>voice on</i> / <i>voice off</i>\n\n"
            "Commands: <code>/voice</code>, <code>/voice_on</code> and <code>/voice_off</code>."
        )
    return (
        "🎙 <b>Дауыспен басқару</b>\n\n"
        f"{status}\n\n"
        "Дауыс хабарлама жіберсеңіз, бот команданы танып орындауға тырысады.\n\n"
        "<b>Мысалдар:</b>\n"
        "• <i>Құран</i>, <i>халал</i>, <i>намаз</i>, <i>құбыла</i>\n"
        "• <i>Құраннан сабыр ізде</i>\n"
        "• <i>Ясин аудио</i>\n"
        "• <i>орысша</i>\n"
        "• <i>аударманы орысша қыл</i>\n"
        "• <i>дауыс қос</i> / <i>дауыс өшір</i>\n\n"
        "Командалар: <code>/voice</code> (нұсқау), <code>/voice_on</code> және <code>/voice_off</code>."
    )


def _surah_menu_page(surah_id: int) -> int:
    return max(0, (surah_id - 1) // SURA_PAGE_SIZE)


def _requested_ayah(text: str, surah_id: int) -> int:
    match = re.search(r"(\d{1,3})\s*[:./ -]\s*(\d{1,3})", text or "")
    if match:
        return max(1, int(match.group(2)))

    numbers = [int(value) for value in re.findall(r"\d{1,3}", text or "")]
    if not numbers:
        return 1
    if len(numbers) == 1 and numbers[0] == surah_id:
        return 1
    return max(1, numbers[-1])


def _requested_repeat_count(text: str) -> int | None:
    normalized = normalize_voice_text(text)
    if "x5" in normalized or "5 рет" in normalized or "бес рет" in normalized:
        return 5
    if "x3" in normalized or "3 рет" in normalized or "үш рет" in normalized:
        return 3
    return None


def _context_payload(surah_id: int, ayah: int, menu_page: int) -> dict[str, int]:
    return {
        "surah_id": surah_id,
        "ayah": ayah,
        "menu_page": menu_page,
    }


async def _send_voice_reply(message: types.Message, text: str, lang: str) -> None:
    await send_tts_if_enabled(message, text, lang)


async def _update_wait(wait_msg: types.Message, transcript: str, lang: str, body: str = "") -> None:
    text = _voice_text("heard", lang, transcript=escape(transcript))
    if body:
        text += f"\n\n{body}"
    await wait_msg.edit_text(text)


async def _handle_contextual_audio_command(
    message: types.Message,
    wait_msg: types.Message,
    transcript: str,
    lang: str,
) -> bool:
    context = VOICE_CONTEXT.get(message.from_user.id)
    if not context:
        return False

    surah_id = int(context.get("surah_id") or 0)
    ayah = int(context.get("ayah") or 1)
    menu_page = int(context.get("menu_page") or _surah_menu_page(surah_id or 1))

    if not surah_id:
        return False

    if is_next_ayah_command(transcript):
        ayah += 1
        await _update_wait(wait_msg, transcript, lang, _voice_text("next_ayah", lang))
    elif is_prev_ayah_command(transcript):
        ayah = max(1, ayah - 1)
        await _update_wait(wait_msg, transcript, lang, _voice_text("prev_ayah", lang))
    elif is_repeat_last_command(transcript):
        await _update_wait(wait_msg, transcript, lang, _voice_text("repeat_last", lang))
    else:
        return False

    await send_quran_audio_message(message, surah_id, ayah, menu_page, user_id=message.from_user.id)
    VOICE_CONTEXT[message.from_user.id] = _context_payload(surah_id, ayah, menu_page)
    return True


async def voice_help_handler(message: types.Message):
    uid = message.from_user.id
    lang = get_user_lang(uid)
    USER_STATE[uid] = None
    log_event(uid, "voice_help_open")
    await message.answer(
        _voice_help_text(lang, get_user_voice_reply_enabled(uid)),
        reply_markup=main_menu(user_id=uid, lang=lang),
    )


async def voice_on_handler(message: types.Message):
    uid = message.from_user.id
    lang = get_user_lang(uid)
    USER_STATE[uid] = None
    set_user_voice_reply_enabled(uid, True)
    await message.answer(tr("voice_mode_on", lang))


async def voice_off_handler(message: types.Message):
    uid = message.from_user.id
    lang = get_user_lang(uid)
    USER_STATE[uid] = None
    set_user_voice_reply_enabled(uid, False)
    await message.answer(tr("voice_mode_off", lang))


async def voice_toggle_text_router(message: types.Message):
    uid = message.from_user.id
    toggle = extract_voice_mode_toggle(message.text or "")
    if toggle is None:
        return

    USER_STATE[uid] = None
    lang = get_user_lang(uid)
    set_user_voice_reply_enabled(uid, toggle)
    await message.answer(tr("voice_mode_on", lang) if toggle else tr("voice_mode_off", lang))


async def voice_help_text_router(message: types.Message):
    if not is_voice_help_request(message.text or ""):
        return
    await voice_help_handler(message)


async def voice_command_handler(message: types.Message):
    voice = message.voice
    if not voice:
        return

    uid = message.from_user.id
    current_lang = get_user_lang(uid)
    wait_msg = await message.answer(_voice_text("wait", current_lang))

    try:
        audio_stream = await message.bot.download(voice)
        audio_bytes = audio_stream.getvalue()
    except Exception as exc:
        logger.warning("Voice download failed uid=%s: %s", uid, exc)
        await wait_msg.edit_text("Дауысты жүктей алмадым. Қайта жіберіп көріңіз.")
        return

    transcript = await asyncio.to_thread(
        transcribe_voice_command,
        audio_bytes,
        voice.mime_type or "audio/ogg",
        current_lang,
    )
    transcript = (transcript or "").strip()
    if not transcript or transcript.upper() == "UNKNOWN":
        await wait_msg.edit_text(_voice_text("unknown", current_lang))
        return

    logger.info("VOICE uid=%s transcript=%s", uid, transcript)
    log_event(uid, "voice_command", detail=transcript[:120])
    USER_STATE[uid] = None
    normalized = normalize_voice_text(transcript)
    surah_id = match_surah_from_text(transcript)
    wants_audio = any(token in normalized for token in ("аудио", "audio", "тыңда", "тыңдау", "listen"))
    repeat_count = _requested_repeat_count(transcript)

    try:
        voice_mode = extract_voice_mode_toggle(transcript)
        if voice_mode is not None:
            set_user_voice_reply_enabled(uid, voice_mode)
            lang = get_user_lang(uid)
            text = tr("voice_mode_on", lang) if voice_mode else tr("voice_mode_off", lang)
            await _update_wait(wait_msg, transcript, lang, text)
            if voice_mode:
                await _send_voice_reply(message, text, lang)
            return

        language_choice = extract_language_choice(transcript)
        if language_choice and is_translation_switch_command(transcript):
            set_user_content_lang(uid, language_choice)
            lang = get_user_lang(uid)
            text = _voice_text("translation_saved", lang, language=get_language_name(language_choice))
            await _update_wait(wait_msg, transcript, lang, text)
            await _send_voice_reply(message, text, lang)
            return

        if language_choice and is_language_switch_command(transcript):
            lang = set_user_lang(uid, language_choice)
            saved_text = tr("language_saved", lang, language=get_language_name(lang))
            await _update_wait(wait_msg, transcript, lang, saved_text)
            await message.answer(
                tr("welcome", lang, language=get_language_name(lang)),
                reply_markup=main_menu(user_id=uid, lang=lang),
            )
            await _send_voice_reply(
                message,
                _voice_text("lang_saved", lang, language=get_language_name(lang)),
                lang,
            )
            return

        lang = get_user_lang(uid)
        if wants_translation_follow_ui(transcript):
            set_user_content_lang(uid, None)
            text = _voice_text("translation_follow_ui", lang)
            await _update_wait(wait_msg, transcript, lang, text)
            await _send_voice_reply(message, text, lang)
            return

        if is_translation_menu_request(transcript):
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_translation", lang))
            await translation_handler(message)
            await _send_voice_reply(message, _voice_text("open_translation", lang), lang)
            return

        if is_guide_request(transcript):
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_guide", lang))
            await guide_handler(message)
            await _send_voice_reply(message, _voice_text("open_guide", lang), lang)
            return

        if is_feedback_request(transcript):
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_feedback", lang))
            await open_feedback_flow(message)
            await _send_voice_reply(message, _voice_text("open_feedback", lang), lang)
            return

        if is_halal_section_request(transcript):
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_halal", lang))
            await halal_button_handler(message)
            await _send_voice_reply(message, _voice_text("open_halal", lang), lang)
            return

        quran_search_query = extract_quran_search_query(transcript)
        if quran_search_query:
            await _update_wait(
                wait_msg,
                transcript,
                lang,
                _voice_text("search_quran", lang, query=quran_search_query),
            )
            await send_quran_search_results(message, quran_search_query)
            await _send_voice_reply(
                message,
                _voice_text("search_quran", lang, query=quran_search_query),
                lang,
            )
            return

        hadith_search_query = extract_hadith_search_query(transcript)
        if hadith_search_query:
            await _update_wait(
                wait_msg,
                transcript,
                lang,
                _voice_text("search_hadith", lang, query=hadith_search_query),
            )
            await send_hadith_search_results(message, hadith_search_query)
            await _send_voice_reply(
                message,
                _voice_text("search_hadith", lang, query=hadith_search_query),
                lang,
            )
            return

        tasbih_action = extract_tasbih_action(transcript)
        if tasbih_action:
            result_text = apply_tasbih_action(uid, tasbih_action) or _voice_text("tasbih_updated", lang)
            await _update_wait(wait_msg, transcript, lang, result_text)
            await send_tasbih_message(message)
            await _send_voice_reply(message, result_text, lang)
            return

        if await _handle_contextual_audio_command(message, wait_msg, transcript, lang):
            return

        prayer_section = match_prayer_section_command(transcript)
        if prayer_section:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_prayer_section", lang))
            await send_prayer_section_message(message, prayer_section)
            await _send_voice_reply(message, _voice_text("open_prayer_section", lang), lang)
            return

        if "басты бет" in normalized or "menu" in normalized or "меню" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_menu", lang))
            await start_handler(message)
            await _send_voice_reply(message, _voice_text("open_menu", lang), lang)
            return

        if "тәжуид" in normalized or "tajwid" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_tajwid", lang))
            await tajwid_handler(message)
            await _send_voice_reply(message, _voice_text("open_tajwid", lang), lang)
            return

        if "хатым" in normalized or "хатм" in normalized or "khatm" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_khatm", lang))
            await khatm_handler(message)
            await _send_voice_reply(message, _voice_text("open_khatm", lang), lang)
            return

        if "ер дәрет" in normalized or "еркек дәрет" in normalized or "дәрет ер" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_wudu", lang))
            await send_prayer_section_message(message, "wudu_men")
            await _send_voice_reply(message, _voice_text("open_wudu", lang), lang)
            return

        if "әйел дәрет" in normalized or "дәрет әйел" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_wudu", lang))
            await send_prayer_section_message(message, "wudu_women")
            await _send_voice_reply(message, _voice_text("open_wudu", lang), lang)
            return

        if surah_id and wants_audio:
            ayah = _requested_ayah(transcript, surah_id)
            menu_page = _surah_menu_page(surah_id)
            if repeat_count:
                await _update_wait(
                    wait_msg,
                    transcript,
                    lang,
                    _voice_text("repeat_audio", lang, count=repeat_count),
                )
                await send_repeated_quran_audio_message(
                    message,
                    surah_id,
                    ayah,
                    menu_page,
                    repeat_count,
                    user_id=uid,
                )
                VOICE_CONTEXT[uid] = _context_payload(surah_id, ayah, menu_page)
                return

            await _update_wait(wait_msg, transcript, lang, _voice_text("open_audio", lang))
            if ayah == 1:
                await send_surah_audio_message(message, surah_id, menu_page, user_id=uid)
            else:
                await send_quran_audio_message(message, surah_id, ayah, menu_page, user_id=uid)
            VOICE_CONTEXT[uid] = _context_payload(surah_id, ayah, menu_page)
            return

        if "дәрет" in normalized or "wudu" in normalized or "тазалық" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_wudu", lang))
            await send_prayer_section_message(message, "visual_wudu")
            await _send_voice_reply(message, _voice_text("open_wudu", lang), lang)
            return

        if "суретті намаз" in normalized or "намаз сурет" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_prayer", lang))
            await send_prayer_section_message(message, "visual_salah")
            await _send_voice_reply(message, _voice_text("open_prayer", lang), lang)
            return

        if "ер намазы" in normalized or "ер кісі" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_prayer", lang))
            await send_prayer_section_message(message, "men")
            await _send_voice_reply(message, _voice_text("open_prayer", lang), lang)
            return

        if "әйел намазы" in normalized or "әйел кісі" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_prayer", lang))
            await send_prayer_section_message(message, "women")
            await _send_voice_reply(message, _voice_text("open_prayer", lang), lang)
            return

        if "намаз уақыт" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_prayer", lang))
            await send_prayer_section_message(message, "times")
            await _send_voice_reply(message, _voice_text("open_prayer", lang), lang)
            return

        if surah_id:
            menu_page = _surah_menu_page(surah_id)
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_surah", lang))
            await show_surah_message(message, surah_id, menu_page)
            VOICE_CONTEXT[uid] = _context_payload(surah_id, 1, menu_page)
            await _send_voice_reply(message, _voice_text("open_surah", lang), lang)
            return

        if "құран" in normalized or "quran" in normalized or "коран" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_quran", lang))
            await quran_handler(message)
            await _send_voice_reply(message, _voice_text("open_quran", lang), lang)
            return

        if "хадис" in normalized or "hadith" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_hadith", lang))
            await hadith_show(message)
            await _send_voice_reply(message, _voice_text("open_hadith", lang), lang)
            return

        if "намаз" in normalized or "prayer" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_prayer", lang))
            await prayer_handler(message)
            await _send_voice_reply(message, _voice_text("open_prayer", lang), lang)
            return

        if "құбыла" in normalized or "qibla" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_qibla", lang))
            await qibla_request_handler(message)
            await _send_voice_reply(message, _voice_text("open_qibla", lang), lang)
            return

        if "тәспі" in normalized or "тасбих" in normalized or "tasbih" in normalized:
            await _update_wait(wait_msg, transcript, lang, _voice_text("open_tasbih", lang))
            await tasbih_handler(message)
            await _send_voice_reply(message, _voice_text("open_tasbih", lang), lang)
            return

        allowed, rate_msg = check_ai_rate_limit(uid)
        if not allowed:
            await _update_wait(
                wait_msg,
                transcript,
                lang,
                rate_msg or "⏳ Қысқа күте тұрыңыз.",
            )
            return

        await _update_wait(wait_msg, transcript, lang, _voice_text("busy", lang))
        result = await ask_genai_telegram(transcript, uid)
        await wait_msg.edit_text(
            f"{_voice_text('heard', lang, transcript=escape(transcript))}\n\n{result}"
        )
        await _send_voice_reply(message, result, lang)
    except Exception as exc:
        logger.warning("Voice routing failed uid=%s: %s", uid, exc)
        await wait_msg.edit_text(
            f"{_voice_text('heard', current_lang, transcript=escape(transcript))}\n\n"
            f"{_voice_text('error', current_lang)}"
        )
