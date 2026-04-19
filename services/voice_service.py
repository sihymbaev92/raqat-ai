# -*- coding: utf-8 -*-
import re


LANGUAGE_ALIASES = {
    "kk": {
        "қазақша",
        "казахша",
        "казахский",
        "қазақ тілі",
        "казахский язык",
        "kazakh",
        "qazaqsha",
    },
    "ru": {
        "орысша",
        "русский",
        "русский язык",
        "на русском",
        "russian",
        "по русски",
    },
    "en": {
        "english",
        "английский",
        "english language",
        "ағылшынша",
        "inglish",
    },
    "ar": {
        "arabic",
        "арабша",
        "арабский",
        "العربية",
    },
    "tr": {"turkish", "түрікше", "турецкий", "türkçe"},
    "uz": {"uzbek", "өзбекше", "узбекский"},
    "ky": {"kyrgyz", "қырғызша", "кыргызча"},
    "tg": {"tajik", "тәжікше", "таджикский"},
    "az": {"azerbaijani", "әзербайжанша", "азербайджанский"},
    "zh": {"chinese", "қытайша", "китайский", "中文"},
    "ku": {"kurmanji", "курманджи", "kurmanci", "kurdish"},
    "ur": {"urdu", "урду", "урдуша"},
    "fa": {"persian", "парсыша", "персидский", "farsi"},
    "id": {"indonesian", "индонезийский", "индонезияша"},
    "ms": {"malay", "малайша", "малайский"},
}

VOICE_MODE_ON_ALIASES = {
    "voice on",
    "voice_on",
    "дауыс қос",
    "дауыс қосу",
    "дауысты қос",
    "озвучка қос",
    "дауыспен жауап бер",
    "дауыспен жауап қос",
    "голос включи",
    "включи голос",
    "включи озвучку",
    "voice reply on",
}

VOICE_MODE_OFF_ALIASES = {
    "voice off",
    "voice_off",
    "дауыс өшір",
    "дауысты өшір",
    "озвучка өшір",
    "дауыспен жауапты өшір",
    "дауыспен жауап өшір",
    "голос выключи",
    "выключи голос",
    "выключи озвучку",
    "voice reply off",
}

NEXT_AYAH_ALIASES = {
    "келесі аят",
    "следующий аят",
    "next ayah",
    "next verse",
}

PREV_AYAH_ALIASES = {
    "алдыңғы аят",
    "предыдущий аят",
    "previous ayah",
    "previous verse",
}

REPEAT_LAST_ALIASES = {
    "қайта оқы",
    "қайтадан",
    "тағы бір рет",
    "повтори",
    "repeat",
}

LANGUAGE_SWITCH_HINTS = {
    "тіл",
    "language",
    "lang",
    "язык",
    "ziman",
    "ауыс",
    "ауыстыр",
    "switch",
    "change",
    "переключ",
    "смени",
}

TRANSLATION_SWITCH_HINTS = {
    "аударма",
    "аударманы",
    "translation",
    "translate",
    "перевод",
    "перевода",
    "мағына",
}

VOICE_HELP_ALIASES = {
    "voice",
    "voice help",
    "voice control",
    "дауыс",
    "дауыс көмек",
    "дауыспен басқару",
    "голос",
    "голос помощь",
    "голосовое управление",
}

# Фраза ішінде кездессе жеткілікті (ASR ұзын сөйлем қайтаруы мүмкін)
VOICE_HELP_PHRASE_ALIASES = (
    "дауыспен басқару",
    "дауыс көмек",
    "дауыспен қалай",
    "голосовое управление",
    "голос помощь",
    "voice control",
    "voice help",
)

# Тану қатесі / транслит: «галал», «халаал» т.б.
HALAL_SECTION_ALIASES = (
    "халал",
    "halal",
    "галал",
    "халаал",
    "халяль",
    "halyal",
    "халал тексер",
    "halal check",
    "halal тексер",
    "өнім халал",
    "халал өнім",
)

GUIDE_ALIASES = {
    "guide",
    "help",
    "көмек",
    "нұсқаулық",
    "инструкция",
}

FEEDBACK_ALIASES = {
    "feedback",
    "пікір",
    "кері байланыс",
    "отзыв",
    "обратная связь",
}

TRANSLATION_MENU_ALIASES = {
    "аударма",
    "translation",
    "перевод",
}

TASBIH_PLUS_ALIASES = {
    "тәспі қос",
    "тасбих қос",
    "бір қос",
    "count one",
    "increment tasbih",
    "добавь тасбих",
}

