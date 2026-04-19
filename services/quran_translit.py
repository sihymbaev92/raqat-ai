# -*- coding: utf-8 -*-
import re
import unicodedata

BASE_MAP = {
    "ء": "'",
    "أ": "а",
    "إ": "и",
    "ؤ": "у",
    "ئ": "и",
    "ا": "а",
    "آ": "аа",
    "ٱ": "а",
    "ب": "б",
    "ة": "а",
    "ت": "т",
    "ث": "с",
    "ج": "ж",
    "ح": "х",
    "خ": "х",
    "د": "д",
    "ذ": "з",
    "ر": "р",
    "ز": "з",
    "س": "с",
    "ش": "ш",
    "ص": "с",
    "ض": "д",
    "ط": "т",
    "ظ": "з",
    "ع": "'",
    "غ": "ғ",
    "ف": "ф",
    "ق": "қ",
    "ك": "к",
    "ل": "л",
    "م": "м",
    "ن": "н",
    "ه": "һ",
    "و": "у",
    "ي": "й",
    "ى": "а",
    "پ": "п",
    "چ": "ч",
    "ژ": "ж",
    "گ": "г",
}

VOWEL_MAP = {
    "\u064e": "а",   # fatha
    "\u064f": "у",   # damma
    "\u0650": "и",   # kasra
    "\u064b": "ан",  # fathatan
    "\u064c": "ун",  # dammatan
    "\u064d": "ин",  # kasratan
    "\u0670": "а",   # superscript alif
}

IGNORED_MARKS = {"\u0652"}  # sukun
PUNCT_MAP = {
    "،": ",",
    "؛": ";",
    "؟": "?",
}
STOP_MARKS = {
    "ۖ", "ۗ", "ۘ", "ۙ", "ۚ", "ۛ", "ۜ", "۝", "۞",
    "\u06e9",  # ۩ Arabic place of sajdah — транскрипцияға енбейді
}
VOWEL_ENDINGS = ("а", "у", "и")
SUN_LETTERS = ("т", "с", "ш", "д", "з", "р", "н")
BASMALA_MARKLESS = "بسم الله الرحمن الرحيم"

# وَ / فَ + жиі жалғанулар (арабша бірге жазылған, оқуда бөлінеді). Ұзыннан қысқаға.
_GRAMMAR_WA_FA_PARTICLES = (
    ("уалақад", "үә лақад"),
    ("уалакинна", "үә лакинна"),
    ("уалакин", "үә лакин"),
    ("уалау", "үә лау"),
    ("уаинна", "үә инна"),
    ("уаиза", "үә иза"),
    ("уақул", "үә қул"),
    ("уама", "үә ма"),
    ("уала", "үә ла"),
    ("уақад", "үә қад"),
    ("уаби", "үә би"),
    ("уали", "үә ли"),
    ("уанна", "үә анна"),
    ("уаһуа", "үә һуа"),
    ("уаһум", "үә һум"),
    ("уаһунна", "үә һунна"),
    ("уаһи", "үә һи"),
    ("фаинна", "фа инна"),
    ("фаиза", "фа иза"),
    ("фалам", "фа лам"),
    ("фаман", "фа ман"),
    ("фама", "фа ма"),
    ("фала", "фа ла"),
)

# Уақф/паузада сөз соңындағы иъраб қосымшасын қысқарту (толық вокализациядағы артық а/и/у)
_PAUSAL_KEEP_WORDS = frozenset({"бисми", "мадина", "медина"})

# Түбірдегі «ина» жалғаны емес (иъраб емес) — жалпы «ина» ережесінен бөлек
_PAUSAL_EXACT_REPLACE = {
    "аһдина": "иһдин",  # اهدنا — соңғы ұзын дауыс паузада
    "ас-сирата": "ас-сират",
    "сирата": "сират",
}

# style="pedagogical" үшін 1-сүре эталоны (пайдаланушы үлгісі; қалған 6224 аятқа JSON импорт немесе әдепкі алгоритм + тыныс).
FATIHA_PEDAGOGICAL_PRESET: dict[int, str] = {
    1: "бисмил ляяһир рахмаанир рахииим",
    2: "аль хамдулил ляяһираббиль 'аалямииин",
    3: "ар рахмаанир рахииим",
    4: "мяялики иауумид дииин",
    5: "ииияякя на'буду ваии ияякя наста'ииин",
    6: "иһдинас сырааталь мустакыыим",
    7: "сыраатал лязиина ан'амта 'алаииһим гаиириль магдууби 'алаииһим ва ляд даааллииин",
}


