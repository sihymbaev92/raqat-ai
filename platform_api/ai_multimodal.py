# -*- coding: utf-8 -*-
"""Halal сурет, дауыс транскрипциясы, TTS — орталық Gemini (бот HTTP арқылы)."""
from __future__ import annotations

import base64
import logging
import time

from ai_proxy import RETRY_DELAYS, _get_client, _is_transient_error, _model_candidates

logger = logging.getLogger("raqat_platform.ai_multimodal")

try:
    from google.genai import types as genai_types
except ImportError:
    genai_types = None


def _halal_image_gen_config():
    """Жылдам жауап: ішкі thinking өшіру, шығыс шегі (әдепкі конфигсіз модель ұзақ «ойлауы» мүмкін)."""
    if genai_types is None:
        return None
    try:
        thinking = genai_types.ThinkingConfig(thinking_budget=0)
    except Exception:
        return genai_types.GenerateContentConfig(max_output_tokens=1536)
    return genai_types.GenerateContentConfig(
        thinking_config=thinking,
        max_output_tokens=1536,
    )


def _transcribe_gen_config():
    if genai_types is None:
        return None
    try:
        thinking = genai_types.ThinkingConfig(thinking_budget=0)
    except Exception:
        return genai_types.GenerateContentConfig(max_output_tokens=1024)
    return genai_types.GenerateContentConfig(
        thinking_config=thinking,
        max_output_tokens=1024,
    )


def _halal_prompt(lang: str) -> str:
    if lang == "ru":
        return (
            "Ты аналитический помощник по составу продуктов (исламский контекст). "
            "Ответ структурируй заголовками ##. Не выдавай фикхский вердикт.\n"
            "На фото: упаковка, состав, сертификат halal/kosher или косметика.\n"
            "Сделай: (1) что видно и язык текста; (2) ингредиенты: халяль / сомнительно / харам / неизвестно; "
            "E-коды, желатин, спирт, ферменты, свинина; (3) сертификат если виден; "
            "(4) практический совет; (5) финальная строка: для фикха — к учёному/органу."
        )
    if lang == "en":
        return (
            "You are an analytical assistant for product ingredients (Islamic context). "
            "Use ## headings. Do not issue a fiqh ruling.\n"
            "The image may show packaging, ingredient lists, halal/kosher marks, or cosmetics.\n"
            "Cover: (1) what is visible; (2) ingredients: halal / doubtful / haram / unknown — "
            "E-numbers, gelatin, alcohol, enzymes, pork; (3) certification if visible; "
            "(4) practical advice; (5) closing line: consult a scholar/certifier for rulings."
        )
    return (
        "Сен исламдық контекстте өнім құрамы бойынша аналитикалық кеңесшісің. "
        "## тақырыптармен құрылымды қазақша жауап бер. Фиқһтық үкім шығарма.\n"
        "Суретте болуы мүмкін: тағам қаптамасы, құрам, халал/кошер белгісі, косметика.\n"
        "Қамти отыр: (1) не көрінеді, мәтін тілі; (2) ингредиенттер: халал / күмәнді / харам / белгісіз — "
        "E-кодтар, желатин, спирт, ферменттер, шошқа; (3) сертификат көрінсе; "
        "(4) практикалық ұсыныс; (5) соңында: нақты үкім үшін ұстаз немесе ресми ұйым."
    )


def analyze_halal_image(
    image_bytes: bytes,
    mime_type: str,
    lang: str,
    client_prompt: str | None = None,
) -> str:
    if not image_bytes or genai_types is None:
        return ""
    client = _get_client()
    if client is None:
        return ""
    base = _halal_prompt(lang or "kk")
    extra = (client_prompt or "").strip()[:2800]
    if extra:
        prompt = f"{base}\n\n--- Қосымша нұсқау (клиент) ---\n{extra}"
    else:
        prompt = base
    last_error = None
    for attempt in range(len(RETRY_DELAYS) + 1):
        saw = False
        for model_name in _model_candidates():
            try:
                cfg = _halal_image_gen_config()
                kwargs: dict = {
                    "model": model_name,
                    "contents": [
                        prompt,
                        genai_types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=mime_type or "image/jpeg",
                        ),
                    ],
                }
                if cfg is not None:
                    kwargs["config"] = cfg
                response = client.models.generate_content(**kwargs)
                text = (getattr(response, "text", "") or "").strip()
                if text:
                    return text
            except Exception as exc:
                last_error = exc
                logger.warning("halal image model=%s: %s", model_name, exc)
                if _is_transient_error(exc):
                    saw = True
                    continue
        if saw and attempt < len(RETRY_DELAYS):
            time.sleep(RETRY_DELAYS[attempt])
    if last_error:
        logger.warning("halal final: %s", last_error)
    return ""


