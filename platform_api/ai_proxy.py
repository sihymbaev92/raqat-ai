# -*- coding: utf-8 -*-
"""Орталық Gemini шақыру (боттан HTTP арқылы)."""
from __future__ import annotations

import logging
import os
import time
from typing import Optional

from ai_context_retrieval import build_retrieved_context, build_retrieved_context_parts

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


def _prompt_with_retrieval(
    user_prompt: str,
    retrieved: str,
    *,
    allow_internet: bool,
    quick: bool = False,
) -> str:
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
    if quick:
        blocks.append(
            "=== ЖАУАП ТӘРТІБІ (маңызды) ===\n"
            "Алдымен Құранға сәйкес негізгі жауап бер (2–5 сөйлем), қазақша. "
            "Төмендегі үзінділерде хадис болмаса, оны қоспа; ұзақ талдау берме — тек қысқа қорытынды."
        )
    blocks.append("=== Пайдаланушы сұрағы ===\n" + (user_prompt or "").strip())
    return "\n\n".join(blocks)


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
    return os.getenv("RAQAT_AI_PIPELINE_STAGES", "1").strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )


def _prompt_stage_quran(user_prompt: str, quran_block: str, asma_block: str) -> str:
    blocks = [
        "Сен RAQAT AI-сің. Бұл қадамда тек Құран және (бар болса) Аллаһтың есімдері бойынша қазақша жауап бер.",
        "Төмендегі үзінділерді сенімді дерек ретінде қолдан; ойдан аят немесе аят нөмірін қоспа.",
        "Хадис, сүннет және интернетті осы жауапқа қоспа — олар келесі қадамдарда қосылады.",
    ]
    if (quran_block or "").strip():
        blocks.append("=== Құраннан табылған үзінділер ===\n" + quran_block.strip())
    else:
        blocks.append(
            "=== Құраннан табылған үзінділер ===\n"
            "(бос — дерекқорда сәйкес аят табылмады; оны ашық айт.)"
        )
    if (asma_block or "").strip():
        blocks.append("=== Аллаһтың есімдері (ішкі анықтама) ===\n" + asma_block.strip())
    blocks.append("=== Пайдаланушы сұрағы ===\n" + (user_prompt or "").strip())
    blocks.append(
        "Жауапты қазақша жаз. Талдауды осы бөлім шегінде қысқа әрі нақты ұста (үзінділерге сүйен)."
    )
    return "\n\n".join(blocks)


def _prompt_stage_hadith(user_prompt: str, hadith_block: str, quran_answer: str) -> str:
    blocks = [
        "Сен RAQAT AI-сің. Бұл қадамда тек хадис және сүннет бойынша қазақша толықтыр.",
        "Төмендегі хадис үзінділерін сенімді дерек ретінде қолдан; ойдан хадис қоспа.",
        "Құран бөлімін толық қайталамай, сүннетпен сәйкестікті немесе толықтыруды көрсет.",
    ]
    blocks.append(
        "=== Алдыңғы «Құран және ішкі дерекқор» бөлімі (қысқаша, қайталаусыз сүйен) ===\n"
        + (quran_answer or "").strip()[:6000]
    )
    if (hadith_block or "").strip():
        blocks.append("=== Хадистерден табылған үзінділер ===\n" + hadith_block.strip())
    else:
        blocks.append(
            "=== Хадистерден табылған үзінділер ===\n"
            "(бос — дерекқорда тікелей сәйкес хадис табылмады; оны ашық айт.)"
        )
    blocks.append("=== Пайдаланушы сұрағы ===\n" + (user_prompt or "").strip())
    blocks.append("Жауапты қазақша жаз. Дәреже (сахих/хасан/заиф) бар болса ата.")
    return "\n\n".join(blocks)


def _prompt_stage_web(user_prompt: str, quran_answer: str, hadith_answer: str) -> str:
    blocks = [
        "Сен RAQAT AI-сің. Google Search арқылы сенімді сыртқы дереккөздерді қос (фиқһ үкім емес, ақпараттық).",
        "Алдыңғы Құран және хадис бөлімдерін қайталамай, тек қосымша сілтеме/түсініктеме бер.",
        "Даулы мәселелерде сақтық; «мен үкім бермеймін» принципін сақта.",
    ]
    blocks.append(
        "=== Алдыңғы Құран бөлімі (қысқаша) ===\n" + (quran_answer or "").strip()[:4000]
    )
    blocks.append(
        "=== Алдыңғы хадис бөлімі (қысқаша) ===\n" + (hadith_answer or "").strip()[:4000]
    )
    blocks.append("=== Пайдаланушы сұрағы ===\n" + (user_prompt or "").strip())
    blocks.append(
        "Қазақша жауап. Қайнарды немесе сенімді сайт атауын қысқа көрсет; ұзақ тізім берме."
    )
    return "\n\n".join(blocks)


