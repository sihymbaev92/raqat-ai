"""Kazakh syllable labels aligned with harakat MP3 clips (mirror of tajweedHarakatTranslitKk.ts)."""
from __future__ import annotations

import unicodedata

HARAKAT_RE = r"[\u064B-\u0652\u0670]"
SYLLABLE_SEP = "·"

SYLLABLE_KK: dict[str, dict[str, str]] = {
    "ا": {"fatha": "а", "kesra": "и", "damma": "у", "saken": ""},
    "آ": {"fatha": "аа", "kesra": "аа", "damma": "аа", "saken": ""},
    "أ": {"fatha": "а", "kesra": "и", "damma": "у", "saken": ""},
    "إ": {"fatha": "и", "kesra": "и", "damma": "и", "saken": ""},
    "ء": {"fatha": "а", "kesra": "и", "damma": "у", "saken": ""},
    "ؤ": {"fatha": "у", "kesra": "уи", "damma": "у", "saken": "у"},
    "ئ": {"fatha": "йа", "kesra": "йи", "damma": "йу", "saken": "й"},
    "ب": {"fatha": "ба", "kesra": "би", "damma": "бу", "saken": "б"},
    "ت": {"fatha": "та", "kesra": "ти", "damma": "ту", "saken": "т"},
    "ث": {"fatha": "са", "kesra": "си", "damma": "су", "saken": "с"},
    "ج": {"fatha": "жа", "kesra": "жи", "damma": "жу", "saken": "ж"},
    "ح": {"fatha": "ха", "kesra": "хи", "damma": "ху", "saken": "х"},
    "خ": {"fatha": "ха", "kesra": "хи", "damma": "ху", "saken": "х"},
    "د": {"fatha": "да", "kesra": "ди", "damma": "ду", "saken": "д"},
    "ذ": {"fatha": "за", "kesra": "зи", "damma": "зу", "saken": "з"},
    "ر": {"fatha": "ра", "kesra": "ри", "damma": "ру", "saken": "р"},
    "ز": {"fatha": "за", "kesra": "зи", "damma": "зу", "saken": "з"},
    "س": {"fatha": "са", "kesra": "си", "damma": "су", "saken": "с"},
    "ش": {"fatha": "ша", "kesra": "ши", "damma": "шу", "saken": "ш"},
    "ص": {"fatha": "са", "kesra": "си", "damma": "су", "saken": "с"},
    "ض": {"fatha": "да", "kesra": "ди", "damma": "ду", "saken": "д"},
    "ط": {"fatha": "та", "kesra": "ти", "damma": "ту", "saken": "т"},
    "ظ": {"fatha": "за", "kesra": "зи", "damma": "зу", "saken": "з"},
    "ع": {"fatha": "‘а", "kesra": "‘и", "damma": "‘у", "saken": "‘"},
    "غ": {"fatha": "ға", "kesra": "ғи", "damma": "ғу", "saken": "ғ"},
    "ف": {"fatha": "фа", "kesra": "фи", "damma": "фу", "saken": "ф"},
    "ق": {"fatha": "қа", "kesra": "қи", "damma": "қу", "saken": "қ"},
    "ك": {"fatha": "ка", "kesra": "ки", "damma": "ку", "saken": "к"},
    "ل": {"fatha": "ла", "kesra": "ли", "damma": "лу", "saken": "л"},
    "م": {"fatha": "ма", "kesra": "ми", "damma": "му", "saken": "м"},
    "ن": {"fatha": "на", "kesra": "ни", "damma": "ну", "saken": "н"},
    "ه": {"fatha": "һа", "kesra": "һи", "damma": "һу", "saken": "һ"},
    "ة": {"fatha": "та", "kesra": "ти", "damma": "ту", "saken": "т"},
    "و": {"fatha": "уа", "kesra": "уи", "damma": "у", "saken": "у"},
    "ي": {"fatha": "йа", "kesra": "йи", "damma": "йу", "saken": "й"},
    "ى": {"fatha": "а", "kesra": "и", "damma": "у", "saken": ""},
}

VOWEL_CARRIERS = {"ا", "آ", "ٱ", "ى", "أ", "إ", "ء", "ؤ", "ئ"}
COMBINING = {chr(c) for c in range(0x64B, 0x660)} | {"\u0640", "\u0670"}
COMBINING.update(chr(c) for c in range(0x6D6, 0x6EE))


def segment_clusters(text: str) -> list[str]:
    text = unicodedata.normalize("NFC", (text or "").strip())
    out: list[str] = []
    i = 0
    while i < len(text):
        ch = text[i]
        if ch.isspace() or ch in "،,.":
            i += 1
            continue
        cluster = ch
        i += 1
        while i < len(text) and text[i] in COMBINING:
            cluster += text[i]
            i += 1
        out.append(cluster)
    return out


def harakat_kind(cluster: str) -> str:
    if "\u0652" in cluster:
        return "saken"
    if "\u064E" in cluster or "\u064B" in cluster:
        return "fatha"
    if "\u0650" in cluster or "\u064D" in cluster:
        return "kesra"
    if "\u064F" in cluster or "\u064C" in cluster:
        return "damma"
    if "\u0651" in cluster:
        return "fatha"
    return "fatha"


def has_harakat(arabic: str) -> bool:
    import re

    return bool(re.search(HARAKAT_RE, unicodedata.normalize("NFC", arabic or "")))


def syllable_label(cluster: str) -> str:
    base = cluster[0]
    kind = harakat_kind(cluster)
    row = SYLLABLE_KK.get(base)
    if row and kind in row:
        return row[kind]

    if base in VOWEL_CARRIERS:
        if base == "آ":
            return "аа"
        if base == "إ":
            return "и" if kind == "kesra" else "у" if kind == "damma" else "и"
        if kind == "fatha":
            return "а"
        if kind == "kesra":
            return "и"
        if kind == "damma":
            return "у"
        return ""
    return ""


def format_reading_kk(arabic: str, sep: str = SYLLABLE_SEP) -> str:
    if not has_harakat(arabic):
        return ""
    parts: list[str] = []
    for cluster in segment_clusters(arabic):
        label = syllable_label(cluster)
        parts.append(label)
        if "\u0651" in cluster:
            parts.append(label)
    return sep.join(parts)
