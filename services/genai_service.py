# -*- coding: utf-8 -*-
import base64
from io import BytesIO
import json
import logging
import os
from pathlib import Path
import time

import httpx

from config.settings import (
    AI_MODEL_CANDIDATES,
    GEMINI_API_KEY,
    RAQAT_AI_PROXY_SECRET,
    RAQAT_BOT_AI_WAIT_TOTAL,
    RAQAT_PLATFORM_AI_HTTP_TIMEOUT,
    RAQAT_SINGLE_SOURCE_MODE,
    RAQAT_PLATFORM_API_BASE,
)


def _accept_ai_proxy_secret_header() -> bool:
    return (os.getenv("RAQAT_ACCEPT_AI_PROXY_SECRET_HEADER") or "1").strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )


def _platform_ai_auth_headers() -> dict[str, str]:
    """Қосымша: JWT-only режимінде RAQAT_PLATFORM_API_SERVICE_TOKEN (Bearer)."""
    if _accept_ai_proxy_secret_header():
        sec = (RAQAT_AI_PROXY_SECRET or "").strip()
        return {"X-Raqat-Ai-Secret": sec} if sec else {}
    tok = (os.getenv("RAQAT_PLATFORM_API_SERVICE_TOKEN") or "").strip()
    return {"Authorization": f"Bearer {tok}"} if tok else {}

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    genai = None
    genai_types = None

try:
    from gtts import gTTS
except ImportError:
    gTTS = None

_ai_client = None
logger = logging.getLogger("raqat_ai.genai")
MODEL_CANDIDATES = AI_MODEL_CANDIDATES or (
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
)
TTS_MODEL_CANDIDATES = (
    "gemini-2.5-flash-preview-tts",
    "gemini-2.5-pro-preview-tts",
)
RETRY_DELAYS = (0.8, 1.5)
GTTS_LANGUAGE_MAP = {
    "en": "en",
    "ru": "ru",
    "ar": "ar",
    "tr": "tr",
    "zh": "zh-CN",
    "ur": "ur",
    "id": "id",
    "ms": "ms",
}


# --- Islamic system prompt + glossary (for text QA/Chat) ---

ISLAMIC_SYSTEM_PROMPT = """
You are an Islamic AI assistant.

RULES:
- Answer based only on Quran and authentic hadith where possible.
- Do NOT invent information.
- Do NOT give fatwa or personal rulings.
- If fiqh (practical law) is discussed and schools differ, present the **Hanafi (Imam Abu Hanifa)** view
  first for context typical of Central Asia, then one short note if others may differ. Never claim
  a binding ruling; refer to a qualified scholar for the user's case.
- Keep answers short, clear and structured.

STRUCTURE:
1. Quran evidence (if available)
2. Hadith evidence (if available)
3. Short explanation

TERMINOLOGY (examples, see appended glossary for full list):
sabr = сабыр
rizq = ризық
taqwa = тақуалық
dua = дұға
salah = намаз
zakat = зекет
hajj = қажылық
tawbah = тәубе
iman = иман

IMPORTANT:
- Do NOT add tafsir or long commentary.
- Do NOT distort meaning.
- Use clear, natural Kazakh language.
"""

