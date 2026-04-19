# -*- coding: utf-8 -*-
"""Орталық Gemini шақыру (боттан HTTP арқылы)."""
from __future__ import annotations

import logging
import os
import time
from typing import Optional

from ai_context_retrieval import build_retrieved_context

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
RETRY_DELAYS = (0.8, 1.5)


def _model_candidates() -> tuple[str, ...]:
    raw = os.getenv(
        "AI_MODEL_CANDIDATES",
        "gemini-2.5-flash,gemini-2.5-flash-lite",
    )
    return tuple(m.strip() for m in raw.split(",") if m.strip())


def _google_search_enabled() -> bool:
    return os.getenv("RAQAT_AI_ENABLE_GOOGLE_SEARCH", "1").strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )


def _structure_rules_online() -> str:
    """Ішкі контекст: ~35% Құран, ~35% хадис, ~10% Алла есімдері; Google Search ~20% сенімді сыртқы дерек."""
    return (
        "Сен RAQAT AI-сің.\n"
        "Қазақша жауап бер. Білім үлестірмесін шамамен мынадай ұста (сандық мағынада, қайталамай):\n"
        "— ~35%: төмендегі «Құраннан табылған үзінділер»; сүре:аят. Аят жоқ болса, ашық айт.\n"
        "— ~35%: «Хадистерден табылған үзінділер»; қайнар, дәреже (бар болса). Жоқ болса сахих принцип.\n"
        "— ~10%: «Аллаһтың есімдері» — тәжриби/тәрбие/ұлықтық тұрғыдан тиісті есімдерді қысқа байланыстыр.\n"
        "— ~20%: Google Search (қосылған болса) — тек сенімді дереккөздер; сілтеме немесе қайнарды бір жолмен ата.\n"
        "Тамақ, дәрі-дәрмек, инвестиция немесе фиқһтық даулы сұрақтарда: "
        "қауіпсіз сақтық, «мен үкім бермеймін», керек жерде ұстазға жүгінуді ұсын.\n"
        "Толық әрі түсінікті, артық сөзсіз; фиқһ даулысында мәзһабтарды бейтарап, қысқа сипатта."
    )


def _structure_rules_offline() -> str:
    """Google Search жоқ: ішкі Құран + хадис + есімдер (без сыртқы веб)."""
    return (
        "Сен RAQAT AI-сің. Интернет жоқ — тек төмендегі ішкі үзінділер (Құран, хадис, Алла есімдері); "
        "ойдан аят/хадис қоспа.\n"
        "Үлестірме: ~35% Құран, ~35% хадис, ~10% есімдер; сыртқы веб жоқ.\n"
        "Дерек жоқ болса: "
        "«Осы сұрақ бойынша дерекқорда жеткілікті мәлімет жоқ» + Құран/хадис бөлімінен іздеуді ұсын.\n"
        "Тамақ/фиқһ даулы тақырыптарда сыртқы біліммен «дәл үкім» берме — тек ішкі дерекке сүйен.\n"
        "Толық әрі түсінікті, артық сөзсіз."
    )


def _prompt_with_retrieval(user_prompt: str, retrieved: str, *, allow_internet: bool) -> str:
    blocks = [_structure_rules_online() if allow_internet else _structure_rules_offline()]
    if retrieved.strip():
        blocks.append(
            "=== Ішкі дерекқордан алынған үзінділер (іздеу сұрауына сәйкес) ===\n" + retrieved.strip()
        )
    elif allow_internet:
        blocks.append(
            "=== Ішкі дерекқордан үзінді табылмады (сұрау тым қысқа немесе сәйкес жоқ). "
            "Құран/хадис бөлімінде оны айтып, қалғанын жалпы мәлім біліммен сақтықпен толықтыра аласың. ==="
        )
    else:
        blocks.append(
            "=== Ішкі дерекқордан сұрауға сәйкес үзінді табылмады. "
            "Интернет жоқ: жалпы біліммен жауап берме — тек жоғарыдағы ережеге сәйкес қазақша хабарлама жаз. ==="
        )
    blocks.append("=== Пайдаланушы сұрағы ===\n" + (user_prompt or "").strip())
    return "\n\n".join(blocks)


def _max_output_tokens() -> int:
    try:
        v = int(os.getenv("RAQAT_AI_MAX_OUTPUT_TOKENS", "2560"))
    except ValueError:
        v = 2560
    return max(512, min(v, 8192))


def _fast_llm_config(*, with_search_tool: bool):
    """
    Жылдамдық: ішкі «thinking» өшіру, max_output шегі.
    Google Search қосулы болса — tool + сол конфиг; әйтпесе тек генерация конфигі (бұрынғы None орнына).
    """
    if genai_types is None:
        return None
    thinking = genai_types.ThinkingConfig(thinking_budget=0)
    mo = _max_output_tokens()
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
        _client = genai.Client(api_key=key)
    except Exception as exc:
        logger.warning("Gemini client init failed: %s", exc)
        _client = None
    return _client


def generate_ai_reply(prompt: str) -> str:
    if not (prompt or "").strip():
        return "Сұрақты толық жазыңыз."

    client = _get_client()
    if client is None:
        return "AI уақытша қолжетімсіз немесе API key қойылмаған."

    retrieved = ""
    try:
        retrieved = build_retrieved_context(prompt.strip(), lang=os.getenv("RAQAT_AI_LANG", "kk"))
    except Exception as exc:
        logger.warning("build_retrieved_context failed: %s", exc)

    last_error = None
    for attempt in range(len(RETRY_DELAYS) + 1):
        saw_transient = False
        for model_name in _model_candidates():
            cfg = None
            try:
                cfg = _fast_llm_config(with_search_tool=True)
                allow_internet = bool(cfg and getattr(cfg, "tools", None))
                contents = _prompt_with_retrieval(prompt, retrieved, allow_internet=allow_internet)
                kwargs: dict = {"model": model_name, "contents": contents}
                if cfg is not None:
                    kwargs["config"] = cfg
                response = client.models.generate_content(**kwargs)
                text = (getattr(response, "text", "") or "").strip()
                return text or "Жауап алынбады."
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
                            prompt, retrieved, allow_internet=False
                        )
                        cfg_off = _fast_llm_config(with_search_tool=False)
                        response = client.models.generate_content(
                            model=model_name,
                            contents=contents_off,
                            **({"config": cfg_off} if cfg_off is not None else {}),
                        )
                        text = (getattr(response, "text", "") or "").strip()
                        if text:
                            return text
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
        return (
            "AI сервері қазір бос емес. "
            "1-2 минуттан кейін қайта сұрап көріңіз."
        )
    return "AI уақытша жауап бере алмады. Кейінірек қайта көріңіз."
