# -*- coding: utf-8 -*-
"""Орталық Gemini шақыру (боттан HTTP арқылы)."""
from __future__ import annotations

import logging
import os
import time
import contextvars
from typing import Optional

from ai_context_retrieval import build_retrieved_context, build_retrieved_context_parts
from ai_qa_sources import fetch_qa_sources_context, parse_qa_source_urls
from ai_reply import AiReplyResult
from ai_reply_guards import GEMINI_BUSY_REPLY_KK, is_degraded_ai_reply

try:
    from islamic_kb.rag import build_islamic_kb_context
except ImportError:
    build_islamic_kb_context = None  # type: ignore[misc, assignment]

logger = logging.getLogger("raqat_platform.ai_proxy")

try:
    from google import genai
except ImportError:
    genai = None

try:
    from google.genai import types as genai_types
except ImportError:
    genai_types = None

_client: Optional[object] = None
_KB_ONLY_OVERRIDE: contextvars.ContextVar[bool | None] = contextvars.ContextVar(
    "raqat_ai_kb_only_override",
    default=None,
)
RETRY_DELAYS = (1.2, 2.5, 5.0)


def _model_candidates() -> tuple[str, ...]:
    raw = os.getenv(
        "AI_MODEL_CANDIDATES",
        "gemini-2.5-flash-lite,gemini-2.5-flash",
    )
    return tuple(m.strip() for m in raw.split(",") if m.strip())


def _google_search_enabled() -> bool:
    if _ai_kb_only_mode():
        return False
    return os.getenv("RAQAT_AI_ENABLE_GOOGLE_SEARCH", "1").strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )


def _ai_kb_only_mode() -> bool:
    """Тек Fatua.kz / Muftyat.kz (islamic_kb) — Құран/хадис/QA URL/Google Search жоқ."""
    override = _KB_ONLY_OVERRIDE.get()
    if override is not None:
        return bool(override)
    return os.getenv("RAQAT_AI_KB_ONLY", "").strip().lower() in (
        "1",
        "true",
        "yes",
        "on",
    )


def _structure_rules_kb_only() -> str:
    return (
        "Сен RAQAT AI-сің — орталық сұрақ-жауап қабаты, жаңа фетуа сайты емес.\n"
        "Жауапты ТЕК төмендегі Fatua.kz / Muftyat.kz үзінділеріне сүйен; "
        "ойдан аят, хадис, жаңа фиқһ үкімі немесе басқа сайттан дерек қоспа.\n"
        "Әр жауапта қайнар URL көрсет (үзіндідегі URL).\n"
        "Дерек жеткіліксіз болса қазақша: Fatua.kz / Muftyat.kz материалдарында "
        "сенімді жауап табылмады — ресми сайттарға жүгініңіз.\n"
        "Қазақша, қысқа, біртұтас мәтін; бөлім атауларын тізбелеме."
    )


def _structure_rules_online() -> str:
    """Қысқа жауап; ішкі Құран/хадис/есімдер + опциялы Google Search."""
    qa_urls = (os.getenv("RAQAT_AI_QA_SOURCE_URLS") or "").strip()
    qa_line = ""
    if qa_urls:
        qa_line = (
            "Төменде «Ресми сұрақ-жауап» блогы болса — оны ресми нұсқаулық ретінде Құран/хадистен кейінгі "
            "қосымша дереккөз деп қара; қайнар URL бір жолмен атауға болады.\n"
        )
    kb_line = _islamic_kb_rules_line()
    return (
        "Сен RAQAT AI-сің. Қазақша, қысқа әрі таза жауап бер.\n"
        "Алдымен сұрақтың түйінін ішкі түрде анықта; жауапта сұраққа тікелей жауап бер, қажет болса ғана контекст қос.\n"
        + kb_line
        + qa_line
        + "Төмендегі үзінділерге сүйен; ойдан аят/хадис қоспа. Үзінді аз болса да сұраққа сақтықпен жауап бер.\n"
        "Үзіндідегі дәлел мен сұрақтың логикалық байланысын тексер; күмән болса сақтықпен жаз, дәлелсіз қорытынды берме.\n"
        "Жауаптың басында немесе соңында дереккөздерді каталогтап («флана бөлімде жоқ») деп бөлмелеме; "
        "түсініктемені біртұтас мәтінмен бер.\n"
        "Google Search қосылған болса — қайнарды бір жолмен ата; ұзақ тізім берме.\n"
        "Жауапта бөлім атауларын («Құран бөлімі», «хадис бөлімі») және пайыздық үлес жазба.\n"
        "Даулы фиқһ/тамақ тақырыптарда: сақтық, «мен үкім бермеймін», ұстазға жүгіну.\n"
        "Мәзһаб айырмашылығы болса: алдымен ханафи тұрғысынан қысқа, содан кейін қажет болса "
        "«басқа мәзһабта өзгеше болуы мүмкін» — бір сөйлем."
    )


