"""Shared Kazakh OCR cleanup for muftyat PDF text (tajweed + hajj)."""
from __future__ import annotations

import re

KK = r"[а-яёәіңғүұқөһ]"
HYPHEN_BREAK = re.compile(rf"({KK})-\n({KK})", re.I)
DIGIT_HYPHEN_KK = re.compile(rf"(\d)-\n({KK})", re.I)
DIGIT_HYPHEN_DIGIT = re.compile(r"(\d)-\n(\d)")
HYPHEN_DOT = re.compile(rf"({KK})-+\.\s*({KK})", re.I)
SPACED_HYPHEN = re.compile(rf"({KK})\s+-\s+({KK})", re.I)
LETTER_SPACED = re.compile(
    r"[А-ЯӘІҢҒҮҰҚӨҺа-яёәіңғүұқөһ](?:[ \t]+[А-ЯӘІҢҒҮҰҚӨҺа-яёәіңғүұқөһ]){2,}",
    re.U,
)
GLUED_FOOTNOTE = re.compile(rf"({KK})([А-ЯӘІҢҒҮҰҚӨҺ])")

TYPO_REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"кажет", re.I), "қажет"),
    (re.compile(r"Тиләует"), "Тіләуат"),
    (re.compile(r"әр\s*\.\s*қайсысына", re.I), "әрқайсысына"),
]


def _collapse_letter_spaced(match: re.Match[str]) -> str:
    return re.sub(r"\s+", "", match.group(0))


def normalize_muftyat_kk_text(text: str) -> str:
    t = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    if not t.strip():
        return ""
    t = HYPHEN_BREAK.sub(r"\1\2", t)
    t = DIGIT_HYPHEN_KK.sub(r"\1\2", t)
    t = DIGIT_HYPHEN_DIGIT.sub(r"\1-\2", t)
    t = HYPHEN_DOT.sub(r"\1\2", t)
    t = SPACED_HYPHEN.sub(r"\1-\2", t)
    t = LETTER_SPACED.sub(_collapse_letter_spaced, t)
    t = GLUED_FOOTNOTE.sub(r"\1. \2", t)
    t = re.sub(r"\s*\.\s*\.", ".", t)
    t = re.sub(r"\.{3,}", "…", t)
    for pat, rep in TYPO_REPLACEMENTS:
        t = pat.sub(rep, t)
    t = re.sub(r"[ \t]{2,}", " ", t)
    t = re.sub(r"\s+([,.;:!?])", r"\1", t)
    return t.strip()


def normalize_muftyat_kk_page_text(text: str) -> str:
    t = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    if not t.strip():
        return ""
    t = HYPHEN_BREAK.sub(r"\1\2", t)
    t = DIGIT_HYPHEN_KK.sub(r"\1\2", t)
    t = DIGIT_HYPHEN_DIGIT.sub(r"\1-\2", t)
    t = HYPHEN_DOT.sub(r"\1\2", t)
    t = SPACED_HYPHEN.sub(r"\1-\2", t)
    parts = re.split(r"\n{2,}", t)
    out: list[str] = []
    for part in parts:
        lines = [normalize_muftyat_kk_text(line) for line in part.split("\n")]
        out.append("\n".join(lines))
    result = "\n\n".join(out)
    return re.sub(r"\n{3,}", "\n\n", result).strip()