_GLOSSARY_TEXT = ""
try:
    root = Path(__file__).resolve().parents[1]
    glossary_path = root / "glossary.json"
    if glossary_path.is_file():
        data = json.loads(glossary_path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            lines = [f"{k} = {v}" for k, v in sorted(data.items())]
            _GLOSSARY_TEXT = "\n".join(lines)
except Exception as exc:  # pragma: no cover - defensive
    logger.warning("Failed to load glossary.json: %s", exc)
    _GLOSSARY_TEXT = ""


def _prompt_with_system(prompt: str) -> str:
    """System + user prompt, including glossary."""
    glossary_block = (
        "\n\nISLAMIC TERMINOLOGY (must follow exactly):\n"
        f"{_GLOSSARY_TEXT}"
        if _GLOSSARY_TEXT
        else ""
    )
    return (
        f"{ISLAMIC_SYSTEM_PROMPT.strip()}"
        f"{glossary_block}\n\n"
        "USER QUESTION:\n"
        f"{prompt.strip()}"
    )


def _is_transient_error(exc: Exception) -> bool:
    text = str(exc).lower()
    transient_markers = (
        "503",
        "unavailable",
        "overloaded",
        "deadline",
        "timeout",
        "temporarily",
        "rate limit",
        "resource exhausted",
    )
    return any(marker in text for marker in transient_markers)


def _generate_once(model_name: str, prompt: str) -> str:
    kwargs: dict = {"model": model_name, "contents": _prompt_with_system(prompt)}
    if genai_types is not None:
        try:
            mo = int(os.getenv("RAQAT_AI_MAX_OUTPUT_TOKENS", "2560"))
        except ValueError:
            mo = 2560
        mo = max(512, min(mo, 8192))
        kwargs["config"] = genai_types.GenerateContentConfig(
            thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
            max_output_tokens=mo,
        )
    response = _ai_client.models.generate_content(**kwargs)
    text = getattr(response, "text", "") or ""
    return text.strip() or "Жауап алынбады."

def init_genai():
    global _ai_client
    if genai and GEMINI_API_KEY:
        try:
            _ai_client = genai.Client(api_key=GEMINI_API_KEY)
        except Exception as exc:
            logger.warning("Gemini client init failed: %s", exc)
            _ai_client = None


def _platform_ai_configured() -> bool:
    """Платформа URL жеткілікті; AI auth — серверде (құпия, JWT, не құпиясыз anonymous)."""
    return bool((RAQAT_PLATFORM_API_BASE or "").strip())


def _platform_ai_post_json(path: str, payload: dict, timeout: float = 180.0) -> dict | None:
    """Орталық API-ға JSON. Конфигурация жоқ болса None; сәтсіз болса {}."""
    if not _platform_ai_configured():
        return None
    url = f"{RAQAT_PLATFORM_API_BASE.rstrip('/')}{path}"
    try:
        hdr = _platform_ai_auth_headers()
        r = httpx.post(
            url,
            json=payload,
            headers=hdr,
            timeout=timeout,
        )
        if r.status_code == 200:
            return r.json()
        logger.warning("Platform AI %s HTTP %s: %s", path, r.status_code, r.text[:200])
        return {}
    except Exception as exc:
        logger.warning("Platform AI %s failed: %s", path, exc)
        return {}


def _ask_genai_via_platform_api(prompt: str, user_id: int | None = None) -> str | None:
    """Конфигурация жоқ болса None (тікелей Gemini). Бар болса API жауабы міндетті."""
    if not _platform_ai_configured():
        return None
    body: dict = {"prompt": prompt}
    if user_id is not None:
        body["user_id"] = user_id
    data = _platform_ai_post_json(
        "/api/v1/ai/chat",
        body,
        timeout=min(float(RAQAT_PLATFORM_AI_HTTP_TIMEOUT), float(RAQAT_BOT_AI_WAIT_TOTAL) - 5.0),
    )
    if not data:
        return "AI орталық серверіне қосылу сәтсіз. Кейінірек қайта көріңіз."
    return (data.get("text") or "").strip() or "Жауап алынбады."


def ask_genai(prompt: str, user_id: int | None = None) -> str:
    if not prompt.strip():
        return "Сұрақты толық жазыңыз."

    via = _ask_genai_via_platform_api(prompt, user_id=user_id)
    if via is not None:
        return via

    if RAQAT_SINGLE_SOURCE_MODE:
        return (
            "AI қазір тек орталық platform API арқылы жұмыс істейді. "
            "RAQAT_PLATFORM_API_BASE қойылғанын тексеріңіз; "
            "серверде GEMINI_API_KEY қажет. "
            "(Қосымша: RAQAT_AI_PROXY_SECRET, RAQAT_PLATFORM_API_SERVICE_TOKEN — міндетті емес.)"
        )

    if _ai_client is None:
        return "AI уақытша қолжетімсіз немесе API key қойылмаған."

    last_error = None

    # Try the main model first, then immediately fall back to a lighter model
    # within the same round when Gemini is temporarily overloaded.
    for attempt in range(len(RETRY_DELAYS) + 1):
        saw_transient_error = False

        for model_name in MODEL_CANDIDATES:
            try:
                return _generate_once(model_name, prompt)
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Gemini request failed for model=%s attempt=%s: %s",
                    model_name,
                    attempt + 1,
                    exc,
                )

                if _is_transient_error(exc):
                    saw_transient_error = True
                    continue

        if saw_transient_error and attempt < len(RETRY_DELAYS):
            time.sleep(RETRY_DELAYS[attempt])

    if last_error and _is_transient_error(last_error):
        return (
            "AI сервері қазір бос емес. "
            "1-2 минуттан кейін қайта сұрап көріңіз."
        )

    return "AI уақытша жауап бере алмады. Кейінірек қайта көріңіз."