def _structure_rules_offline() -> str:
    """Google Search жоқ: тек ішкі Құран + хадис + есімдер."""
    qa_urls = (os.getenv("RAQAT_AI_QA_SOURCE_URLS") or "").strip()
    qa_line = ""
    if qa_urls:
        qa_line = (
            "Төменде «Ресми сұрақ-жауап» блогы болса — оны ENV арқылы бекітілген ресми бет үзіндісі ретінде қолдан; "
            "Google Search жоқ.\n"
        )
    kb_line = _islamic_kb_rules_line()
    return (
        "Сен RAQAT AI-сің. Сыртқы веб жоқ — тек төмендегі ішкі үзінділер; ойдан аят/хадис қоспа.\n"
        + kb_line
        + qa_line
        + "Алдымен сұрақтың түйінін ішкі түрде анықта; жауапта сұраққа тікелей жауап бер.\n"
        "Қазақша, қысқа жауап; бөлім атаулары мен пайыз жазба.\n"
        "Үзінділер аз болса да сұрақты жалпы сақтықпен қысқаша түсіндір; дереккөздерді бөлек «жоқ» деп санамай.\n"
        "Дәлел мен сұрақтың сәйкестігін тексер; күмән болса сақтықпен жаз.\n"
        "Даулы тақырыпта сыртқы «дәл үкім» берме; ханафи тұрғысынан қысқа сипатта."
    )


def _prompt_with_retrieval(
    user_prompt: str,
    retrieved: str,
    *,
    allow_internet: bool,
    quick: bool = False,
) -> str:
    if _ai_kb_only_mode():
        blocks = [_structure_rules_kb_only()]
        if retrieved.strip():
            blocks.append("Fatua.kz / Muftyat.kz үзінділері:\n" + retrieved.strip())
        else:
            blocks.append(
                "Индекстелген материал табылмады. Жоғарыдағы саясатқа сәйкес "
                "ресми сайттарға жүгіну туралы қысқа хабарлама жаз; ойдан мәтін қоспа."
            )
        if quick:
            blocks.append("Қысқа жауап (2–5 сөйлем); тек үзіндідегі фактілер.")
        blocks.append("Сұрақ:\n" + (user_prompt or "").strip())
        return "\n\n".join(blocks)

    blocks = [_structure_rules_online() if allow_internet else _structure_rules_offline()]
    if retrieved.strip():
        blocks.append("Тірек үзінділер:\n" + retrieved.strip())
    elif allow_internet:
        blocks.append(
            "Ішкі үзінділер берілмеді. Сұраққа сақтықпен қысқаша жауап бер; ойдан аят/хадис қоспа; "
            "дерекқордың күйін жеке жолмен ескерту ретінде шығарма."
        )
    else:
        blocks.append(
            "Ішкі үзінділер мен сыртқы іздеу қолжетімсіз. Өте қысқа сақтық хабарлама жаз; "
            "ойдан аят/хадис қоспа; каталогтық «жоқ» ескертпелерін қолданба."
        )
    if quick:
        blocks.append(
            "Қысқа жауап (2–5 сөйлем): Құран негізі; хадис үзіндісінде жоқ болса қоспа."
        )
    blocks.append("Сұрақ:\n" + (user_prompt or "").strip())
    return "\n\n".join(blocks)


def _thinking_budget_for_request(*, quick: bool) -> int:
    """
    quick=True → 0 (жылдам).
    quick=False → RAQAT_AI_THINKING_BUDGET (әдепкі 512) — Gemini ішкі ойлау; 0 қойса өшік.
    """
    if quick:
        return 0
    raw = (os.getenv("RAQAT_AI_THINKING_BUDGET") or "512").strip()
    try:
        v = int(raw)
    except ValueError:
        v = 512
    return max(0, min(v, 8192))