TASBIH_RESET_ALIASES = {
    "тәспіні нөлде",
    "тәспі нөлде",
    "тасбих сброс",
    "reset tasbih",
}

TASBIH_33_ALIASES = {
    "тәспі 33",
    "тасбих 33",
    "33 режим",
}

TASBIH_99_ALIASES = {
    "тәспі 99",
    "тасбих 99",
    "99 режим",
}

NEXT_HADITH_ALIASES = {
    "келесі хадис",
    "next hadith",
    "следующий хадис",
}

FOLLOW_UI_TRANSLATION_ALIASES = {
    "аударманы интерфейспен бірге қыл",
    "аударма интерфейс тілімен бірге",
    "translation follow interface",
    "перевод как интерфейс",
}

PRAYER_SECTION_ALIASES = {
    "times": {"намаз уақыт", "уақыттар", "prayer times", "время намаза"},
    "purification": {"дәрет тәртібі", "дәрет 10", "дәрет қадам", "дәрет алу"},
    "wudu_rules": {"дәрет мәкрүһ", "дәрет әдеп", "дәрет бұзатын", "дәретсіз"},
    "salah_2rakat": {"екі рәкағат", "2 рәкағат", "екі ракаат", "two rakah"},
    "salah_duas": {"намаз дұғалары", "фатиха сүре", "қысқа сүре", "дұға намаз"},
    "visual_wudu": {"суретті дәрет", "дәрет сурет", "wudu picture", "омовение картинка"},
    "wudu_men": {"ер дәрет", "еркек дәрет", "мужское омовение"},
    "wudu_women": {"әйел дәрет", "женское омовение"},
    "conditions": {"намаз шарттары", "шарттар", "prayer conditions", "условия намаза"},
    "steps": {"намаз реті", "оқу реті", "how to pray", "порядок намаза"},
    "visual_salah": {"суретті намаз", "намаз сурет", "prayer picture", "намаз картинка"},
    "men": {"ер намазы", "ер кісі намазы", "мужской намаз"},
    "women": {"әйел намазы", "әйел кісі намазы", "женский намаз"},
    "types": {"намаз түрлері", "types of prayer", "виды намаза"},
    "fard": {"парыз намаз", "fard prayer", "фард намаз"},
    "wajib": {"уәжіп намаз", "wajib prayer", "ваджиб намаз"},
    "sunnah": {"сүннет намаз", "нәпіл намаз", "sunnah prayer", "суннат намаз"},
    "tahajjud": {"тәһажжуд", "tahajjud", "тахаджуд"},
    "witr": {"үтір", "витр", "witr"},
    "extra": {"қосымша намаз", "extra prayer", "дополнительный намаз"},
    "mistakes": {"сәһу сәжде", "қате намаз", "mistakes in prayer", "ошибки намаза"},
    "travel": {"сапар намазы", "қаза намаз", "travel prayer", "намаз в пути"},
    "jumuah": {"жұма намазы", "жаназа", "jumuah", "janazah", "джума", "джаназа"},
}

QURAN_SEARCH_SCOPE_ALIASES = {
    "құран",
    "құраннан",
    "құранда",
    "quran",
    "коран",
    "коране",
    "корана",
}

HADITH_SEARCH_SCOPE_ALIASES = {
    "хадис",
    "хадистен",
    "хадисте",
    "хадистерден",
    "hadith",
    "хадисах",
    "хадисы",
}

SEARCH_ACTION_ALIASES = {
    "ізде",
    "іздеп",
    "іздеу",
    "тап",
    "тапшы",
    "тауып",
    "find",
    "search",
    "lookup",
    "найди",
    "искать",
    "поиск",
}

SEARCH_FILLER_TOKENS = {
    "в",
    "во",
    "по",
    "из",
    "ішінен",
    "ішінде",
    "внутри",
    "from",
    "in",
}


def normalize_voice_text(text: str) -> str:
    lowered = (text or "").lower().replace("ё", "е").replace("-", " ")
    lowered = re.sub(r"[^\w\s:]+", " ", lowered, flags=re.UNICODE)
    return " ".join(lowered.split())


def extract_language_choice(text: str) -> str | None:
    normalized = normalize_voice_text(text)
    if not normalized:
        return None

    for code, aliases in LANGUAGE_ALIASES.items():
        if normalized in aliases:
            return code
        if any(alias in normalized for alias in aliases):
            return code
    return None