def _iter_response_parts(response):
    direct_parts = getattr(response, "parts", None) or []
    for part in direct_parts:
        yield part

    for candidate in getattr(response, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            yield part


def _extract_inline_audio(response) -> tuple[bytes, str] | None:
    for part in _iter_response_parts(response):
        inline_data = getattr(part, "inline_data", None)
        data = getattr(inline_data, "data", None)
        mime_type = getattr(inline_data, "mime_type", None)
        if data and mime_type and mime_type.startswith("audio/"):
            return data, mime_type
    return None


def synthesize_speech(text: str, lang: str = "kk") -> tuple[bytes, str, str] | None:
    cleaned = " ".join((text or "").split())[:450].strip()
    if not cleaned:
        return None

    if _platform_ai_configured():
        data = _platform_ai_post_json(
            "/api/v1/ai/tts",
            {"text": cleaned, "lang": lang},
            timeout=180.0,
        )
        if data and data.get("ok") and data.get("audio_b64"):
            try:
                raw = base64.standard_b64decode(data["audio_b64"].encode("ascii"))
                mime = data.get("mime_type") or "audio/mpeg"
                name = data.get("filename") or "raqat_tts.bin"
                return raw, mime, name
            except Exception as exc:
                logger.warning("Platform TTS decode failed: %s", exc)
        return None

    if RAQAT_SINGLE_SOURCE_MODE:
        return None

    if _ai_client is not None and genai_types is not None:
        try:
            from services.language_service import get_language_name

            language_name = get_language_name(lang, native=False)
        except Exception:
            language_name = lang or "language"

        for model_name in TTS_MODEL_CANDIDATES:
            try:
                response = _ai_client.models.generate_content(
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
                if payload:
                    audio_bytes, mime_type = payload
                    if "wav" in mime_type:
                        return audio_bytes, mime_type, "raqat_tts.wav"
                    if "mpeg" in mime_type or "mp3" in mime_type:
                        return audio_bytes, mime_type, "raqat_tts.mp3"
                    return audio_bytes, mime_type, "raqat_tts.bin"
            except Exception as exc:
                logger.warning("Gemini TTS failed for model=%s: %s", model_name, exc)

    gtts_lang = GTTS_LANGUAGE_MAP.get((lang or "").lower())
    if gTTS is not None and gtts_lang:
        try:
            buffer = BytesIO()
            gTTS(text=cleaned, lang=gtts_lang, slow=False).write_to_fp(buffer)
            return buffer.getvalue(), "audio/mpeg", "raqat_tts.mp3"
        except Exception as exc:
            logger.warning("gTTS fallback failed for lang=%s: %s", gtts_lang, exc)

    return None


def analyze_halal_photo(image_bytes: bytes, mime_type: str, lang: str = "kk") -> str:
    if not image_bytes:
        return ""

    if _platform_ai_configured():
        data = _platform_ai_post_json(
            "/api/v1/ai/analyze-image",
            {
                "image_b64": base64.standard_b64encode(image_bytes).decode("ascii"),
                "mime_type": mime_type or "image/jpeg",
                "lang": lang,
            },
            timeout=180.0,
        )
        if data is not None:
            return (data.get("text") or "").strip()

    if RAQAT_SINGLE_SOURCE_MODE:
        return ""

    if _ai_client is None or genai_types is None:
        return ""

    if lang == "ru":
        prompt = (
            "На фото может быть упаковка или состав продукта.\n"
            "1. Кратко определи товар или видимые ингредиенты.\n"
            "2. Отметь явные харам или сомнительные компоненты.\n"
            "3. Если текст на фото читается плохо, прямо скажи об этом.\n"
            "4. Ответ дай коротко, максимум 6 строк."
        )
    elif lang == "en":
        prompt = (
            "The image may show a product package or ingredients list.\n"
            "1. Briefly identify the product or visible ingredients.\n"
            "2. Flag clearly haram or doubtful components.\n"
            "3. If the text is unreadable, say so clearly.\n"
            "4. Keep the answer short, maximum 6 lines."
        )
    else:
        prompt = (
            "Суретте өнім қаптамасы не құрам тізімі болуы мүмкін.\n"
            "1. Өнімді немесе көрінген құрамды қысқаша ата.\n"
            "2. Айқын харам не күмәнді компоненттерді белгіле.\n"
            "3. Егер мәтін анық көрінбесе, оны ашық айт.\n"
            "4. Жауап 6 қысқа жолдан аспасын."
        )

    last_error = None
    for attempt in range(len(RETRY_DELAYS) + 1):
        saw_transient_error = False

        for model_name in MODEL_CANDIDATES:
            try:
                response = _ai_client.models.generate_content(
                    model=model_name,
                    contents=[
                        prompt,
                        genai_types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=mime_type or "image/jpeg",
                        ),
                    ],
                )
                text = (getattr(response, "text", "") or "").strip()
                if text:
                    return text
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Halal photo analysis failed for model=%s attempt=%s: %s",
                    model_name,
                    attempt + 1,
                    exc,
                )
                if _is_transient_error(exc):
                    saw_transient_error = True
                    continue

        if saw_transient_error and attempt < len(RETRY_DELAYS):
            time.sleep(RETRY_DELAYS[attempt])

    if last_error:
        logger.warning("Halal photo final error: %s", last_error)
    return ""