def _apply_pausal_irab_trim(text: str) -> str:
    """Сөз соңындағы ғараб белгілерінен келетін артық дауысты дыбыстарды алып тастау."""
    if not text:
        return text

    def trim_word(w: str) -> str:
        if w in _PAUSAL_KEEP_WORDS or len(w) < 3:
            return w
        if w in _PAUSAL_EXACT_REPLACE:
            return _PAUSAL_EXACT_REPLACE[w]
        x = w
        for old, new in (
            ("ими", "им"),
            ("ани", "ан"),
            ("ини", "ин"),
            ("има", "им"),
            ("ину", "ин"),
            ("ина", "ин"),
            ("ики", "ик"),
        ):
            if len(x) > len(old) + 1 and x.endswith(old):
                x = x[: -len(old)] + new
                break
        if x.endswith("ми") and len(x) > 4 and x not in _PAUSAL_KEEP_WORDS:
            x = x[:-2] + "м"
        return x

    parts = re.split(r"(\s+)", text)
    out = []
    for p in parts:
        if p.isspace():
            out.append(p)
        else:
            out.append(trim_word(p))
    return "".join(out)


def _split_clusters(text: str):
    clusters = []
    base = ""
    marks = []

    for char in text:
        if char == "\ufeff":
            continue
        if char.isspace():
            if base:
                clusters.append((base, marks))
                base = ""
                marks = []
            clusters.append((char, []))
            continue
        if unicodedata.combining(char):
            if base:
                marks.append(char)
            continue
        if base:
            clusters.append((base, marks))
        base = char
        marks = []

    if base:
        clusters.append((base, marks))

    return clusters


def _repeat_if_shadda(core: str, has_shadda: bool) -> str:
    if not has_shadda or not core or core == "'":
        return core
    return core[0] + core


def _ends_with_vowel(parts) -> bool:
    if not parts:
        return False
    return parts[-1].endswith(VOWEL_ENDINGS)


def _transliterate_cluster(base: str, marks, parts) -> str:
    if base.isspace():
        return " "
    if base in PUNCT_MAP:
        return PUNCT_MAP[base]
    if base in STOP_MARKS or base == "ـ":
        return ""

    has_shadda = "\u0651" in marks
    has_sukun = "\u0652" in marks
    vowel = ""
    # Сукун (ْ) болған әріпте қысқа дауыс жоқ — тек сукуннан кейінгі белгілерді елемеу керек
    if not has_sukun:
        for mark in marks:
            if mark in VOWEL_MAP:
                vowel = VOWEL_MAP[mark]
                break
            if mark in IGNORED_MARKS:
                continue

    if base == "آ":
        return "аа"
    if base in {"ا", "ٱ", "ى"}:
        if vowel:
            return vowel
        return "а"
    if base == "و":
        if vowel:
            return _repeat_if_shadda("у", has_shadda) + vowel
        return "у"
    if base == "ي":
        if vowel:
            return _repeat_if_shadda("й", has_shadda) + vowel
        return "и" if _ends_with_vowel(parts) else "й"
    if base == "ة":
        return "а" if not vowel else "т" + vowel

    core = BASE_MAP.get(base)
    if core is None:
        return base

    piece = _repeat_if_shadda(core, has_shadda)
    return piece + vowel