def _thinking_budget_staged_per_stage(full_budget: int) -> int:
    """Көп кезеңді pipeline: әр шақыруда thinking шегін төмендетіп уақыт/құны бақылау."""
    if full_budget <= 0:
        return 0
    return min(256, max(64, full_budget // 3))


def _max_output_tokens() -> int:
    try:
        v = int(os.getenv("RAQAT_AI_MAX_OUTPUT_TOKENS", "2560"))
    except ValueError:
        v = 2560
    return max(512, min(v, 8192))


def _quick_max_output_tokens() -> int:
    """Қысқа алдымен жауап үшін шектеу — толық талдаудан жылдам."""
    try:
        v = int(os.getenv("RAQAT_AI_QUICK_MAX_OUTPUT", "512"))
    except ValueError:
        v = 512
    return max(128, min(v, 2048))


def _stage_max_tokens(env_key: str, default: int) -> int:
    try:
        v = int(os.getenv(env_key, str(default)))
    except ValueError:
        v = default
    return max(256, min(v, 4096))


def _pipeline_stages_enabled() -> bool:
    if _ai_kb_only_mode():
        return False
    return os.getenv("RAQAT_AI_PIPELINE_STAGES", "1").strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )


def _prompt_stage_quran(user_prompt: str, quran_block: str, asma_block: str) -> str:
    blocks = [
        "Сен RAQAT AI-сің. Тек Құран + (бар болса) Алла есімдері; хадис пен вебті қоспа.",
        "Үзінділерге сүйен; ойдан аят қоспа.",
    ]
    if (quran_block or "").strip():
        blocks.append("Құран үзінділері:\n" + quran_block.strip())
    else:
        blocks.append(
            "Құран бойынша үзінділер берілмеді. Сұраққа қазақша қысқаша жауап бер; ойдан аят қоспа; "
            "үзінді жоқтығы туралы бөлек ескертпе жолы жазба."
        )
    if (asma_block or "").strip():
        blocks.append("Есімдер:\n" + asma_block.strip())
    blocks.append("Сұрақ:\n" + (user_prompt or "").strip())
    blocks.append("Қазақша, қысқа жауап (үзінділерді қайта бөлім атауымен жазба).")
    return "\n\n".join(blocks)


def _prompt_stage_hadith(user_prompt: str, hadith_block: str, quran_answer: str) -> str:
    blocks = [
        "Сен RAQAT AI-сің. Тек хадис/сүннет; Құранды толық қайталамай, сәйкестікті қысқаша көрсет.",
        "Хадис үзінділеріне сүйен; ойдан хадис қоспа.",
    ]
    blocks.append("Алдыңғы Құран қорытындысы (қысқа):\n" + (quran_answer or "").strip()[:6000])
    if (hadith_block or "").strip():
        blocks.append("Хадис үзінділері:\n" + hadith_block.strip())
    else:
        blocks.append(
            "Хадис бойынша үзінділер берілмеді. Сұраққа жоғарыдағы қорытындымен жалғас; ойдан хадис қоспа; "
            "хадис жоқтығын бөлек жолмен жарияламай."
        )
    blocks.append("Сұрақ:\n" + (user_prompt or "").strip())
    blocks.append("Қазақша, қысқа; дәреже (сахих/хасан/заиф) бар болса ата.")
    return "\n\n".join(blocks)


def _prompt_stage_web(
    user_prompt: str,
    quran_answer: str,
    *,
    official_web_excerpts: str,
) -> str:
    blocks = [
        "Сен RAQAT AI-сің. Сыртқы Google іздеу қолданылмайды; қосымша ақпарат тек төмендегі "
        "«Ресми бет» үзінділерінен (RAQAT_AI_QA_SOURCE_URLS allowlist) рұқсат.",
        "Алдыңғы Құран қорытындысын қайталамай, тек ресми бет мәтініне сүйене отырып қосымша қысқа түсінік бер.",
    ]
    blocks.append("Құран қысқаша:\n" + (quran_answer or "").strip()[:4000])
    ex = (official_web_excerpts or "").strip()
    if ex:
        cap = 12_000
        blocks.append("Ресми бет үзінділері (тек осыдан қорытынды жаса):\n" + ex[:cap])
    else:
        blocks.append(
            "Ресми бет үзінділері берілмеді. Бір жолмен мұны ғана хабарла; "
            "ойдан басқа сайттан дерек қоспа."
        )
    blocks.append("Сұрақ:\n" + (user_prompt or "").strip())
    blocks.append("Қазақша, қысқа; қайнарды бір жолмен (үзіндідегі URL болса соны ата); ұзақ тізім берме.")
    return "\n\n".join(blocks)


def _gemini_generate(
    contents: str,
    *,
    with_search_tool: bool,
    max_output_tokens: int | None,
    thinking_budget: int = 0,
) -> str:
    """Бір мәтін үшін модельді шақыру (іздеу құралы опционал)."""
    client = _get_client()
    if client is None:
        return ""

    last_error = None
    for attempt in range(len(RETRY_DELAYS) + 1):
        saw_transient = False
        for model_name in _model_candidates():
            cfg = None
            try:
                cfg = _fast_llm_config(
                    with_search_tool=with_search_tool,
                    max_output_tokens=max_output_tokens,
                    thinking_budget=thinking_budget,
                )
                kwargs: dict = {"model": model_name, "contents": contents}
                if cfg is not None:
                    kwargs["config"] = cfg
                response = client.models.generate_content(**kwargs)
                text = (getattr(response, "text", "") or "").strip()
                if text:
                    return text
            except Exception as exc:
                last_error = exc
                err_l = str(exc).lower()
                if cfg is not None and with_search_tool and any(
                    s in err_l
                    for s in (
                        "google_search",
                        "grounding",
                        "search tool",
                        "tool_config",
                        "tools are not",
                        "unsupported tool",
                    )
                ):
                    try:
                        cfg_off = _fast_llm_config(
                            with_search_tool=False,
                            max_output_tokens=max_output_tokens,
                            thinking_budget=thinking_budget,
                        )
                        response = client.models.generate_content(
                            model=model_name,
                            contents=contents,
                            **({"config": cfg_off} if cfg_off is not None else {}),
                        )
                        text = (getattr(response, "text", "") or "").strip()
                        if text:
                            return text
                    except Exception as exc2:
                        last_error = exc2
                logger.warning(
                    "Gemini stage failed model=%s attempt=%s: %s",
                    model_name,
                    attempt + 1,
                    exc,
                )
                if _is_transient_error(exc):
                    saw_transient = True
                    continue
        if saw_transient and attempt < len(RETRY_DELAYS):
            time.sleep(RETRY_DELAYS[attempt])

    if last_error and _is_transient_error(last_error):
        return ""
    return ""


def generate_ai_reply_staged(prompt: str) -> str:
    """
    Құран талдауы → хадис толықтыру → ресми беттер (RAQAT_AI_QA_SOURCE_URLS allowlist) кезеңдері.
    Үшінші кезеңде Google Search қолданылмайды; тек ENV арқылы бекітілген URL-дардан алынған мәтін.
    Әр кезең бөлек генерация; нәтиже бір мәтінде бөліктерге бөлінеді.
    """
    p = (prompt or "").strip()
    lang = os.getenv("RAQAT_AI_LANG", "kk")
    parts = build_retrieved_context_parts(p, lang=lang)
    try:
        faq = fetch_qa_sources_context()
    except Exception as exc:
        logger.warning("fetch_qa_sources_context: %s", exc)
        faq = ""
    if (faq or "").strip():
        q0 = (parts.get("quran") or "").strip()
        parts["quran"] = f"{q0}\n\n---\n\n{faq.strip()}".strip() if q0 else faq.strip()

    kb_block, _kb_src = _append_islamic_kb_block("", p)
    if (kb_block or "").strip():
        q0 = (parts.get("quran") or "").strip()
        parts["quran"] = f"{q0}\n\n---\n\n{kb_block.strip()}".strip() if q0 else kb_block.strip()

    mq = _stage_max_tokens("RAQAT_AI_STAGE_QURAN_MAX", 900)
    mw = _stage_max_tokens("RAQAT_AI_STAGE_WEB_MAX", 1200)
    stage_think = _thinking_budget_staged_per_stage(_thinking_budget_for_request(quick=False))

    c1 = _prompt_stage_quran(p, parts.get("quran") or "", parts.get("asma") or "")
    t1 = (
        _gemini_generate(
            c1, with_search_tool=False, max_output_tokens=mq, thinking_budget=stage_think
        )
        or ""
    ).strip()

    official_urls_configured = bool(parse_qa_source_urls())
    faq_s = (faq or "").strip()
    if not official_urls_configured:
        t3 = ""
    elif not faq_s:
        t3 = (
            "Көрсетілген ресми беттерден (`RAQAT_AI_QA_SOURCE_URLS`) қосымша мәтін "
            "алынбады немесе қолжетімсіз."
        )
    else:
        c3 = _prompt_stage_web(p, t1, official_web_excerpts=faq_s)
        t3 = (
            _gemini_generate(
                c3, with_search_tool=False, max_output_tokens=mw, thinking_budget=stage_think
            )
            or ""
        ).strip()
        if not t3.strip():
            t3 = (
                "Ресми бет үзінділерінен қосымша қысқаша жинақ алынбады "
                "немесе қолжетімсіз."
            )

    out_parts: list[str] = []
    if t1:
        out_parts.append("## Құран және ішкі дерекқор\n\n" + t1)
    if t3.strip():
        out_parts.append("## Ресми беттер (allowlist) және қосымша дереккөздер\n\n" + t3.strip())
    if out_parts:
        return "\n\n".join(out_parts)
    return "AI уақытша жауап бере алмады. Кейінірек қайта көріңіз."


def _fast_llm_config(
    *,
    with_search_tool: bool,
    max_output_tokens: int | None = None,
    thinking_budget: int = 0,
):
    """
    thinking_budget>0 → Gemini ішкі ойлау (RAQAT_AI_THINKING_BUDGET); quick режимде 0.
    Google Search қосулы болса — tool + сол конфиг; әйтпесе тек генерация конфигі.
    """
    if genai_types is None:
        return None
    tb = max(0, min(int(thinking_budget), 8192))
    thinking = genai_types.ThinkingConfig(thinking_budget=tb)
    mo = max_output_tokens if max_output_tokens is not None else _max_output_tokens()
    if with_search_tool and _google_search_enabled():
        try:
            tool = genai_types.Tool(google_search=genai_types.GoogleSearch())
            return genai_types.GenerateContentConfig(
                tools=[tool],
                thinking_config=thinking,
                max_output_tokens=mo,
            )
        except Exception as exc:
            logger.warning("Google Search tool unavailable: %s", exc)
    return genai_types.GenerateContentConfig(
        thinking_config=thinking,
        max_output_tokens=mo,
    )


def _is_transient_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return any(
        m in text
        for m in (
            "503",
            "unavailable",
            "overloaded",
            "deadline",
            "timeout",
            "temporarily",
            "rate limit",
            "resource exhausted",
        )
    )


def _get_client():
    global _client
    if _client is not None:
        return _client
    if genai is None:
        return None
    key = (os.getenv("GEMINI_API_KEY") or os.getenv("RAQAT_GEMINI_API_KEY") or "").strip()
    if not key:
        return None
    try:
        http_options = None
        if genai_types is not None:
            try:
                raw = (os.getenv("RAQAT_GEMINI_HTTP_TIMEOUT_S") or "90").strip() or "90"
                to = float(raw)
            except ValueError:
                to = 90.0
            to = max(15.0, min(to, 300.0))
            http_options = genai_types.HttpOptions(timeout=to)
        if http_options is not None:
            _client = genai.Client(api_key=key, http_options=http_options)
        else:
            _client = genai.Client(api_key=key)
    except Exception as exc:
        logger.warning("Gemini client init failed: %s", exc)
        _client = None
    return _client


def _append_faq_context_block(retrieved: str) -> str:
    """ENV allowlist URL-дардан алынған сұрақ-жауап мәтінін ішкі контекст соңына қосады."""
    try:
        faq = fetch_qa_sources_context()
    except Exception as exc:
        logger.warning("fetch_qa_sources_context: %s", exc)
        return retrieved
    faq = (faq or "").strip()
    if not faq:
        return retrieved
    base = (retrieved or "").strip()
    if base:
        return f"{base}\n\n---\n\n{faq}"
    return faq


def _append_islamic_kb_block(retrieved: str, prompt: str) -> tuple[str, list[dict]]:
    """Fatua.kz / Muftyat.kz индекстелген RAG үзінділері."""
    if build_islamic_kb_context is None:
        return retrieved, []
    try:
        block, sources = build_islamic_kb_context(prompt)
    except Exception as exc:
        logger.warning("build_islamic_kb_context: %s", exc)
        return retrieved, []
    block = (block or "").strip()
    if not block:
        return retrieved, sources
    base = (retrieved or "").strip()
    if base:
        return f"{base}\n\n---\n\n{block}", sources
    return block, sources


def _islamic_kb_rules_line() -> str:
    if build_islamic_kb_context is None:
        return ""
    try:
        from islamic_kb.config import islamic_kb_enabled

        if not islamic_kb_enabled():
            return ""
    except ImportError:
        return ""
    return (
        "Төменде Muftyat.kz / Fatua.kz үзінділері болса — фиқһтық жауапты ТЕК осы үзінділерге сүйен; "
        "жеткілікті дерек жоқ болса «сенімді пәтуа табылмады» деп жаз; ойдан үкім шығарма.\n"
    )


def _kb_only_retrieved_and_sources(prompt: str) -> tuple[str, list[dict]]:
    """Тек islamic_kb (fatua/muftyat); бос болса дереу қайтаруға болады."""
    retrieved, kb_sources = _append_islamic_kb_block("", prompt)
    return (retrieved or "").strip(), list(kb_sources)


def generate_ai_reply_single_meta(
    prompt: str,
    *,
    quick: bool = False,
    kb_only: bool | None = None,
) -> AiReplyResult:
    """Бір шақыруда барлық контекст (бұрынғы режим) немесе quick үшін Құран+есімдер алдымен."""
    if kb_only is not None:
        token = _KB_ONLY_OVERRIDE.set(bool(kb_only))
        try:
            return generate_ai_reply_single_meta(prompt, quick=quick)
        finally:
            _KB_ONLY_OVERRIDE.reset(token)

    if not (prompt or "").strip():
        return AiReplyResult(text="Сұрақты толық жазыңыз.")

    kb_sources: list[dict] = []
    if _ai_kb_only_mode():
        retrieved, kb_sources = _kb_only_retrieved_and_sources(prompt)
        if not retrieved:
            return AiReplyResult(
                text=(
                    "Fatua.kz және Muftyat.kz индексінде сұрағыңызға сәйкес материал табылмады. "
                    "Сұрақты басқаша қайталаңыз немесе ресми сайттарға өтіңіз."
                ),
                sources=kb_sources,
            )
    else:
        lang = os.getenv("RAQAT_AI_LANG", "kk")
        retrieved = ""
        try:
            if quick and os.getenv("RAQAT_AI_QUICK_QURAN_FIRST", "1").strip().lower() not in (
                "0",
                "false",
                "no",
                "off",
            ):
                pr = build_retrieved_context_parts(prompt.strip(), lang=lang)
                chunks = [x for x in (pr.get("quran"), pr.get("asma")) if x and str(x).strip()]
                retrieved = "\n\n---\n\n".join(chunks) if chunks else ""
            if not (retrieved or "").strip():
                retrieved = build_retrieved_context(prompt.strip(), lang=lang)
        except Exception as exc:
            logger.warning("build_retrieved_context failed: %s", exc)

        retrieved = _append_faq_context_block(retrieved)
        retrieved, kb_sources = _append_islamic_kb_block(retrieved, prompt)

    client = _get_client()
    if client is None:
        return AiReplyResult(text="AI уақытша қолжетімсіз немесе API key қойылмаған.")

    mo_cap = _quick_max_output_tokens() if quick else None
    think_b = _thinking_budget_for_request(quick=quick)

    last_error = None
    for attempt in range(len(RETRY_DELAYS) + 1):
        saw_transient = False
        for model_name in _model_candidates():
            cfg = None
            try:
                cfg = _fast_llm_config(
                    with_search_tool=True,
                    max_output_tokens=mo_cap,
                    thinking_budget=think_b,
                )
                allow_internet = (
                    False
                    if _ai_kb_only_mode()
                    else bool(cfg and getattr(cfg, "tools", None))
                )
                contents = _prompt_with_retrieval(
                    prompt,
                    retrieved,
                    allow_internet=allow_internet,
                    quick=quick,
                )
                kwargs: dict = {"model": model_name, "contents": contents}
                if cfg is not None:
                    kwargs["config"] = cfg
                response = client.models.generate_content(**kwargs)
                text = (getattr(response, "text", "") or "").strip()
                out = text or "Жауап алынбады."
                return AiReplyResult(text=out, sources=kb_sources)
            except Exception as exc:
                last_error = exc
                err_l = str(exc).lower()
                # Google Search / grounding осы модельде болмаса — тек дерекқор режимімен қайталау
                if cfg is not None and any(
                    s in err_l
                    for s in (
                        "google_search",
                        "grounding",
                        "search tool",
                        "tool_config",
                        "tools are not",
                        "unsupported tool",
                    )
                ):
                    try:
                        contents_off = _prompt_with_retrieval(
                            prompt,
                            retrieved,
                            allow_internet=False,
                            quick=quick,
                        )
                        cfg_off = _fast_llm_config(
                            with_search_tool=False,
                            max_output_tokens=mo_cap,
                            thinking_budget=think_b,
                        )
                        response = client.models.generate_content(
                            model=model_name,
                            contents=contents_off,
                            **({"config": cfg_off} if cfg_off is not None else {}),
                        )
                        text = (getattr(response, "text", "") or "").strip()
                        if text:
                            return AiReplyResult(text=text, sources=kb_sources)
                    except Exception as exc2:
                        last_error = exc2
                logger.warning(
                    "Platform Gemini failed model=%s attempt=%s: %s",
                    model_name,
                    attempt + 1,
                    exc,
                )
                if _is_transient_error(exc):
                    saw_transient = True
                    continue
        if saw_transient and attempt < len(RETRY_DELAYS):
            time.sleep(RETRY_DELAYS[attempt])

    if last_error and _is_transient_error(last_error):
        return AiReplyResult(text=GEMINI_BUSY_REPLY_KK, sources=kb_sources)
    return AiReplyResult(
        text="AI уақытша жауап бере алмады. Кейінірек қайта көріңіз.",
        sources=kb_sources,
    )


def generate_ai_reply_single(prompt: str, *, quick: bool = False) -> str:
    return generate_ai_reply_single_meta(prompt, quick=quick).text


def generate_ai_reply(
    prompt: str,
    *,
    quick: bool = False,
    use_staged_pipeline: bool = False,
    kb_only: bool | None = None,
) -> str:
    return generate_ai_reply_meta(
        prompt,
        quick=quick,
        use_staged_pipeline=use_staged_pipeline,
        kb_only=kb_only,
    ).text


def generate_ai_reply_meta(
    prompt: str,
    *,
    quick: bool = False,
    use_staged_pipeline: bool = False,
    kb_only: bool | None = None,
) -> AiReplyResult:
    """
    quick=True: бір шақыру (қысқа).
    use_staged_pipeline=True және RAQAT_AI_PIPELINE_STAGES=1: Құран → хадис → ресми беттер (3 кезең).
    Әйтпесе бір шақыру (халал, бот және т.б. — әдепкі).
    """
    if kb_only is not None:
        token = _KB_ONLY_OVERRIDE.set(bool(kb_only))
        try:
            return generate_ai_reply_meta(
                prompt,
                quick=quick,
                use_staged_pipeline=use_staged_pipeline,
            )
        finally:
            _KB_ONLY_OVERRIDE.reset(token)

    if not (prompt or "").strip():
        return AiReplyResult(text="Сұрақты толық жазыңыз.")

    if _get_client() is None:
        return AiReplyResult(text="AI уақытша қолжетімсіз немесе API key қойылмаған.")

    if _ai_kb_only_mode():
        return generate_ai_reply_single_meta(prompt, quick=quick)

    if (
        use_staged_pipeline
        and not quick
        and _pipeline_stages_enabled()
    ):
        try:
            text = generate_ai_reply_staged(prompt)
            _, sources = _append_islamic_kb_block("", prompt)
            return AiReplyResult(text=text, sources=list(sources))
        except Exception as exc:
            logger.warning("staged AI pipeline failed, fallback single: %s", exc)

    return generate_ai_reply_single_meta(prompt, quick=quick)