def _gemini_generate(
    contents: str,
    *,
    with_search_tool: bool,
    max_output_tokens: int | None,
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
    Құран талдауы → хадис толықтыру → интернет (іздеу) кезеңдері.
    Әр кезең бөлек генерация; нәтиже бір мәтінде бөліктерге бөлінеді.
    """
    p = (prompt or "").strip()
    lang = os.getenv("RAQAT_AI_LANG", "kk")
    parts = build_retrieved_context_parts(p, lang=lang)

    mq = _stage_max_tokens("RAQAT_AI_STAGE_QURAN_MAX", 900)
    mh = _stage_max_tokens("RAQAT_AI_STAGE_HADITH_MAX", 900)
    mw = _stage_max_tokens("RAQAT_AI_STAGE_WEB_MAX", 1200)

    c1 = _prompt_stage_quran(p, parts.get("quran") or "", parts.get("asma") or "")
    t1 = _gemini_generate(c1, with_search_tool=False, max_output_tokens=mq)
    if not t1.strip():
        t1 = (
            "Осы сұрақ бойынша Құран дерекқорынан сәйкес үзінді табылмады "
            "немесе модель қысқа жауап бере алмады."
        )

    c2 = _prompt_stage_hadith(p, parts.get("hadith") or "", t1)
    t2 = _gemini_generate(c2, with_search_tool=False, max_output_tokens=mh)
    if not t2.strip():
        t2 = (
            "Хадис дерекқорынан тікелей сәйкес үзінді табылмады "
            "немесе қысқа толықтыру берілмеді."
        )

    if not _google_search_enabled():
        t3 = (
            "Сыртқы іздеу өшірілген (RAQAT_AI_ENABLE_GOOGLE_SEARCH). "
            "Қосымша веб-деректер қосылмады."
        )
    else:
        c3 = _prompt_stage_web(p, t1, t2)
        t3 = _gemini_generate(c3, with_search_tool=True, max_output_tokens=mw)
        if not t3.strip():
            t3 = (
                "Сыртқы іздеу арқылы қосымша қысқа деректер алынбады "
                "немесе қолжетімсіз."
            )

    return (
        "## Құран және ішкі дерекқор\n\n"
        f"{t1.strip()}\n\n"
        "## Хадис және сүннет\n\n"
        f"{t2.strip()}\n\n"
        "## Іздеу және қосымша дереккөздер\n\n"
        f"{t3.strip()}"
    )


def _fast_llm_config(
    *,
    with_search_tool: bool,
    max_output_tokens: int | None = None,
):
    """
    Жылдамдық: ішкі «thinking» өшіру, max_output шегі.
    Google Search қосулы болса — tool + сол конфиг; әйтпесе тек генерация конфигі (бұрынғы None орнына).
    """
    if genai_types is None:
        return None
    thinking = genai_types.ThinkingConfig(thinking_budget=0)
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
        _client = genai.Client(api_key=key)
    except Exception as exc:
        logger.warning("Gemini client init failed: %s", exc)
        _client = None
    return _client


def generate_ai_reply_single(prompt: str, *, quick: bool = False) -> str:
    """Бір шақыруда барлық контекст (бұрынғы режим) немесе quick үшін Құран+есімдер алдымен."""
    if not (prompt or "").strip():
        return "Сұрақты толық жазыңыз."

    client = _get_client()
    if client is None:
        return "AI уақытша қолжетімсіз немесе API key қойылмаған."

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

    mo_cap = _quick_max_output_tokens() if quick else None

    last_error = None
    for attempt in range(len(RETRY_DELAYS) + 1):
        saw_transient = False
        for model_name in _model_candidates():
            cfg = None
            try:
                cfg = _fast_llm_config(
                    with_search_tool=True,
                    max_output_tokens=mo_cap,
                )
                allow_internet = bool(cfg and getattr(cfg, "tools", None))
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
                            prompt,
                            retrieved,
                            allow_internet=False,
                            quick=quick,
                        )
                        cfg_off = _fast_llm_config(
                            with_search_tool=False,
                            max_output_tokens=mo_cap,
                        )
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


def generate_ai_reply(
    prompt: str,
    *,
    quick: bool = False,
    use_staged_pipeline: bool = False,
) -> str:
    """
    quick=True: бір шақыру (қысқа).
    use_staged_pipeline=True және RAQAT_AI_PIPELINE_STAGES=1: Құран → хадис → іздеу (3 кезең).
    Әйтпесе бір шақыру (халал, бот және т.б. — әдепкі).
    """
    if not (prompt or "").strip():
        return "Сұрақты толық жазыңыз."

    if _get_client() is None:
        return "AI уақытша қолжетімсіз немесе API key қойылмаған."

    if (
        use_staged_pipeline
        and not quick
        and _pipeline_stages_enabled()
    ):
        try:
            return generate_ai_reply_staged(prompt)
        except Exception as exc:
            logger.warning("staged AI pipeline failed, fallback single: %s", exc)

    return generate_ai_reply_single(prompt, quick=quick)