def _transliterate_arabic_to_kazakh_default(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text or "")
    markless = "".join(
        char
        for char in normalized
        if not unicodedata.combining(char) and char not in STOP_MARKS and char != "ـ"
    )
    markless = re.sub(r"\s+", " ", markless).strip()
    if markless == BASMALA_MARKLESS:
        return "бисмилләһир-рахманир-рахим"

    parts = []

    for base, marks in _split_clusters(normalized):
        piece = _transliterate_cluster(base, marks, parts)
        if not piece:
            continue
        if piece == " " and (not parts or parts[-1] == " "):
            continue
        parts.append(piece)

    result = "".join(parts).strip()
    for letter in SUN_LETTERS:
        result = re.sub(
            rf"\bал{letter}{letter}",
            f"а{letter}-{letter}",
            result,
        )
    result = re.sub(r"([аеёиоуыіәөүұү])\1+", r"\1", result, flags=re.IGNORECASE)
    result = re.sub(r"ии(?=й)", "и", result)
    # Бір символ 3+ рет қайталанса 2-ге дейін (мысалы алллаһ → аллаһ, артық л/м)
    result = re.sub(r"(.)\1{2,}", r"\1\1", result)
    # Күн әріптерінен кейінгі ال (әл-қ, әл-м, әл-'…): күн әріптері бұрыннан а{т}-т… түрінде
    # «аллаһ», «аллазина» (алл…) және күн ережесімен «ад-д…», «ан-н…» т.б. тимейді
    _moon_after_al = ("ф", "қ", "к", "б", "ж", "х", "ғ", "м", "һ", "'", "у", "й")
    for _m in _moon_after_al:
        esc = re.escape(_m)
        result = re.sub(rf"\bбиал{esc}", f"би әл-{_m}", result)
        result = re.sub(rf"\bуал{esc}", f"уа әл-{_m}", result)
        result = re.sub(rf"(^|[\s،؛(])ал{esc}", rf"\1әл-{_m}", result)
    # بِاللَّهِ، لِلَّهِ، كَالَّذِي — «би/ли/ка» + «алл…»
    result = re.sub(r"\bбиалл", "би алл", result)
    result = re.sub(r"\bабиалл", "а би алл", result)
    result = re.sub(r"\bлилл", "ли алл", result)
    result = re.sub(r"\bкалл", "ка алл", result)
    # وَبِاللَّذِي، وَلِلَّهِ، فَبِاللَّهِ — уа/фа + би/ли + алл
    result = re.sub(r"\bуабиалл", "уа би алл", result)
    result = re.sub(r"\bфабиалл", "фа би алл", result)
    result = re.sub(r"\bуалилл", "уа ли алл", result)
    result = re.sub(r"\bфалилл", "фа ли алл", result)
    # لِلْمُ… لِلْقُ… — لِ + ال + ай күн әрпі
    for _m in _moon_after_al:
        esc = re.escape(_m)
        result = re.sub(rf"\bлил{esc}", f"ли әл-{_m}", result)
    for _src, _dst in _GRAMMAR_WA_FA_PARTICLES:
        result = re.sub(rf"\b{re.escape(_src)}\b", _dst, result)
    result = _apply_pausal_irab_trim(result)
    # فِى (ى) → «фиа» болып қосылмайды; паузадан кейін: وَمِنَ → уамин → үә мин
    result = re.sub(r"\bфиа\b", "фи", result)
    result = re.sub(r"\bуамин\b", "үә мин", result)
    result = re.sub(r"\s+([,;?.])", r"\1", result)
    result = re.sub(r"\s{2,}", " ", result)
    # Қалған араб әріптері (картаға енбеген белгілер) шығарылады
    result = re.sub(r"[\u0600-\u06FF\uFE70-\uFEFF]+", "", result)
    result = re.sub(r"\s{2,}", " ", result).strip()
    return result


def _pedagogical_spacing(text: str) -> str:
    """Тире мен қосарланған бос орындарды бір бос орынға жақындату (оқу үлгісіне қарай)."""
    if not text:
        return text
    s = text.replace("-", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def transliterate_arabic_to_kazakh(
    text: str,
    *,
    surah: int | None = None,
    ayah: int | None = None,
    style: str = "default",
) -> str:
    """
    style="pedagogical": 1-сүре 1–7 эталон; қалғаны — әдепкі транскрипция + тыныс жақындату.
    Толық 114 сүрені үлгімен бірдей ету үшін `scripts/import_quran_translit_json.py` арқылы JSON жүктеңіз.
    """
    st = (style or "default").strip().lower()
    if st == "pedagogical" and surah == 1 and ayah is not None:
        preset = FATIHA_PEDAGOGICAL_PRESET.get(int(ayah))
        if preset:
            return preset
    core = _transliterate_arabic_to_kazakh_default(text)
    if st == "pedagogical":
        return _pedagogical_spacing(core)
    return core
