from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable


SAFE_REPLY_KK = (
    "Бұл сұрақ қауіпсіздік және діни әдеп тұрғысынан жауап беруге жарамайды. "
    "Діни мәселе бойынша ҚМДБ/Fatua.kz/Muftyat.kz дереккөздеріне және білікті ұстазға жүгініңіз. "
    "Зорлық, такфир, өшпенділік немесе заңға қайшы әрекетке көмектеспеймін."
)


@dataclass(frozen=True)
class AiSafetyModerationResult:
    allowed: bool
    risk_level: str
    categories: tuple[str, ...] = ()
    message_kk: str | None = None


_CATEGORY_PATTERNS: dict[str, tuple[str, ...]] = {
    "takfir": (
        r"\bтакфир\b",
        r"\btakfir\b",
        r"\bк[әa]п[іi]р\s+деп\b",
        r"\bк[әa]п[іi]рлер(ге|ді|д[іi])?\b",
        r"\bм[ұу]сылман\s+емес\s+деп\b",
        r"\bкафир(ом|ы|ам|ов)?\b",
        r"\bkafir(s)?\b",
        r"\bdeclare\s+.*\bkafir\b",
        r"\bобъяв(ить|и)\s+.*\bкафир",
    ),
    "extremism": (
        r"\bэкстремизм\b",
        r"\bтеррор(изм|ист)?\b",
        r"\bterror(ism|ist)?\b",
        r"\bрадикал(ды|изм)?\b",
        r"\bradicali[sz](e|ation)\b",
        r"\bд[жx]ихад(қа|ты|шылар)?\b",
        r"\bжиһад(қа|ты|шылар)?\b",
        r"\bjihad(ist|is|s)?\b",
        r"\bисламское\s+государство\b",
        r"\bisis\b",
        r"\bisil\b",
    ),
    "violence": (
        r"\bжарыл(ыс|ғыш|ату)\w*\b",
        r"\bбомб\w*\b",
        r"\bbomb(s|ing)?\b",
        r"\bқару\b",
        r"\bоружи(е|я|ем)\b",
        r"\bweapon(s)?\b",
        r"\bөлтіру\b",
        r"\bубить\b",
        r"\bkill\b",
        r"\bатуды\b",
        r"\bпышақта\w*\b",
        r"\bstab\b",
        r"\bшабуыл(дау|ға)?\b",
        r"\battack\b",
    ),
    "sectarian_hate": (
        r"\bмазхаб(ты)?\s+жою\b",
        r"\bуничтож(ить|ать)\s+.*\b(мазхаб|сект)",
        r"\bdestroy\s+.*\b(madhhab|sect)\b",
        r"\bсекта(ны|ға)?\b",
        r"\bдінсіз(дер)?\b",
        r"\bбезбожник(и|ов|ам)?\b",
        r"\bөшпенділік\b",
        r"\bhate\b",
    ),
    "anti_state_illegal": (
        r"\bмемлекетке\s+қарсы\b",
        r"\bзаңсыз\b.*\bәрекет\b",
        r"\bқұпия\s+ұйым\b",
        r"\bбүлік\b",
        r"\bпротив\s+государства\b",
        r"\bнезаконн(ое|ый|ая)\b.*\bдействи",
        r"\billegal\b.*\b(action|activity)\b",
        r"\bsecret\s+group\b",
        r"\binsurrection\b",
    ),
}

_COMPILED: dict[str, tuple[re.Pattern[str], ...]] = {
    category: tuple(re.compile(p, re.IGNORECASE | re.UNICODE) for p in patterns)
    for category, patterns in _CATEGORY_PATTERNS.items()
}

_ACTION_HINTS = tuple(
    re.compile(p, re.IGNORECASE | re.UNICODE)
    for p in (
        r"\bқалай\s+(жасау|істеу|ұйымдастыру|қосу|алу)\b",
        r"\bүйрет\b",
        r"\bнұсқаулық\b",
        r"\bжоспар\b",
        r"\binstruction\b",
        r"\binstructions\b",
        r"\bhow\s+to\b",
        r"\bmake\b",
        r"\bbuild\b",
        r"\bcreate\b",
        r"\bteach\b",
        r"\bguide\b",
        r"\bplan\b",
        r"\bкак\s+(сделать|организовать|создать|получить)\b",
        r"\bнаучи\b",
        r"\bинструкци(я|ю|и)\b",
        r"\bплан\b",
    )
)


def _matched_categories(text: str) -> Iterable[str]:
    for category, patterns in _COMPILED.items():
        if any(p.search(text) for p in patterns):
            yield category


def moderate_ai_prompt(prompt: str | None) -> AiSafetyModerationResult:
    text = (prompt or "").strip()
    if not text:
        return AiSafetyModerationResult(allowed=True, risk_level="low")

    categories = tuple(dict.fromkeys(_matched_categories(text)))
    if not categories:
        return AiSafetyModerationResult(allowed=True, risk_level="low")

    action_intent = any(p.search(text) for p in _ACTION_HINTS)
    severe = any(c in categories for c in ("extremism", "violence", "anti_state_illegal"))
    if action_intent or severe:
        return AiSafetyModerationResult(
            allowed=False,
            risk_level="blocked",
            categories=categories,
            message_kk=SAFE_REPLY_KK,
        )

    return AiSafetyModerationResult(
        allowed=True,
        risk_level="review",
        categories=categories,
    )


def moderate_ai_reply(reply: str | None) -> AiSafetyModerationResult:
    """Post-generation guard: model/cache жауабында қауіпті мазмұнды кесу."""
    text = (reply or "").strip()
    if not text:
        return AiSafetyModerationResult(allowed=True, risk_level="low")

    categories = tuple(dict.fromkeys(_matched_categories(text)))
    if not categories:
        return AiSafetyModerationResult(allowed=True, risk_level="low")

    action_intent = any(p.search(text) for p in _ACTION_HINTS)
    severe = any(
        c in categories
        for c in ("extremism", "violence", "anti_state_illegal", "sectarian_hate")
    )
    takfir_action = "takfir" in categories and action_intent
    if severe or takfir_action or (action_intent and categories):
        return AiSafetyModerationResult(
            allowed=False,
            risk_level="blocked",
            categories=categories,
            message_kk=SAFE_REPLY_KK,
        )

    return AiSafetyModerationResult(
        allowed=True,
        risk_level="review",
        categories=categories,
    )


def enforce_ai_reply_safety(reply: str) -> tuple[str, AiSafetyModerationResult]:
    safety = moderate_ai_reply(reply)
    if not safety.allowed:
        return (safety.message_kk or SAFE_REPLY_KK, safety)
    return (reply, safety)