def transcribe_voice(audio_bytes: bytes, mime_type: str, preferred_lang: str | None) -> str:
    if not audio_bytes or genai_types is None:
        return ""
    client = _get_client()
    if client is None:
        return ""
    hint = f"\nПайдаланушы интерфейс тілі: {preferred_lang}." if preferred_lang else ""
    prompt = (
        "Бұл ислам ботына жіберілген қысқа дауыс хабарлама.\n"
        "Міндетің: мына тілдердің бірінде не бірнешеуінде айтылған сөзді дәл мәтінге түсіру: "
        "қазақша, орысша, арабша, ағылшынша, түрікше, өзбекше, қырғызша, тәжікше, "
        "әзербайжанша, қытайша, курманджи, урду, парсыша, индонезияша, малайша.\n"
        f"{hint}\n"
        "Тек танылған мәтінді қайтар. Түсініксіз болса UNKNOWN деп қайтар."
    )
    last_error = None
    for attempt in range(len(RETRY_DELAYS) + 1):
        saw = False
        for model_name in _model_candidates():
            try:
                cfg = _transcribe_gen_config()
                kwargs: dict = {
                    "model": model_name,
                    "contents": [
                        prompt,
                        genai_types.Part.from_bytes(
                            data=audio_bytes,
                            mime_type=mime_type or "audio/ogg",
                        ),
                    ],
                }
                if cfg is not None:
                    kwargs["config"] = cfg
                response = client.models.generate_content(**kwargs)
                text = (getattr(response, "text", "") or "").strip()
                if text:
                    return text
            except Exception as exc:
                last_error = exc
                logger.warning("voice transcribe model=%s: %s", model_name, exc)
                if _is_transient_error(exc):
                    saw = True
                    continue
        if saw and attempt < len(RETRY_DELAYS):
            time.sleep(RETRY_DELAYS[attempt])
    if last_error:
        logger.warning("voice final: %s", last_error)
    return ""


TTS_MODEL_CANDIDATES = (
    "gemini-2.5-flash-preview-tts",
    "gemini-2.5-pro-preview-tts",
)

_TTS_LANG_NAMES = {
    "kk": "Kazakh",
    "kz": "Kazakh",
    "ru": "Russian",
    "en": "English",
    "ar": "Arabic",
    "tr": "Turkish",
}


def _iter_response_parts(response):
    direct_parts = getattr(response, "parts", None) or []
    for part in direct_parts:
        yield part
    for candidate in getattr(response, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            yield part


def _extract_inline_audio(response):
    for part in _iter_response_parts(response):
        inline_data = getattr(part, "inline_data", None)
        data = getattr(inline_data, "data", None)
        mime_type = getattr(inline_data, "mime_type", None)
        if data and mime_type and mime_type.startswith("audio/"):
            return data, mime_type
    return None


def synthesize_tts(text: str, lang: str) -> tuple[bytes, str, str] | None:
    """Аудио bytes + mime + ұсынылатын файл аты."""
    cleaned = " ".join((text or "").split())[:450].strip()
    if not cleaned or genai_types is None:
        return None
    client = _get_client()
    if client is None:
        return None
    language_name = _TTS_LANG_NAMES.get((lang or "").lower(), "the user's language")

    for model_name in TTS_MODEL_CANDIDATES:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=(
                    f"Read this naturally in {language_name}. "
                    "Keep Quran and Islamic names clear and calm.\n\n"
                    f"{cleaned}"
                ),
                config=genai_types.GenerateContentConfig(
                    response_modalities=["audio"],
                    speech_config=genai_types.SpeechConfig(
                        voice_config=genai_types.VoiceConfig(
                            prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(
                                voice_name="charon"
                            )
                        )
                    ),
                ),
            )
            payload = _extract_inline_audio(response)
            if not payload:
                continue
            audio_bytes, mime_type = payload
            if "wav" in mime_type:
                return audio_bytes, mime_type, "raqat_tts.wav"
            if "mpeg" in mime_type or "mp3" in mime_type:
                return audio_bytes, mime_type, "raqat_tts.mp3"
            return audio_bytes, mime_type, "raqat_tts.bin"
        except Exception as exc:
            logger.warning("tts model=%s: %s", model_name, exc)
    return None


def tts_to_payload(text: str, lang: str) -> dict | None:
    """JSON үшін base64."""
    tup = synthesize_tts(text, lang)
    if not tup:
        return None
    audio_bytes, mime_type, filename = tup
    return {
        "mime_type": mime_type,
        "filename": filename,
        "audio_b64": base64.standard_b64encode(audio_bytes).decode("ascii"),
    }