def transcribe_voice_command(audio_bytes: bytes, mime_type: str, preferred_lang: str | None = None) -> str:
    if not audio_bytes:
        return ""

    if _platform_ai_configured():
        data = _platform_ai_post_json(
            "/api/v1/ai/transcribe-voice",
            {
                "audio_b64": base64.standard_b64encode(audio_bytes).decode("ascii"),
                "mime_type": mime_type or "audio/ogg",
                "preferred_lang": preferred_lang,
            },
            timeout=180.0,
        )
        if data is not None:
            return (data.get("text") or "").strip()

    if RAQAT_SINGLE_SOURCE_MODE:
        return ""

    if _ai_client is None or genai_types is None:
        return ""

    preferred_hint = f"\nПайдаланушы интерфейс тілі: {preferred_lang}." if preferred_lang else ""
    prompt = (
        "Бұл ислам ботына жіберілген қысқа дауыс хабарлама.\n"
        "Міндетің: мына тілдердің бірінде не бірнешеуінде айтылған сөзді дәл мәтінге түсіру: "
        "қазақша, орысша, арабша, ағылшынша, түрікше, өзбекше, қырғызша, тәжікше, "
        "әзербайжанша, қытайша, курманджи, урду, парсыша, индонезияша, малайша.\n"
        f"{preferred_hint}\n"
        "Тек танылған мәтінді қайтар. Түсініксіз болса UNKNOWN деп қайтар."
    )

    last_error = None

    for attempt in range(len(RETRY_DELAYS) + 1):
        saw_transient_error = False

        for model_name in MODEL_CANDIDATES:
            try:
                response = _ai_client.models.generate_content(
                    model=model_name,
                    contents=[
                        prompt,
                        genai_types.Part.from_bytes(
                            data=audio_bytes,
                            mime_type=mime_type or "audio/ogg",
                        ),
                    ],
                )
                text = (getattr(response, "text", "") or "").strip()
                if text:
                    return text
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Gemini voice transcription failed for model=%s attempt=%s: %s",
                    model_name,
                    attempt + 1,
                    exc,
                )
                if _is_transient_error(exc):
                    saw_transient_error = True
                    continue

        if saw_transient_error and attempt < len(RETRY_DELAYS):
            time.sleep(RETRY_DELAYS[attempt])

    if last_error:
        logger.warning("Voice transcription final error: %s", last_error)
    return ""