def is_language_switch_command(text: str) -> bool:
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    # «перевод на русский» / «аударма қазақша» — Құран/хадис аудармасы; UI тіліне ауыспау керек.
    if any(hint in normalized for hint in TRANSLATION_SWITCH_HINTS):
        return False
    if extract_language_choice(normalized) is None:
        return False

    tokens = normalized.split()
    return len(tokens) <= 4 or any(hint in normalized for hint in LANGUAGE_SWITCH_HINTS)


def is_translation_switch_command(text: str) -> bool:
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    if extract_language_choice(normalized) is None:
        return False
    return any(hint in normalized for hint in TRANSLATION_SWITCH_HINTS)


def _extract_scoped_search_query(text: str, scope_aliases: set[str]) -> str | None:
    normalized = normalize_voice_text(text)
    if not normalized:
        return None
    if not any(alias in normalized for alias in scope_aliases):
        return None
    if not any(alias in normalized for alias in SEARCH_ACTION_ALIASES):
        return None

    tokens = normalized.split()
    cleaned = [
        token
        for token in tokens
        if token not in scope_aliases
        and token not in SEARCH_ACTION_ALIASES
        and token not in SEARCH_FILLER_TOKENS
    ]
    query = " ".join(cleaned).strip()
    return query or None


def extract_quran_search_query(text: str) -> str | None:
    return _extract_scoped_search_query(text, QURAN_SEARCH_SCOPE_ALIASES)


def extract_hadith_search_query(text: str) -> str | None:
    return _extract_scoped_search_query(text, HADITH_SEARCH_SCOPE_ALIASES)


def extract_voice_mode_toggle(text: str) -> bool | None:
    normalized = normalize_voice_text(text)
    if any(alias in normalized for alias in VOICE_MODE_ON_ALIASES):
        return True
    if any(alias in normalized for alias in VOICE_MODE_OFF_ALIASES):
        return False
    return None


def is_next_ayah_command(text: str) -> bool:
    normalized = normalize_voice_text(text)
    return any(alias in normalized for alias in NEXT_AYAH_ALIASES)


def is_prev_ayah_command(text: str) -> bool:
    normalized = normalize_voice_text(text)
    return any(alias in normalized for alias in PREV_AYAH_ALIASES)


def is_repeat_last_command(text: str) -> bool:
    normalized = normalize_voice_text(text)
    return any(alias in normalized for alias in REPEAT_LAST_ALIASES)


def is_voice_help_request(text: str) -> bool:
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    if normalized in VOICE_HELP_ALIASES:
        return True
    if any(phrase in normalized for phrase in VOICE_HELP_PHRASE_ALIASES):
        return True
    tokens = set(normalized.split())
    if tokens & {"voice", "дауыс", "голос"} and (
        "көмек" in normalized
        or "help" in normalized
        or "помощ" in normalized
        or "басқару" in normalized
        or "управлен" in normalized
    ):
        return True
    return False


def is_halal_section_request(text: str) -> bool:
    """Дауыспен немесе мәтінмен халал бөлімін ашу (транскрипция қателерін ескереді)."""
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    return any(alias in normalized for alias in HALAL_SECTION_ALIASES)


def is_guide_request(text: str) -> bool:
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    return normalized in GUIDE_ALIASES


def is_feedback_request(text: str) -> bool:
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    return normalized in FEEDBACK_ALIASES


def is_translation_menu_request(text: str) -> bool:
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    return normalized in TRANSLATION_MENU_ALIASES


def wants_translation_follow_ui(text: str) -> bool:
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    return normalized in FOLLOW_UI_TRANSLATION_ALIASES


def extract_tasbih_action(text: str) -> str | None:
    normalized = normalize_voice_text(text)
    if not normalized:
        return None
    if normalized in TASBIH_PLUS_ALIASES:
        return "tasbih_plus"
    if normalized in TASBIH_RESET_ALIASES:
        return "tasbih_reset"
    if normalized in TASBIH_33_ALIASES:
        return "tasbih_goal_33"
    if normalized in TASBIH_99_ALIASES:
        return "tasbih_goal_99"
    return None


def is_next_hadith_command(text: str) -> bool:
    normalized = normalize_voice_text(text)
    if not normalized:
        return False
    return normalized in NEXT_HADITH_ALIASES


def match_prayer_section_command(text: str) -> str | None:
    normalized = normalize_voice_text(text)
    if not normalized:
        return None
    for section, aliases in PRAYER_SECTION_ALIASES.items():
        if any(alias in normalized for alias in aliases):
            return section
    return None
