# -*- coding: utf-8 -*-
from html import escape
from math import ceil
import logging
import re

from aiogram import types
from aiogram.exceptions import TelegramBadRequest
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from config.settings import DB_PATH, QURAN_TRANSLIT_STYLE, RAQAT_BOT_API_ONLY
from db.connection import db_conn
from db.dialect_sql import execute as _exec
from db.quran_repo import resolve_quran_text_choice
from services.audio_service import build_quran_audio_url, quran_audio_caption
from services.language_service import (
    _lang_db,
    content_language_name,
    get_language_name,
    get_user_content_lang,
    get_user_lang,
    tr,
    translation_notice,
)
from services.ops_service import log_event
from services.text_cleanup import clean_text_content
from services.quran_kk_provenance import get_quran_kk_attribution
from services.quran_progress import (
    ensure_progress_table,
    get_surah_ayah_count,
    get_user_khatm,
    get_user_khatm_meta,
    save_user_khatm,
    set_user_daily_goal,
)
from services.quran_translit import transliterate_arabic_to_kazakh
from services.platform_content_service import fetch_quran_search, fetch_quran_surah
from state.memory import USER_STATE

MESSAGE_LIMIT = 3500
SURA_PAGE_SIZE = 57
SHORT_SURAH_AUDIO_LIMIT = 20
logger = logging.getLogger("raqat_ai.quran")

SURA_NAMES = [
    "1. Фатиха", "2. Бақара", "3. Имран", "4. Ниса", "5. Маида",
    "6. Анам", "7. Ағраф", "8. Әнфал", "9. Тәубе", "10. Юнус",
    "11. Худ", "12. Юсуф", "13. Рағд", "14. Ибраһим", "15. Хижр",
    "16. Нахл", "17. Исра", "18. Кәһф", "19. Мәриям", "20. Та-Ха",
    "21. Әнбия", "22. Хаж", "23. Мүминун", "24. Нұр", "25. Фурқан",
    "26. Шуара", "27. Нәмл", "28. Қасас", "29. Анкабут", "30. Рум",
    "31. Лұқман", "32. Сәжде", "33. Ахзаб", "34. Сәбә", "35. Фатыр",
    "36. Ясин", "37. Саффат", "38. Сад", "39. Зумар", "40. Ғафир",
    "41. Фуссилат", "42. Шура", "43. Зухруф", "44. Духан", "45. Жасия",
    "46. Ахқаф", "47. Мұхаммед", "48. Фатх", "49. Хужурат", "50. Қаф",
    "51. Зарият", "52. Тур", "53. Нәжм", "54. Қамар", "55. Рахман",
    "56. Уақиға", "57. Хадид", "58. Мүжәдәлә", "59. Хашр", "60. Мүмтахина",
    "61. Сафф", "62. Жұма", "63. Мунафикун", "64. Тағабун", "65. Талақ",
    "66. Тахрим", "67. Мүлк", "68. Қалам", "69. Хаққа", "70. Мағариж",
    "71. Нұх", "72. Жин", "73. Мүзәмміл", "74. Мүддәссир", "75. Қияма",
    "76. Инсан", "77. Мурсалат", "78. Нәбә", "79. Назиғат", "80. Абаса",
    "81. Тәкуир", "82. Инфитар", "83. Мутаффифин", "84. Иншиқақ", "85. Буруж",
    "86. Тариқ", "87. Ағлә", "88. Ғашия", "89. Фәжр", "90. Балад",
    "91. Шәмс", "92. Ләйл", "93. Духа", "94. Шарх", "95. Тин",
    "96. Алақ", "97. Қадр", "98. Бәййина", "99. Зілзәлә", "100. Адият",
    "101. Қариа", "102. Такәсур", "103. Аср", "104. Хумаза", "105. Фил",
    "106. Құрайш", "107. Мағун", "108. Кәусар", "109. Кафирун", "110. Наср",
    "111. Масад", "112. Ихлас", "113. Фәләқ", "114. Нас",
]

SURAH_EXTRA_ALIASES = {
    1: ("fatiha", "фатиха", "әл фатиха", "al fatiha"),
    2: ("bakara", "бакара", "al baqarah"),
    18: ("kahf", "кахф", "кехф"),
    36: ("yasin", "ясин"),
    55: ("rahman", "рахман"),
    67: ("mulk", "мулк", "мүлк"),
    112: ("ikhlas", "ихлас", "ықылас"),
    113: ("falaq", "фаляк", "фалак"),
    114: ("nas", "ән нас", "ан нас"),
}

BEGINNER_SURAHS = (1, 112, 113, 114)

TAJWID_RULES = {
    "noon": {
        "label": "🔤 Нүн/тәнуин",
        "pattern": re.compile(r"ن[ْۡ]|[ًٌٍ]"),
    },
    "madd": {
        "label": "📏 Мәдд",
        "pattern": re.compile(r"[اوي]"),
    },
    "qalqala": {
        "label": "✨ Қалқала",
        "pattern": re.compile(r"[قطبجد](?:[ْۡ]|$)"),
    },
    "heavy": {
        "label": "🪶 Жуан әріп",
        "pattern": re.compile(r"[خصضغطقظ]"),
    },
}

ARABIC_LETTER_LESSONS = {
    "letters1": {
        "title": "1-топ: ا ب ت ث",
        "focus": "Пішіні ұқсас, нүктесімен ажыратылатын ең жеңіл әріптер.",
        "letters": (
            ("ا", "әлиф", "көбіне созылыңқы а"),
            ("ب", "бә", "б дыбысы"),
            ("ت", "тә", "т дыбысы"),
            ("ث", "сә", "тіл ұшымен жұмсақ с"),
        ),
        "practice": ("با = ба", "بو = бу", "بي = би", "تَ = та", "ثَ = са"),
        "tip": "Алдымен нүкте санын жаттаңыз: ب(1), ت(2), ث(3).",
    },
    "letters2": {
        "title": "2-топ: ج ح خ د ذ ر ز",
        "focus": "Тамақтан шығатын және қысқа айтылатын дыбыстар.",
        "letters": (
            ("ج", "жим", "ж дыбысына жақын"),
            ("ح", "ха", "терең, жұмсақ х"),
            ("خ", "ха", "қырналған х"),
            ("د", "дал", "д дыбысы"),
            ("ذ", "зәл", "тіл ұшымен жұмсақ з"),
            ("ر", "ра", "р дыбысы"),
            ("ز", "зай", "з дыбысы"),
        ),
        "practice": ("جا = жа", "حُ = ху", "خِ = хи", "رَ = ра", "زُ = зу"),
        "tip": "ح мен خ әріптерін шатастырмаңыз: خ дыбысы қатаңырақ естіледі.",
    },
    "letters3": {
        "title": "3-топ: س ش ص ض ط ظ",
        "focus": "Жіңішке және жуан әріптерді айыруға арналған топ.",
        "letters": (
            ("س", "син", "жіңішке с"),
            ("ش", "шин", "ш дыбысы"),
            ("ص", "сад", "жуан с"),
            ("ض", "дад", "жуан д"),
            ("ط", "та", "жуан т"),
            ("ظ", "за", "жуан з"),
        ),
        "practice": ("سَ = са", "شُ = шу", "صَ = са", "طُ = ту", "ظِ = зы"),
        "tip": "ص ض ط ظ дыбыстарын ауызды кеңірек ашып, жуандау айтыңыз.",
    },
    "letters4": {
        "title": "4-топ: ع غ ف ق ك ل م ن هـ و ي",
        "focus": "Құранда өте жиі кездесетін негізгі әріптер.",
        "letters": (
            ("ع", "ғайн/айн", "тамақ түбінен шығатын дыбыс"),
            ("غ", "ғайн", "ғ дыбысына жақын"),
            ("ف", "фа", "ф дыбысы"),
            ("ق", "қаф", "жуан қ"),
            ("ك", "кәф", "к дыбысы"),
            ("ل", "ләм", "л дыбысы"),
            ("م", "мим", "м дыбысы"),
            ("ن", "нун", "н дыбысы"),
            ("هـ", "һә", "һ дыбысы"),
            ("و", "уау", "у немесе созылу"),
            ("ي", "йә", "й/и дыбысы"),
        ),
        "practice": ("فا = фа", "قُ = қу", "لِ = ли", "مَ = ма", "نُوْر = нур"),
        "tip": "و мен ي кейде дауыссыз, кейде созылу әрпі болып оқылады.",
    },
}


def _safe(text: str) -> str:
    return escape(clean_text_content(text), quote=False)


def _highlight_first_rule_match(text: str, rule_key: str) -> str | None:
    rule = TAJWID_RULES.get(rule_key)
    if not rule:
        return None

    escaped = _safe(text)
    match = rule["pattern"].search(escaped)
    if not match:
        return None

    return (
        escaped[: match.start()]
        + "<b>"
        + escaped[match.start() : match.end()]
        + "</b>"
        + escaped[match.end() :]
    )


def _arabic_lesson_text(topic: str) -> str:
    lesson = ARABIC_LETTER_LESSONS.get(topic)
    if not lesson:
        return ""

    parts = [
        f"🔤 <b>{lesson['title']}</b>",
        lesson["focus"],
        "",
        "<b>Әріптер:</b>",
    ]
    for char, name, sound in lesson["letters"]:
        parts.append(f"{char} — <b>{name}</b> — {sound}")

    parts.extend(
        [
            "",
            "<b>Жаттығу:</b>",
            " · ".join(lesson["practice"]),
            "",
            f"💡 {lesson['tip']}",
        ]
    )
    return "\n".join(parts)


def _normalize_text(text: str) -> str:
    lowered = (text or "").lower().replace("ё", "е")
    lowered = lowered.replace("-", " ")
    lowered = re.sub(r"[^\w\s:]+", " ", lowered, flags=re.UNICODE)
    return " ".join(lowered.split())


def _display_surah_title(surah_id: int) -> str:
    return SURA_NAMES[surah_id - 1]


def _menu_page_for_surah(surah_id: int) -> int:
    return max(0, (surah_id - 1) // SURA_PAGE_SIZE)


def _goal_label(current: int, candidate: int) -> str:
    marker = "●" if current == candidate else "○"
    return f"{marker} {candidate} аят"


def _surah_aliases(surah_id: int) -> set[str]:
    title = _display_surah_title(surah_id).split(". ", 1)[-1]
    aliases = {_normalize_text(title), _normalize_text(title).replace(" ", "")}
    for alias in SURAH_EXTRA_ALIASES.get(surah_id, ()):
        aliases.add(_normalize_text(alias))
        aliases.add(_normalize_text(alias).replace(" ", ""))
    return {alias for alias in aliases if alias}


def match_surah_from_text(text: str) -> int | None:
    normalized = _normalize_text(text)

    for raw in re.findall(r"\b\d{1,3}\b", normalized):
        number = int(raw)
        if 1 <= number <= 114:
            return number

    compact = normalized.replace(" ", "")
    for surah_id in range(1, len(SURA_NAMES) + 1):
        for alias in _surah_aliases(surah_id):
            if alias in normalized or alias.replace(" ", "") in compact:
                return surah_id
    return None


def _extract_reference(text: str) -> tuple[int, int] | None:
    raw = (text or "").strip()
    match = re.search(r"(\d{1,3})\s*[:./ -]\s*(\d{1,3})", raw)
    if match:
        surah = int(match.group(1))
        ayah = int(match.group(2))
        if 1 <= surah <= 114 and ayah >= 1:
            return surah, ayah

    surah = match_surah_from_text(raw)
    if surah is None:
        return None

    numbers = [int(value) for value in re.findall(r"\d{1,3}", raw)]
    ayah = 1
    if numbers:
        ayah = numbers[-1]
        if ayah == surah and len(numbers) == 1:
            ayah = 1
    return surah, ayah


def _quran_progress_stats() -> tuple[int, int]:
    return _quran_progress_stats_for_column("text_kk")


def _quran_progress_stats_for_column(column: str | None) -> tuple[int, int]:
    with db_conn(DB_PATH) as conn:
        if not column:
            row = conn.execute(
                """
                SELECT COUNT(*) AS total
                FROM quran
                """
            ).fetchone()
            return 0, int(row["total"] or 0)
        row = conn.execute(
            f"""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN TRIM(COALESCE({column}, '')) <> '' THEN 1 ELSE 0 END) AS translated
            FROM quran
            """
        ).fetchone()
    return int(row["translated"] or 0), int(row["total"] or 0)


def _tajwid_example_lines(rows, rule_keys: list[str]) -> list[str]:
    examples = []
    for rule_key in rule_keys:
        rule = TAJWID_RULES.get(rule_key)
        if not rule:
            continue
        for row in rows:
            highlighted = _highlight_first_rule_match(row["text_ar"] or "", rule_key)
            if highlighted:
                examples.append(
                    f"{rule['label']} · <b>{row['surah']}:{row['ayah']}</b>\n{highlighted}"
                )
                break
    return examples


def _load_tajwid_rows(surah_id: int | None = None):
    with db_conn(DB_PATH) as conn:
        if surah_id is None:
            return conn.execute(
                """
                SELECT surah, ayah, text_ar
                FROM quran
                WHERE COALESCE(text_ar, '') <> ''
                ORDER BY surah, ayah
                LIMIT 500
                """
            ).fetchall()
        return conn.execute(
            """
            SELECT surah, ayah, text_ar
            FROM quran
            WHERE surah = ? AND COALESCE(text_ar, '') <> ''
            ORDER BY ayah
            """,
            (surah_id,),
        ).fetchall()


def _tajwid_examples_block(topic: str, surah_id: int | None = None) -> str:
    topic_map = {
        "noon": ["noon"],
        "madd": ["madd"],
        "qalqala": ["qalqala"],
        "heavy": ["heavy"],
        "menu": ["noon", "madd", "qalqala", "heavy"],
        "practice": ["noon", "madd", "qalqala", "heavy"],
    }
    rule_keys = topic_map.get(topic, [])
    if not rule_keys:
        return ""

    rows = _load_tajwid_rows(surah_id=surah_id)
    lines = _tajwid_example_lines(rows, rule_keys)
    if not lines:
        return ""

    return (
        "🎨 <b>Аят ішіндегі белгі</b>\n"
        "Telegram-де түс жоқ, сондықтан бот қалыңмен белгіледі.\n\n"
        + "\n\n".join(lines[:4])
    )


def _surah_tajwid_map_text(surah_id: int) -> str:
    title = _display_surah_title(surah_id)
    block = _tajwid_examples_block("menu", surah_id=surah_id)
    if not block:
        block = "Бұл сүреден автоматты тәжуид үлгілері табылмады."
    return (
        f"🎨 <b>{_safe(title)} — тәжуид картасы</b>\n\n"
        "Оқу кезінде назар аударатын жерлер төменде берілді.\n\n"
        f"{block}"
    )


def _surah_tajwid_map_markup(surah_id: int, menu_page: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🎧 Аудио",
                    callback_data=f"quranaudio:open:{surah_id}:{menu_page}",
                ),
                InlineKeyboardButton(
                    text="⬅️ Сүреге қайту",
                    callback_data=f"surah_{surah_id}_{menu_page}",
                ),
            ],
            [
                InlineKeyboardButton(text="🎓 Тәжуид", callback_data="tajwid:menu"),
            ],
        ]
    )


def _total_pages() -> int:
    return ceil(len(SURA_NAMES) / SURA_PAGE_SIZE)


def _quran_page_text(page: int, user_id: int | None = None) -> str:
    lang = get_user_lang(user_id, default="kk") if user_id else "kk"
    content_lang = get_user_content_lang(user_id, default=lang) if user_id else lang
    choice = resolve_quran_text_choice(content_lang)
    start = page * SURA_PAGE_SIZE + 1
    end = min((page + 1) * SURA_PAGE_SIZE, len(SURA_NAMES))
    translated, total = _quran_progress_stats_for_column(choice["actual"])
    notice = translation_notice(lang, choice["actual"], requested_lang=content_lang)
    label = (
        content_language_name(choice["actual"], lang)
        if choice["actual"]
        else "Таңдалған" if lang == "kk" else "Выбранный" if lang == "ru" else "Selected"
    )

    if lang == "ru":
        parts = [
            "📖 <b>Коран — 114 сур</b>",
            (
                f"Страница: <b>{page + 1}/{_total_pages()}</b> · суры "
                f"<b>{start}–{end}</b> (всего <b>{len(SURA_NAMES)}</b>)"
            ),
            f"Перевод ({label}): <b>{translated}/{total}</b>",
            tr("translation_current", lang, language=get_language_name(content_lang)),
            "Этот раздел предназначен для чтения: открыть суру, посмотреть полный текст, послушать аудио и найти аят.",
            "Порядок показа: <b>арабский текст</b> → <b>смысл на выбранном языке</b>.",
            "Таджвид и хатм вынесены в отдельные разделы главного меню.",
        ]
    elif lang == "kk":
        parts = [
            "📖 <b>Құран — 114 сүре</b>",
            (
                f"Бет: <b>{page + 1}/{_total_pages()}</b> · сүрелер "
                f"<b>{start}–{end}</b> (барлығы <b>{len(SURA_NAMES)}</b>)"
            ),
            f"{label} аударма: <b>{translated}/{total}</b>",
            tr("translation_current", lang, language=get_language_name(content_lang)),
            "Бұл бөлім тек оқуға арналған: сүрені ашу, толық мәтінді көру, аудио тыңдау, аят іздеу.",
            "Көрсету реті: <b>толық арабша мәтін</b> → <b>толық транскрипция</b> → <b>қазақша мағына</b>.",
            "Тәжуид пен хатым негізгі мәзірде бөлек бөлім болып тұр.",
        ]
    else:
        parts = [
            "📖 <b>Quran — 114 Surahs</b>",
            (
                f"Page: <b>{page + 1}/{_total_pages()}</b> · surahs "
                f"<b>{start}–{end}</b> (total <b>{len(SURA_NAMES)}</b>)"
            ),
            f"Translation ({label}): <b>{translated}/{total}</b>",
            tr("translation_current", lang, language=get_language_name(content_lang)),
            "This section is for reading: open a surah, view the full text, listen to audio, and search ayahs.",
            "View order: <b>Arabic text</b> → <b>meaning in the selected language</b>.",
            "Tajwid and khatm are separate sections in the main menu.",
        ]
    if notice:
        parts.append(notice)

    if lang == "ru":
        parts.append(
            "🎙 <b>Можно и голосом:</b> скажите <i>\"Коран\", \"Фатиха\", \"Ясин аудио\"</i>."
        )
    elif lang == "kk":
        parts.append(
            "🎙 <b>Дауыспен де болады:</b> <i>\"Құран\", \"Фатиха\", \"Ясин аудио\"</i> деп айта аласыз."
        )
    else:
        parts.append(
            "🎙 <b>Voice also works:</b> you can say <i>\"Quran\", \"Fatiha\", \"Yasin audio\"</i>."
        )
    parts.append(
        "🌐 <b>Аударманы ауыстыру:</b> <code>/translate</code>"
        if lang == "kk"
        else "🌐 <b>Change translation:</b> <code>/translate</code>"
        if lang == "en"
        else "🌐 <b>Сменить перевод:</b> <code>/translate</code>"
    )
    return "\n\n".join(parts)


def _quran_page_markup(page: int, user_id: int | None = None) -> InlineKeyboardMarkup:
    page = max(0, min(page, _total_pages() - 1))
    lang = get_user_lang(user_id, default="kk") if user_id else "kk"
    start = page * SURA_PAGE_SIZE
    end = min(start + SURA_PAGE_SIZE, len(SURA_NAMES))

    keyboard = []
    row = []
    for index in range(start, end):
        row.append(
            InlineKeyboardButton(
                text=SURA_NAMES[index],
                callback_data=f"surah_{index + 1}_{page}",
            )
        )
        if len(row) == 2:
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)

    keyboard.append(
        [
            InlineKeyboardButton(
                text="🔎 Аят іздеу" if lang == "kk" else "🔎 Поиск аята" if lang == "ru" else "🔎 Search Ayah",
                callback_data="quran_search",
            ),
            InlineKeyboardButton(
                text="🌐 Аударма" if lang == "kk" else "🌐 Перевод" if lang == "ru" else "🌐 Translation",
                callback_data="translate:open",
            ),
        ]
    )

    nav = []
    if page > 0:
        nav.append(
            InlineKeyboardButton(
                text="⬅️ Алдыңғы" if lang == "kk" else "⬅️ Назад" if lang == "ru" else "⬅️ Previous",
                callback_data=f"quran_page_{page - 1}",
            )
        )
    nav.append(
        InlineKeyboardButton(
            text=f"{page + 1}/{_total_pages()}",
            callback_data=f"quran_page_{page}",
        )
    )
    if page < _total_pages() - 1:
        nav.append(
            InlineKeyboardButton(
                text="Келесі ➡️" if lang == "kk" else "Далее ➡️" if lang == "ru" else "Next ➡️",
                callback_data=f"quran_page_{page + 1}",
            )
        )
    keyboard.append(nav)
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def _section_lines(rows, kind: str, translation_column: str | None) -> list[str]:
    lines = []
    for row in rows:
        ayah = row["ayah"]
        ar = _safe(row["text_ar"] or "")
        tr = _safe(row["translit"] or "")
        translated = _safe((row[translation_column] or "") if translation_column and translation_column in row.keys() else "")

        if kind == "tr" and ar and QURAN_TRANSLIT_STYLE == "pedagogical":
            surah = int(row["surah"]) if "surah" in row.keys() and row["surah"] is not None else None
            tr = _safe(
                transliterate_arabic_to_kazakh(
                    row["text_ar"] or "",
                    surah=surah,
                    ayah=int(ayah),
                    style="pedagogical",
                )
            )
        elif not tr and ar:
            tr = _safe(transliterate_arabic_to_kazakh(row["text_ar"] or ""))

        if kind == "ar":
            value = ar or "—"
        elif kind == "tr":
            value = tr or "—"
        else:
            value = translated or "<i>(translation missing)</i>"
        lines.append(f"{ayah}) {value}")
    return lines


def _append_section(
    chunks: list[str],
    current: str,
    surah_title: str,
    section_title: str,
    lines: list[str],
    lang: str,
) -> str:
    if not lines:
        return current

    continuation_suffix = "(жалғасы)" if lang == "kk" else "(продолжение)" if lang == "ru" else "(continued)"
    continuation_header = f"📖 <b>{_safe(surah_title)}</b> {continuation_suffix}\n\n"
    section_header = f"{section_title}\n"

    if len(current) + len(section_header) > MESSAGE_LIMIT and current.strip():
        chunks.append(current.rstrip())
        current = continuation_header

    current += section_header
    for line in lines:
        piece = f"{line} "
        if len(current) + len(piece) > MESSAGE_LIMIT and current.strip():
            chunks.append(current.rstrip())
            current = continuation_header + section_header
        current += piece
    return current + "\n\n"


def _build_surah_chunks(
    title: str,
    rows,
    translation_column: str | None,
    translation_label: str,
    lang: str,
) -> list[str]:
    translated_count = 0
    if translation_column:
        translated_count = sum(
            1 for row in rows if ((row[translation_column] or "").strip() if translation_column in row.keys() else "")
        )
    chunks = []

    header = f"📖 <b>{_safe(title)}</b>\n\n"
    if lang == "kk":
        att_kk, att_det = get_quran_kk_attribution(DB_PATH)
        if att_kk:
            header += f"📗 <b>Мағына дереккөзі:</b> {_safe(att_kk)}\n"
            if att_det:
                header += f"<i>{_safe(att_det)}</i>\n"
            header += "\n"
        else:
            header += (
                "ℹ️ Тексерілген баспа аудармасын (мысалы Ерлан Алимулы) "
                "<code>scripts/import_quran_kk_verified.py</code> арқылы қосыңыз.\n\n"
            )
        header += (
            "Көрсету реті: <b>толық арабша</b> → <b>толық транскрипция</b> → "
            "<b>қазақша мағына</b>.\n"
            "Күрделі болып көрінсе, <code>/translation</code> арқылы орыс немесе ағылшын контент "
            "тілін қосып көріңіз. Терең тәпсір үшін кітап пен ұстазға жүгінуге болады.\n\n"
        )
    elif lang == "ru":
        header += (
            "Порядок показа: <b>полный арабский текст</b> → "
            "<b>смысл на выбранном языке</b>.\n\n"
        )
    else:
        header += (
            "View order: <b>Arabic text</b> → <b>selected language meaning</b>.\n\n"
        )
    if translation_column and translation_column != "text_ar":
        if lang == "kk":
            header += f"{translation_label} аударма: <b>{translated_count}/{len(rows)}</b>\n"
        elif lang == "ru":
            header += f"Перевод ({translation_label}): <b>{translated_count}/{len(rows)}</b>\n"
        else:
            header += f"{translation_label} translation: <b>{translated_count}/{len(rows)}</b>\n"
    header += "\n"
    notice = translation_notice(lang, translation_column)
    if notice:
        header += notice + "\n\n"
    if translation_column and translated_count < len(rows):
        if lang == "kk":
            header += "ℹ️ Бұл сүре таңдалған тілге әлі толық аударылып болған жоқ.\n\n"
        elif lang == "ru":
            header += "ℹ️ Эта сура еще не полностью переведена на выбранный язык.\n\n"
        else:
            header += "ℹ️ This surah is not fully translated in the selected language yet.\n\n"

    current = header
    current = _append_section(
        chunks,
        current,
        title,
        "🇸🇦 <b>Арабша толық мәтін</b>" if lang == "kk" else "🇸🇦 <b>Полный арабский текст</b>" if lang == "ru" else "🇸🇦 <b>Full Arabic Text</b>",
        _section_lines(rows, "ar", translation_column),
        lang,
    )
    if lang == "kk":
        current = _append_section(
            chunks,
            current,
            title,
            "🔤 <b>Транскрипция</b>",
            _section_lines(rows, "tr", translation_column),
            lang,
        )
    if translation_column and translation_column != "text_ar":
        current = _append_section(
            chunks,
            current,
            title,
            f"🌐 <b>{translation_label} — түсінікті мағына</b>"
            if lang == "kk"
            else f"🌐 <b>Смысл ({translation_label})</b>"
            if lang == "ru"
            else f"🌐 <b>{translation_label} meaning</b>",
            _section_lines(rows, "kk", translation_column),
            lang,
        )

    if current.strip():
        chunks.append(current.rstrip())
    return chunks


def _surah_chunk_markup(
    surah_id: int,
    chunk_index: int,
    total_chunks: int,
    menu_page: int,
    user_id: int | None = None,
) -> InlineKeyboardMarkup:
    lang = get_user_lang(user_id, default="kk") if user_id else "kk"
    keyboard = []
    nav = []
    ayah_total = get_surah_ayah_count(surah_id)
    if ayah_total and ayah_total <= SHORT_SURAH_AUDIO_LIMIT:
        audio_label = (
            "🎧 Толық сүре аудио"
            if lang == "kk"
            else "🎧 Полное аудио суры"
            if lang == "ru"
            else "🎧 Full Surah Audio"
        )
    else:
        audio_label = (
            "🎧 Аят-аят аудио"
            if lang == "kk"
            else "🎧 Аудио по аятам"
            if lang == "ru"
            else "🎧 Ayah-by-Ayah Audio"
        )

    if chunk_index > 0:
        nav.append(
            InlineKeyboardButton(
                text="⬅️ Алдыңғы бет" if lang == "kk" else "⬅️ Назад" if lang == "ru" else "⬅️ Previous",
                callback_data=f"surahpage_{surah_id}_{chunk_index - 1}_{menu_page}",
            )
        )
    nav.append(
        InlineKeyboardButton(
            text=f"{chunk_index + 1}/{total_chunks}",
            callback_data=f"surahpage_{surah_id}_{chunk_index}_{menu_page}",
        )
    )
    if chunk_index < total_chunks - 1:
        nav.append(
            InlineKeyboardButton(
                text="Келесі бет ➡️" if lang == "kk" else "Далее ➡️" if lang == "ru" else "Next ➡️",
                callback_data=f"surahpage_{surah_id}_{chunk_index + 1}_{menu_page}",
            )
        )
    keyboard.append(nav)

    keyboard.append(
        [
            InlineKeyboardButton(text=audio_label, callback_data=f"quranaudio:open:{surah_id}:{menu_page}"),
        ]
    )
    keyboard.append(
        [
            InlineKeyboardButton(
                text="🔎 Аят іздеу" if lang == "kk" else "🔎 Поиск аята" if lang == "ru" else "🔎 Search Ayah",
                callback_data="quran_search",
            ),
            InlineKeyboardButton(
                text="⬅️ Сүрелерге қайту"
                if lang == "kk"
                else "⬅️ К списку сур"
                if lang == "ru"
                else "⬅️ Back to Surahs",
                callback_data=f"quran_page_{menu_page}",
            ),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def _get_surah_chunks(surah_id: int, user_id: int | None = None) -> tuple[list[str], str | None]:
    lang = get_user_lang(user_id, default="kk") if user_id else "kk"
    content_lang = get_user_content_lang(user_id, default=lang) if user_id else lang
    choice = resolve_quran_text_choice(content_lang)
    translation_column = choice["actual"]

    if RAQAT_BOT_API_ONLY:
        api_rows, api_error = fetch_quran_surah(surah_id)
        if api_error:
            return [], api_error
        rows = []
        for r in api_rows:
            row = {
                "surah": r.get("surah"),
                "ayah": r.get("ayah"),
                "text_ar": r.get("text_ar"),
                "translit": r.get("translit"),
            }
            if translation_column and translation_column != "text_ar":
                row[translation_column] = r.get(translation_column)
            rows.append(row)
    else:
        with db_conn(DB_PATH) as conn:
            select_cols = ["surah", "ayah", "text_ar", "translit"]
            if translation_column and translation_column != "text_ar":
                select_cols.append(translation_column)
            rows = conn.execute(
                f"""
                SELECT {", ".join(select_cols)}
                FROM quran
                WHERE surah = ?
                ORDER BY ayah
                """,
                (surah_id,),
            ).fetchall()

    if not rows:
        return [], "not_found"

    return _build_surah_chunks(
        _display_surah_title(surah_id),
        rows,
        translation_column,
        content_language_name(translation_column, lang),
        lang,
    ), None


def _excerpt(text: str, query: str, width: int = 220) -> str:
    cleaned = " ".join((text or "").split())
    if len(cleaned) <= width:
        return cleaned

    lower = cleaned.lower()
    pos = lower.find((query or "").lower())
    if pos < 0:
        return cleaned[:width].rstrip() + "..."

    start = max(0, pos - width // 3)
    end = min(len(cleaned), pos + len(query) + (width // 2))
    snippet = cleaned[start:end].strip()
    if start > 0:
        snippet = "..." + snippet
    if end < len(cleaned):
        snippet += "..."
    return snippet


def _search_quran_rows(query: str, lang: str, content_lang: str):
    if RAQAT_BOT_API_ONLY:
        rows = fetch_quran_search(
            query,
            lang=content_lang,
            include_translit=(lang == "kk"),
            limit=5,
        )
        if rows is None:
            return [], True
        return rows, False

    token = f"%{(query or '').strip()}%"
    choice = resolve_quran_text_choice(content_lang)
    translation_column = choice["actual"]
    where_parts = ["COALESCE(text_ar, '') LIKE ?"]
    params = [token]
    select_cols = ["surah", "ayah", "text_ar"]

    if translation_column and translation_column != "text_ar":
        where_parts.insert(0, f"COALESCE({translation_column}, '') LIKE ?")
        params.insert(0, token)
        select_cols.append(f"{translation_column} AS text_tr")

    if lang == "kk":
        where_parts.append("COALESCE(translit, '') LIKE ?")
        params.append(token)
        select_cols.append("translit")

    with _lang_db() as conn:
        rows = _exec(
            conn,
            f"""
            SELECT {", ".join(select_cols)}
            FROM quran
            WHERE {" OR ".join(where_parts)}
            ORDER BY surah, ayah
            LIMIT 5
            """,
            tuple(params),
        ).fetchall()
    return rows, False


def _api_unavailable_text(lang: str) -> str:
    if lang == "kk":
        return "⚠️ Құран контент API уақытша қолжетімсіз. Сәл кейін қайта көріңіз."
    if lang == "ru":
        return "⚠️ Контент API Корана временно недоступен. Попробуйте позже."
    return "⚠️ Quran content API is temporarily unavailable. Please try again later."


def _format_search_results(query: str, rows, lang: str) -> str:
    if lang == "kk":
        parts = [f"🔎 <b>Құраннан іздеу</b>: {_safe(query)}"]
    elif lang == "ru":
        parts = [f"🔎 <b>Поиск по Корану</b>: {_safe(query)}"]
    else:
        parts = [f"🔎 <b>Quran Search</b>: {_safe(query)}"]
    if not rows:
        parts.append(tr("no_results", lang))
        return "\n\n".join(parts)

    for row in rows:
        reference = f"{row['surah']}:{row['ayah']}"
        meaning = _safe(_excerpt(row["text_tr"] if "text_tr" in row.keys() else row["text_ar"] or "", query))
        if not meaning and "translit" in row.keys():
            meaning = _safe(_excerpt(row["translit"] or row["text_ar"] or "", query))
        parts.append(f"📖 <b>{reference}</b>\n{meaning}")
    return "\n\n".join(parts)


def _tajwid_text(topic: str = "menu") -> str:
    if topic in ARABIC_LETTER_LESSONS:
        return _arabic_lesson_text(topic)
    if topic == "letters":
        return (
            "🔤 <b>Араб әріптері</b>\n\n"
            "Құран оқу 28 әріпті танудан басталады. Ең тиімді жолы — "
            "әріптерді ұқсас пішініне қарай шағын топпен оқу.\n\n"
            "<b>Үйрену реті:</b>\n"
            "1) Әріптің пішінін жаттау.\n"
            "2) Әріптің атын дауыстап айту.\n"
            "3) Оған харакат қосып оқу: <b>بَ = ба</b>, <b>بِ = би</b>, <b>بُ = бу</b>.\n"
            "4) Оңнан солға оқуды күнде 3-5 минут қайталау.\n\n"
            "<b>Топтар:</b>\n"
            "1) <b>ا ب ت ث</b>\n"
            "2) <b>ج ح خ د ذ ر ز</b>\n"
            "3) <b>س ش ص ض ط ظ</b>\n"
            "4) <b>ع غ ف ق ك ل م ن هـ و ي</b>\n\n"
            "Төменнен бір топты ашып, қысқа жаттығулармен қайталаңыз."
        )
    if topic == "harakat":
        return (
            "◌َ <b>Харакат және негізгі белгілер</b>\n\n"
            "<b>Фатха َ</b> — а: <b>بَ = ба</b>\n"
            "<b>Касра ِ</b> — и: <b>بِ = би</b>\n"
            "<b>Дамма ُ</b> — у: <b>بُ = бу</b>\n"
            "<b>Сукун ْ</b> — дыбыс тоқтайды: <b>بْ</b>\n"
            "<b>Шадда ّ</b> — әріп қосарланады: <b>بَّ</b>\n"
            "<b>Тәнуин ً ٍ ٌ</b> — ан/ин/ун реңкімен оқылады.\n\n"
            "<b>Жеңіл мысалдар:</b>\n"
            "<b>بَتَ</b> = бата\n"
            "<b>بِسْمِ</b> = бисми\n"
            "<b>نُور</b> = нур\n\n"
            "Әріпке харакат қоса алсаңыз, Құранды буындап оқу әлдеқайда жеңілдейді."
        )
    if topic == "syllables":
        return (
            "🔗 <b>Буындап оқу</b>\n\n"
            "Арабша оңнан солға оқылады. Сондықтан әріпті көргенде бірден "
            "харакатымен бірге оқуға дағдыланыңыз.\n\n"
            "<b>Қадамдар:</b>\n"
            "1) Әріпті таныңыз: <b>ب</b>\n"
            "2) Харакат қосыңыз: <b>بَ = ба</b>\n"
            "3) Екі буынды қосыңыз: <b>بَا = баа</b>, <b>تُبَ = түба</b>\n"
            "4) Сукунды байқасаңыз, дыбысты тоқтатып оқыңыз: <b>اَبْ = аб</b>\n\n"
            "<b>Күнделікті жаттығу:</b>\n"
            "<b>با</b> = ба\n"
            "<b>بو</b> = бу\n"
            "<b>بي</b> = би\n"
            "<b>نَاس</b> = наас\n"
            "<b>فَلَق</b> = фалақ\n\n"
            "Алдымен баяу оқыңыз, жылдамдық кейін өзі келеді."
        )
    if topic == "rules":
        return (
            "📘 <b>Тәжуид ережелері</b>\n\n"
            "Әріп пен харакат бекіген соң, енді негізгі төрт ережені үйреніңіз.\n\n"
            "1) <b>Нүн/тәнуин</b> — жасырыну, кірігу, анық оқу.\n"
            "2) <b>Мәдд</b> — созылатын жерлер.\n"
            "3) <b>Қалқала</b> — серпінмен айтылатын әріптер.\n"
            "4) <b>Жуан/жіңішке</b> — дыбыстың жуандығын сақтау.\n\n"
            "Егер әріп оқу әлі қиын болса, алдымен қайтадан <b>Әріптер</b> мен "
            "<b>Харакат</b> бөліміне оралыңыз."
        )
    if topic == "noon":
        text = (
            "🎓 <b>Нүн сакина және тәнуин</b>\n\n"
            "<b>Ижһар</b> — әріп анық оқылады.\n"
            "<b>Идғам</b> — келесі әріпке кірігеді.\n"
            "<b>Иқлаб</b> — нүн дыбысы мимге ауысады.\n"
            "<b>Ихфа</b> — толық жасырмай, жеңіл мұрынмен оқылады.\n\n"
            "Алғашқы жаттығу ретінде қысқа сүрелерден мысал іздеңіз."
        )
        examples = _tajwid_examples_block("noon")
        return text + (f"\n\n{examples}" if examples else "")
    if topic == "madd":
        text = (
            "📏 <b>Мәдд</b>\n\n"
            "Созылатын негізгі әріптер: <b>ا و ي</b>.\n"
            "Қысқа созылу мен ұзақ созылуды шатастырмау маңызды.\n\n"
            "Бастапқыда Фатиха, Ихлас, Фәләқ, Нас сүрелерін жай қарқынмен оқып "
            "созылатын жерлерді белгілеңіз."
        )
        examples = _tajwid_examples_block("madd")
        return text + (f"\n\n{examples}" if examples else "")
    if topic == "qalqala":
        text = (
            "✨ <b>Қалқала</b>\n\n"
            "<b>ق ط ب ج د</b> әріптері сукунмен келгенде жеңіл серпінмен айтылады.\n\n"
            "Қатты дірілдетпей, тым жұмсартып та жібермей, қысқа соққыдай оқу керек."
        )
        examples = _tajwid_examples_block("qalqala")
        return text + (f"\n\n{examples}" if examples else "")
    if topic == "heavy":
        text = (
            "🪶 <b>Жуан және жіңішке оқу</b>\n\n"
            "<b>خ ص ض غ ط ق ظ</b> — жуан оқылатын әріптер.\n"
            "Қалғандарының көбі жіңішке оқылады.\n\n"
            "Тәжуидті күшейтудің жақсы жолы — бір сүрені аудиоға еріп бірнеше рет қайталау."
        )
        examples = _tajwid_examples_block("heavy")
        return text + (f"\n\n{examples}" if examples else "")
    if topic == "practice":
        return (
            "🎧 <b>Бастапқы практика</b>\n\n"
            "Ең жақсы тәртіп: <b>әріп</b> → <b>харакат</b> → <b>буын</b> → "
            "<b>қысқа сүре</b>.\n\n"
            "<b>Практика реті:</b>\n"
            "1) Алдымен <b>Фатиха</b> сүресін ашыңыз.\n"
            "2) Кейін <b>Ихлас</b>, <b>Фәләқ</b>, <b>Нас</b> сүрелеріне өтіңіз.\n"
            "3) Әуелі аудионы тыңдаңыз.\n"
            "4) Сосын арабша мәтінге қарап буындап оқыңыз.\n"
            "5) Ең соңында транскрипциямен тексеріңіз.\n\n"
            "<b>Жеңіл үлгілер:</b>\n"
            "<b>با</b> = ба · <b>تَبَ</b> = таба · <b>نَاس</b> = наас\n\n"
            "Төмендегі батырмалармен бірден қысқа сүрелерге өте аласыз."
        )
    text = (
        "🎓 <b>Тәжуид және араб оқу орталығы</b>\n\n"
        "Бұл бөлім енді әріпті танудан басталады: <b>әріп</b> → <b>харакат</b> "
        "→ <b>буындап оқу</b> → <b>тәжуид ережелері</b> → <b>қысқа сүрелер</b>.\n\n"
        "<b>Бүгін бастау үшін:</b>\n"
        "1) Алдымен <b>Әріптер</b> бөлімінен 1-топ пен 2-топты оқыңыз.\n"
        "2) Кейін <b>Харакат</b> пен <b>Буындап оқу</b> бөліміне өтіңіз.\n"
        "3) Сосын ғана нүн, мәдд, қалқала сияқты ережелерді қосыңыз."
    )
    return text


def _tajwid_markup(topic: str = "menu") -> InlineKeyboardMarkup:
    if topic == "letters":
        keyboard = [
            [
                InlineKeyboardButton(text="1-топ", callback_data="tajwid:letters1"),
                InlineKeyboardButton(text="2-топ", callback_data="tajwid:letters2"),
            ],
            [
                InlineKeyboardButton(text="3-топ", callback_data="tajwid:letters3"),
                InlineKeyboardButton(text="4-топ", callback_data="tajwid:letters4"),
            ],
            [
                InlineKeyboardButton(text="◌َ Харакат", callback_data="tajwid:harakat"),
                InlineKeyboardButton(text="🔗 Буын", callback_data="tajwid:syllables"),
            ],
            [
                InlineKeyboardButton(text="⬅️ Тәжуид", callback_data="tajwid:menu"),
                InlineKeyboardButton(text="📖 Құран", callback_data="quran_page_0"),
            ],
        ]
        return InlineKeyboardMarkup(inline_keyboard=keyboard)

    if topic in ARABIC_LETTER_LESSONS:
        keyboard = [
            [
                InlineKeyboardButton(text="1-топ", callback_data="tajwid:letters1"),
                InlineKeyboardButton(text="2-топ", callback_data="tajwid:letters2"),
            ],
            [
                InlineKeyboardButton(text="3-топ", callback_data="tajwid:letters3"),
                InlineKeyboardButton(text="4-топ", callback_data="tajwid:letters4"),
            ],
            [
                InlineKeyboardButton(text="◌َ Харакат", callback_data="tajwid:harakat"),
                InlineKeyboardButton(text="🔗 Буын", callback_data="tajwid:syllables"),
            ],
            [
                InlineKeyboardButton(text="⬅️ Әріптер", callback_data="tajwid:letters"),
                InlineKeyboardButton(text="📖 Құран", callback_data="quran_page_0"),
            ],
        ]
        return InlineKeyboardMarkup(inline_keyboard=keyboard)

    if topic == "harakat" or topic == "syllables":
        keyboard = [
            [
                InlineKeyboardButton(text="🔤 Әріптер", callback_data="tajwid:letters"),
                InlineKeyboardButton(text="📘 Ережелер", callback_data="tajwid:rules"),
            ],
            [
                InlineKeyboardButton(text="🎧 Практика", callback_data="tajwid:practice"),
                InlineKeyboardButton(text="📖 Құран", callback_data="quran_page_0"),
            ],
            [
                InlineKeyboardButton(text="⬅️ Тәжуид", callback_data="tajwid:menu"),
            ],
        ]
        return InlineKeyboardMarkup(inline_keyboard=keyboard)

    if topic == "rules":
        keyboard = [
            [
                InlineKeyboardButton(text="🔤 Нүн/тәнуин", callback_data="tajwid:noon"),
                InlineKeyboardButton(text="📏 Мәдд", callback_data="tajwid:madd"),
            ],
            [
                InlineKeyboardButton(text="✨ Қалқала", callback_data="tajwid:qalqala"),
                InlineKeyboardButton(text="🪶 Жуан/жіңішке", callback_data="tajwid:heavy"),
            ],
            [
                InlineKeyboardButton(text="🔤 Әріптер", callback_data="tajwid:letters"),
                InlineKeyboardButton(text="🎧 Практика", callback_data="tajwid:practice"),
            ],
            [
                InlineKeyboardButton(text="⬅️ Тәжуид", callback_data="tajwid:menu"),
                InlineKeyboardButton(text="📖 Құран", callback_data="quran_page_0"),
            ],
        ]
        return InlineKeyboardMarkup(inline_keyboard=keyboard)

    if topic == "practice":
        keyboard = [
            [
                InlineKeyboardButton(text="1. Фатиха", callback_data=f"surah_1_{_menu_page_for_surah(1)}"),
                InlineKeyboardButton(text="112. Ихлас", callback_data=f"surah_112_{_menu_page_for_surah(112)}"),
            ],
            [
                InlineKeyboardButton(text="113. Фәләқ", callback_data=f"surah_113_{_menu_page_for_surah(113)}"),
                InlineKeyboardButton(text="114. Нас", callback_data=f"surah_114_{_menu_page_for_surah(114)}"),
            ],
            [
                InlineKeyboardButton(text="🎧 Фатиха аудио", callback_data="quranaudio:open:1:0"),
                InlineKeyboardButton(text="🔤 Әріптер", callback_data="tajwid:letters"),
            ],
            [
                InlineKeyboardButton(text="◌َ Харакат", callback_data="tajwid:harakat"),
                InlineKeyboardButton(text="📖 Құран", callback_data="quran_page_0"),
            ],
            [
                InlineKeyboardButton(text="⬅️ Тәжуид", callback_data="tajwid:menu"),
            ],
        ]
        return InlineKeyboardMarkup(inline_keyboard=keyboard)

    if topic == "menu":
        keyboard = [
            [
                InlineKeyboardButton(text="🔤 Әріптер", callback_data="tajwid:letters"),
                InlineKeyboardButton(text="◌َ Харакат", callback_data="tajwid:harakat"),
            ],
            [
                InlineKeyboardButton(text="🔗 Буындап оқу", callback_data="tajwid:syllables"),
                InlineKeyboardButton(text="📘 Ережелер", callback_data="tajwid:rules"),
            ],
            [
                InlineKeyboardButton(text="🎧 Практика", callback_data="tajwid:practice"),
                InlineKeyboardButton(text="📖 Құран", callback_data="quran_page_0"),
            ],
        ]
        return InlineKeyboardMarkup(inline_keyboard=keyboard)

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="📘 Ережелер", callback_data="tajwid:rules"),
                InlineKeyboardButton(text="🎧 Практика", callback_data="tajwid:practice"),
            ],
            [
                InlineKeyboardButton(text="🔤 Әріптер", callback_data="tajwid:letters"),
                InlineKeyboardButton(text="📖 Құран", callback_data="quran_page_0"),
            ],
            [
                InlineKeyboardButton(text="⬅️ Тәжуид", callback_data="tajwid:menu"),
            ],
        ]
    )


def _khatm_text(user_id: int) -> str:
    lang = get_user_lang(user_id, default="kk")
    progress = get_user_khatm(user_id)
    meta = get_user_khatm_meta(user_id)
    if lang == "ru":
        goal_block = (
            "🎯 <b>Цель на день</b>\n"
            f"Сегодня: <b>{meta['today_read_ayahs']}/{meta['daily_goal_ayahs']}</b> аятов\n"
            f"Осталось: <b>{meta['goal_remaining']}</b>\n"
            f"Серия: <b>{meta['streak_days']}</b> дней"
        )
    elif lang == "kk":
        goal_block = (
            "🎯 <b>Күндік мақсат</b>\n"
            f"Бүгін: <b>{meta['today_read_ayahs']}/{meta['daily_goal_ayahs']}</b> аят\n"
            f"Қалғаны: <b>{meta['goal_remaining']}</b>\n"
            f"Streak: <b>{meta['streak_days']}</b> күн"
        )
    else:
        goal_block = (
            "🎯 <b>Daily Goal</b>\n"
            f"Today: <b>{meta['today_read_ayahs']}/{meta['daily_goal_ayahs']}</b> ayahs\n"
            f"Remaining: <b>{meta['goal_remaining']}</b>\n"
            f"Streak: <b>{meta['streak_days']}</b> days"
        )
    if not progress:
        if lang == "ru":
            return (
                "📍 <b>Хатм</b>\n\n"
                "Здесь сохраняется место, на котором вы остановились.\n\n"
                "<b>Как использовать:</b>\n"
                "1) Отметьте место форматом <b>2:255</b>.\n"
                "2) Потом продолжайте с него через <b>Продолжить</b>.\n"
                "3) Через <b>Аудио</b> можно слушать с этого аята.\n\n"
                f"{goal_block}"
            )
        if lang == "kk":
            return (
                "📍 <b>Хатым</b>\n\n"
                "Бұл бөлімде тоқтаған жеріңіз сақталады.\n\n"
                "<b>Қалай қолданасыз:</b>\n"
                "1) <b>2:255</b> сияқты форматпен орынды белгілеңіз.\n"
                "2) Кейін <b>Жалғастыру</b> арқылы сол жерден қайта кіресіз.\n"
                "3) <b>Аудио</b> арқылы сол аяттан тыңдай аласыз.\n\n"
                f"{goal_block}"
            )
        return (
            "📍 <b>Khatm</b>\n\n"
            "This section saves where you stopped.\n\n"
            "<b>How to use it:</b>\n"
            "1) Mark your place using a format like <b>2:255</b>.\n"
            "2) Later continue from that point with <b>Continue</b>.\n"
            "3) You can listen from that ayah through <b>Audio</b>.\n\n"
            f"{goal_block}"
        )

    if lang == "ru":
        return (
            "📍 <b>Хатм</b>\n\n"
            f"Последняя отметка: <b>{progress['surah']}:{progress['ayah']}</b>\n"
            f"Прогресс: <b>{progress['percent']:.1f}%</b>\n"
            f"Осталось: <b>{progress['remaining_ayahs']}</b> аятов\n"
            f"Позиция в суре: <b>{progress['ayah']}/{progress['surah_total']}</b>\n"
            f"Завершенных хатмов: <b>{progress['completed_khatms']}</b>\n"
            f"Обновлено: <b>{progress['updated_at']}</b>\n\n"
            f"{goal_block}\n\n"
            "Отсюда можно продолжить чтение или слушать аудио Насира аль-Катами."
        )
    if lang == "kk":
        return (
            "📍 <b>Хатым</b>\n\n"
            f"Соңғы белгі: <b>{progress['surah']}:{progress['ayah']}</b>\n"
            f"Прогресс: <b>{progress['percent']:.1f}%</b>\n"
            f"Қалғаны: <b>{progress['remaining_ayahs']}</b> аят\n"
            f"Сүредегі орны: <b>{progress['ayah']}/{progress['surah_total']}</b>\n"
            f"Аяқталған хатым: <b>{progress['completed_khatms']}</b>\n"
            f"Жаңартылған уақыты: <b>{progress['updated_at']}</b>\n\n"
            f"{goal_block}\n\n"
            "Осы жерден оқуды да, Насир әл-Қатами аудиосымен тыңдауды да жалғастыра аласыз."
        )
    return (
        "📍 <b>Khatm</b>\n\n"
        f"Last mark: <b>{progress['surah']}:{progress['ayah']}</b>\n"
        f"Progress: <b>{progress['percent']:.1f}%</b>\n"
        f"Remaining: <b>{progress['remaining_ayahs']}</b> ayahs\n"
        f"Position in surah: <b>{progress['ayah']}/{progress['surah_total']}</b>\n"
        f"Completed khatms: <b>{progress['completed_khatms']}</b>\n"
        f"Updated at: <b>{progress['updated_at']}</b>\n\n"
        f"{goal_block}\n\n"
        "You can continue reading or listen with Nasser Al Qatami audio from here."
    )


def _khatm_markup(user_id: int, menu_page: int = 0) -> InlineKeyboardMarkup:
    lang = get_user_lang(user_id, default="kk")
    progress = get_user_khatm(user_id)
    meta = get_user_khatm_meta(user_id)
    keyboard = []

    if progress:
        keyboard.append(
            [
                InlineKeyboardButton(
                    text="▶️ Жалғастыру" if lang == "kk" else "▶️ Продолжить" if lang == "ru" else "▶️ Continue",
                    callback_data=f"qurankhatm:continue:{menu_page}",
                ),
                InlineKeyboardButton(
                    text="🎧 Аудио" if lang == "kk" else "🎧 Аудио" if lang == "ru" else "🎧 Audio",
                    callback_data=f"qurankhatm:audio:{menu_page}",
                ),
            ]
        )

    keyboard.append(
        [
            InlineKeyboardButton(
                text=_goal_label(int(meta["daily_goal_ayahs"]), 10),
                callback_data=f"qurankhatm:goal:10:{menu_page}",
            ),
            InlineKeyboardButton(
                text=_goal_label(int(meta["daily_goal_ayahs"]), 20),
                callback_data=f"qurankhatm:goal:20:{menu_page}",
            ),
            InlineKeyboardButton(
                text=_goal_label(int(meta["daily_goal_ayahs"]), 50),
                callback_data=f"qurankhatm:goal:50:{menu_page}",
            ),
        ]
    )
    keyboard.append(
        [
            InlineKeyboardButton(
                text="✍️ Орынды белгілеу"
                if lang == "kk"
                else "✍️ Отметить место"
                if lang == "ru"
                else "✍️ Mark Position",
                callback_data=f"qurankhatm:set:{menu_page}",
            ),
            InlineKeyboardButton(
                text="🎓 Тәжуид" if lang == "kk" else "🎓 Таджвид" if lang == "ru" else "🎓 Tajwid",
                callback_data="tajwid:menu",
            ),
        ]
    )
    keyboard.append(
        [
            InlineKeyboardButton(
                text="📖 Құран" if lang == "kk" else "📖 Коран" if lang == "ru" else "📖 Quran",
                callback_data=f"quran_page_{menu_page}",
            ),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def _audio_markup(
    surah_id: int,
    ayah: int,
    menu_page: int,
    user_id: int | None = None,
) -> InlineKeyboardMarkup:
    lang = get_user_lang(user_id, default="kk") if user_id else "kk"
    ayah_total = get_surah_ayah_count(surah_id)
    keyboard = []
    nav = []
    if ayah > 1:
        nav.append(
            InlineKeyboardButton(
                text="⬅️ Алдыңғы аят" if lang == "kk" else "⬅️ Предыдущий аят" if lang == "ru" else "⬅️ Previous Ayah",
                callback_data=f"quranaudio:play:{surah_id}:{ayah - 1}:{menu_page}",
            )
        )
    nav.append(
        InlineKeyboardButton(
            text=f"{ayah}/{ayah_total}",
            callback_data=f"quranaudio:play:{surah_id}:{ayah}:{menu_page}",
        )
    )
    if ayah < ayah_total:
        nav.append(
            InlineKeyboardButton(
                text="Келесі аят ➡️" if lang == "kk" else "Следующий аят ➡️" if lang == "ru" else "Next Ayah ➡️",
                callback_data=f"quranaudio:play:{surah_id}:{ayah + 1}:{menu_page}",
            )
        )
    keyboard.append(nav)
    keyboard.append(
        [
            InlineKeyboardButton(
                text="🔁 x3",
                callback_data=f"quranaudio:repeat:3:{surah_id}:{ayah}:{menu_page}",
            ),
            InlineKeyboardButton(
                text="🔁 x5",
                callback_data=f"quranaudio:repeat:5:{surah_id}:{ayah}:{menu_page}",
            ),
        ]
    )
    keyboard.append(
        [
            InlineKeyboardButton(
                text="🔎 Аят іздеу" if lang == "kk" else "🔎 Поиск аята" if lang == "ru" else "🔎 Search Ayah",
                callback_data="quran_search",
            ),
            InlineKeyboardButton(
                text="⬅️ Сүреге қайту" if lang == "kk" else "⬅️ К суре" if lang == "ru" else "⬅️ Back to Surah",
                callback_data=f"surah_{surah_id}_{menu_page}",
            ),
        ]
    )
    keyboard.append(
        [
            InlineKeyboardButton(
                text="📚 Барлық сүрелер" if lang == "kk" else "📚 Все суры" if lang == "ru" else "📚 All Surahs",
                callback_data=f"quran_page_{menu_page}",
            ),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


async def show_surah_message(message: types.Message, surah_id: int, menu_page: int = 0):
    chunks, error = _get_surah_chunks(surah_id, user_id=message.from_user.id)
    if not chunks:
        lang = get_user_lang(message.from_user.id)
        if RAQAT_BOT_API_ONLY and error == "unavailable":
            await message.answer(_api_unavailable_text(lang))
            return
        await message.answer("Сүре табылмады." if lang == "kk" else "Сура не найдена." if lang == "ru" else "Surah not found.")
        return

    await message.answer(
        chunks[0],
        reply_markup=_surah_chunk_markup(
            surah_id,
            0,
            len(chunks),
            menu_page,
            user_id=message.from_user.id,
        ),
    )


async def show_khatm_message(message: types.Message, menu_page: int = 0):
    await message.answer(
        _khatm_text(message.from_user.id),
        reply_markup=_khatm_markup(message.from_user.id, menu_page),
    )


async def show_tajwid_message(message: types.Message):
    await message.answer(
        _tajwid_text("menu"),
        reply_markup=_tajwid_markup("menu"),
    )


async def send_quran_audio_message(
    message: types.Message,
    surah_id: int,
    ayah: int,
    menu_page: int = 0,
    repeat_index: int | None = None,
    repeat_total: int | None = None,
    with_markup: bool = True,
    user_id: int | None = None,
):
    ayah_total = get_surah_ayah_count(surah_id)
    ayah = max(1, min(ayah, ayah_total or 1))
    title = _display_surah_title(surah_id)
    caption = quran_audio_caption(title, surah_id, ayah)
    resolved_user_id = user_id
    if resolved_user_id is None and getattr(getattr(message, "from_user", None), "id", None):
        if not getattr(message.from_user, "is_bot", False):
            resolved_user_id = message.from_user.id
    if repeat_index and repeat_total and repeat_total > 1:
        caption += f"\n\n🔁 Қайталау: <b>{repeat_index}/{repeat_total}</b>"

    try:
        await message.answer_audio(
            audio=build_quran_audio_url(surah_id, ayah),
            caption=caption,
            reply_markup=_audio_markup(surah_id, ayah, menu_page, resolved_user_id) if with_markup else None,
            title=f"{title} {ayah}-аят",
            performer="Nasser Al Qatami",
        )
    except Exception:
        await message.answer(
            f"{caption}\n\n"
            f"Сілтеме: {build_quran_audio_url(surah_id, ayah)}",
            reply_markup=_audio_markup(surah_id, ayah, menu_page, resolved_user_id) if with_markup else None,
        )


async def send_repeated_quran_audio_message(
    message: types.Message,
    surah_id: int,
    ayah: int,
    menu_page: int,
    repeat_total: int,
    user_id: int | None = None,
):
    repeat_total = max(1, min(repeat_total, 5))
    await message.answer(
        f"🔁 <b>{repeat_total} рет қайталау</b>\n\n"
        f"{_display_surah_title(surah_id)} · {ayah}-аят"
    )
    for index in range(1, repeat_total + 1):
        await send_quran_audio_message(
            message,
            surah_id,
            ayah,
            menu_page,
            repeat_index=index,
            repeat_total=repeat_total,
            with_markup=index == repeat_total,
            user_id=user_id,
        )


async def send_surah_audio_message(
    message: types.Message,
    surah_id: int,
    menu_page: int = 0,
    user_id: int | None = None,
):
    resolved_user_id = user_id
    if resolved_user_id is None and getattr(getattr(message, "from_user", None), "id", None):
        if not getattr(message.from_user, "is_bot", False):
            resolved_user_id = message.from_user.id
    lang = get_user_lang(resolved_user_id, default="kk") if resolved_user_id else "kk"
    ayah_total = get_surah_ayah_count(surah_id)
    if ayah_total <= 0:
        await message.answer("Сүре табылмады." if lang == "kk" else "Сура не найдена." if lang == "ru" else "Surah not found.")
        return

    if ayah_total > SHORT_SURAH_AUDIO_LIMIT:
        await message.answer(
            f"🎧 <b>{_display_surah_title(surah_id)}</b>\n\n"
            + (
                "Бұл сүре ұзындау, сондықтан аят-аят режим ашылды."
                if lang == "kk"
                else "Эта сура длиннее, поэтому открыт режим по аятам."
                if lang == "ru"
                else "This surah is longer, so ayah-by-ayah mode was opened."
            )
        )
        await send_quran_audio_message(message, surah_id, 1, menu_page, user_id=resolved_user_id)
        return

    await message.answer(
        f"🎧 <b>{_display_surah_title(surah_id)}</b>\n\n"
        + (
            f"Толық сүре аудиосы жіберіліп жатыр: <b>{ayah_total}</b> аят."
            if lang == "kk"
            else f"Отправляю полное аудио суры: <b>{ayah_total}</b> аятов."
            if lang == "ru"
            else f"Sending full surah audio: <b>{ayah_total}</b> ayahs."
        )
    )
    for ayah in range(1, ayah_total + 1):
        await send_quran_audio_message(
            message,
            surah_id,
            ayah,
            menu_page,
            with_markup=ayah == ayah_total,
            user_id=resolved_user_id,
        )


async def quran_handler(message: types.Message):
    logger.info("QURAN handler uid=%s text=%s", getattr(message.from_user, "id", None), message.text)
    ensure_progress_table()
    log_event(message.from_user.id, "open_quran")
    USER_STATE[message.from_user.id] = None
    await message.answer(
        _quran_page_text(0, message.from_user.id),
        reply_markup=_quran_page_markup(0, message.from_user.id),
    )


async def tajwid_handler(message: types.Message):
    logger.info("TAJWID handler uid=%s text=%s", getattr(message.from_user, "id", None), message.text)
    log_event(message.from_user.id, "open_tajwid")
    USER_STATE[message.from_user.id] = None
    await show_tajwid_message(message)


async def khatm_handler(message: types.Message):
    logger.info("KHATM handler uid=%s text=%s", getattr(message.from_user, "id", None), message.text)
    ensure_progress_table()
    log_event(message.from_user.id, "open_khatm")
    USER_STATE[message.from_user.id] = None
    await show_khatm_message(message)


async def quran_search_callback(callback: types.CallbackQuery):
    logger.info("QURAN search cb uid=%s data=%s", getattr(callback.from_user, "id", None), callback.data)
    USER_STATE[callback.from_user.id] = "quran_search"
    log_event(callback.from_user.id, "quran_search_open")
    lang = get_user_lang(callback.from_user.id)
    await callback.message.answer(tr("quran_search_prompt", lang))
    await callback.answer()


async def tajwid_callback(callback: types.CallbackQuery):
    data = callback.data or ""
    topic = "menu"
    if data.startswith("tajwid:"):
        parts = data.split(":")
        topic = parts[1] if len(parts) > 1 else "menu"

    try:
        await callback.message.edit_text(
            _tajwid_text(topic),
            reply_markup=_tajwid_markup(topic),
        )
    except TelegramBadRequest:
        await callback.message.answer(
            _tajwid_text(topic),
            reply_markup=_tajwid_markup(topic),
        )
    await callback.answer()


async def quran_tajwid_callback(callback: types.CallbackQuery):
    await tajwid_callback(callback)


async def quran_tajwid_map_callback(callback: types.CallbackQuery):
    parts = (callback.data or "").split(":")
    if len(parts) < 4:
        await callback.answer()
        return

    surah_id = int(parts[2])
    menu_page = int(parts[3])
    try:
        await callback.message.edit_text(
            _surah_tajwid_map_text(surah_id),
            reply_markup=_surah_tajwid_map_markup(surah_id, menu_page),
        )
    except TelegramBadRequest:
        await callback.message.answer(
            _surah_tajwid_map_text(surah_id),
            reply_markup=_surah_tajwid_map_markup(surah_id, menu_page),
        )
    await callback.answer()


async def quran_khatm_callback(callback: types.CallbackQuery):
    data = (callback.data or "").split(":")
    if len(data) < 2:
        await callback.answer()
        return

    action = data[1]
    menu_page = int(data[2]) if len(data) > 2 and data[2].isdigit() else 0
    uid = callback.from_user.id
    lang = get_user_lang(uid, default="kk")

    if action == "menu":
        try:
            await callback.message.edit_text(
                _khatm_text(uid),
                reply_markup=_khatm_markup(uid, menu_page),
            )
        except TelegramBadRequest:
            await callback.message.answer(
                _khatm_text(uid),
                reply_markup=_khatm_markup(uid, menu_page),
            )
    elif action == "set":
        USER_STATE[uid] = "quran_khatm_set"
        await callback.message.answer(
            "✍️ <b>Хатым орнын белгілеу</b>\n\nФормат: <b>2:255</b> немесе <b>Фатиха</b> немесе <b>Бақара 255</b>."
            if lang == "kk"
            else "✍️ <b>Отметить место хатма</b>\n\nФормат: <b>2:255</b> или <b>Фатиха</b> или <b>Бакара 255</b>."
            if lang == "ru"
            else "✍️ <b>Mark Khatm Position</b>\n\nFormat: <b>2:255</b> or <b>Fatiha</b> or <b>Baqarah 255</b>."
        )
    elif action == "goal" and len(data) > 3:
        goal = int(data[2])
        menu_page = int(data[3])
        meta = set_user_daily_goal(uid, goal)
        try:
            await callback.message.edit_text(
                _khatm_text(uid),
                reply_markup=_khatm_markup(uid, menu_page),
            )
        except TelegramBadRequest:
            pass
        await callback.answer(
            (
                f"Күндік мақсат: {meta['daily_goal_ayahs']} аят"
                if lang == "kk"
                else f"Дневная цель: {meta['daily_goal_ayahs']} аятов"
                if lang == "ru"
                else f"Daily goal: {meta['daily_goal_ayahs']} ayahs"
            ),
            show_alert=False,
        )
        return
    elif action == "continue":
        progress = get_user_khatm(uid)
        if not progress:
            await callback.answer(
                "Әлі орын белгіленбеген." if lang == "kk" else "Место еще не отмечено." if lang == "ru" else "No position has been marked yet.",
                show_alert=True,
            )
            return
        chunks, error = _get_surah_chunks(progress["surah"], user_id=uid)
        if chunks:
            try:
                await callback.message.edit_text(
                    chunks[0],
                    reply_markup=_surah_chunk_markup(
                        progress["surah"],
                        0,
                        len(chunks),
                        menu_page,
                        user_id=uid,
                    ),
                )
            except TelegramBadRequest:
                await callback.message.answer(
                    chunks[0],
                    reply_markup=_surah_chunk_markup(
                        progress["surah"],
                        0,
                        len(chunks),
                        menu_page,
                        user_id=uid,
                    ),
                )
        elif RAQAT_BOT_API_ONLY and error == "unavailable":
            await callback.answer(_api_unavailable_text(lang), show_alert=True)
            return
    elif action == "audio":
        progress = get_user_khatm(uid)
        if not progress:
            await callback.answer(
                "Әлі орын белгіленбеген." if lang == "kk" else "Место еще не отмечено." if lang == "ru" else "No position has been marked yet.",
                show_alert=True,
            )
            return
        await send_quran_audio_message(
            callback.message,
            progress["surah"],
            progress["ayah"],
            menu_page,
            user_id=uid,
        )

    await callback.answer()


async def quran_audio_callback(callback: types.CallbackQuery):
    data = (callback.data or "").split(":")
    if len(data) < 4:
        await callback.answer()
        return

    action = data[1]
    if action == "repeat" and len(data) >= 6:
        repeat_total = int(data[2])
        surah_id = int(data[3])
        ayah = int(data[4])
        menu_page = int(data[5])
    else:
        surah_id = int(data[2])
        ayah = int(data[3]) if action != "open" else 1
        menu_page = int(data[4]) if len(data) > 4 else int(data[3])

    if action == "play":
        await send_quran_audio_message(callback.message, surah_id, ayah, menu_page, user_id=callback.from_user.id)
    elif action == "open":
        await send_surah_audio_message(callback.message, surah_id, menu_page, user_id=callback.from_user.id)
    elif action == "repeat":
        await send_repeated_quran_audio_message(
            callback.message,
            surah_id,
            ayah,
            menu_page,
            repeat_total,
            user_id=callback.from_user.id,
        )
    elif action == "mark":
        saved = save_user_khatm(callback.from_user.id, surah_id, ayah)
        if saved:
            await callback.answer(
                f"Хатымға сақталды: {saved['surah']}:{saved['ayah']}",
                show_alert=False,
            )
            return

    await callback.answer()


async def quran_search_router(message: types.Message):
    if USER_STATE.get(message.from_user.id) != "quran_search":
        return

    await send_quran_search_results(message, (message.text or "").strip())
    USER_STATE[message.from_user.id] = None


async def send_quran_search_results(message: types.Message, query: str) -> None:
    lang = get_user_lang(message.from_user.id)
    if not query:
        await message.answer(tr("empty_query", lang))
        return

    log_event(message.from_user.id, "quran_search", detail=query[:120])
    content_lang = get_user_content_lang(message.from_user.id, default=lang)
    rows, api_failed = _search_quran_rows(query, lang, content_lang)
    if api_failed:
        await message.answer(_api_unavailable_text(lang))
        return
    await message.answer(_format_search_results(query, rows, lang))


async def quran_khatm_router(message: types.Message):
    if USER_STATE.get(message.from_user.id) != "quran_khatm_set":
        return

    reference = _extract_reference(message.text or "")
    if not reference:
        lang = get_user_lang(message.from_user.id, default="kk")
        await message.answer(
            "Форматты дұрыстаңыз: <b>2:255</b> немесе <b>Бақара 255</b>."
            if lang == "kk"
            else "Исправьте формат: <b>2:255</b> или <b>Бакара 255</b>."
            if lang == "ru"
            else "Use a valid format: <b>2:255</b> or <b>Baqarah 255</b>."
        )
        return

    saved = save_user_khatm(message.from_user.id, reference[0], reference[1])
    if not saved:
        lang = get_user_lang(message.from_user.id, default="kk")
        await message.answer(
            "Мұндай аят табылмады. Мысалы: <b>2:255</b>."
            if lang == "kk"
            else "Такой аят не найден. Например: <b>2:255</b>."
            if lang == "ru"
            else "That ayah was not found. For example: <b>2:255</b>."
        )
        return

    USER_STATE[message.from_user.id] = None
    lang = get_user_lang(message.from_user.id, default="kk")
    await message.answer(
        (
            "✅ <b>Хатым сақталды</b>\n\n"
            f"Орныңыз: <b>{saved['surah']}:{saved['ayah']}</b>\n"
            f"Прогресс: <b>{saved['percent']:.1f}%</b>\n"
            f"Бүгін: <b>{saved['today_read_ayahs']}/{saved['daily_goal_ayahs']}</b> аят"
        )
        if lang == "kk"
        else (
            "✅ <b>Хатм сохранен</b>\n\n"
            f"Ваше место: <b>{saved['surah']}:{saved['ayah']}</b>\n"
            f"Прогресс: <b>{saved['percent']:.1f}%</b>\n"
            f"Сегодня: <b>{saved['today_read_ayahs']}/{saved['daily_goal_ayahs']}</b> аятов"
        )
        if lang == "ru"
        else (
            "✅ <b>Khatm Saved</b>\n\n"
            f"Your position: <b>{saved['surah']}:{saved['ayah']}</b>\n"
            f"Progress: <b>{saved['percent']:.1f}%</b>\n"
            f"Today: <b>{saved['today_read_ayahs']}/{saved['daily_goal_ayahs']}</b> ayahs"
        ),
        reply_markup=_khatm_markup(message.from_user.id),
    )


async def quran_page_callback(callback: types.CallbackQuery):
    try:
        page = int((callback.data or "quran_page_0").split("_")[-1])
    except ValueError:
        page = 0

    try:
        await callback.message.edit_text(
            _quran_page_text(page, callback.from_user.id),
            reply_markup=_quran_page_markup(page, callback.from_user.id),
        )
    except Exception:
        await callback.message.answer(
            _quran_page_text(page, callback.from_user.id),
            reply_markup=_quran_page_markup(page, callback.from_user.id),
        )
    await callback.answer()


async def surah_callback(callback: types.CallbackQuery):
    parts = (callback.data or "").split("_")
    surah_id = int(parts[1])
    menu_page = int(parts[2]) if len(parts) > 2 else 0
    chunks, error = _get_surah_chunks(surah_id, user_id=callback.from_user.id)

    if not chunks:
        lang = get_user_lang(callback.from_user.id, default="kk")
        if RAQAT_BOT_API_ONLY and error == "unavailable":
            await callback.answer(_api_unavailable_text(lang), show_alert=True)
            return
        await callback.answer("Сүре табылмады")
        return

    try:
        await callback.message.edit_text(
            chunks[0],
            reply_markup=_surah_chunk_markup(
                surah_id,
                0,
                len(chunks),
                menu_page,
                user_id=callback.from_user.id,
            ),
        )
    except TelegramBadRequest:
        await callback.message.answer(
            chunks[0],
            reply_markup=_surah_chunk_markup(
                surah_id,
                0,
                len(chunks),
                menu_page,
                user_id=callback.from_user.id,
            ),
        )
    await callback.answer()


async def surah_page_callback(callback: types.CallbackQuery):
    parts = (callback.data or "").split("_")
    if len(parts) < 4:
        await callback.answer()
        return

    surah_id = int(parts[1])
    chunk_index = int(parts[2])
    menu_page = int(parts[3])
    chunks, error = _get_surah_chunks(surah_id, user_id=callback.from_user.id)

    if not chunks:
        lang = get_user_lang(callback.from_user.id, default="kk")
        if RAQAT_BOT_API_ONLY and error == "unavailable":
            await callback.answer(_api_unavailable_text(lang), show_alert=True)
            return
        await callback.answer("Сүре табылмады")
        return

    chunk_index = max(0, min(chunk_index, len(chunks) - 1))
    try:
        await callback.message.edit_text(
            chunks[chunk_index],
            reply_markup=_surah_chunk_markup(
                surah_id,
                chunk_index,
                len(chunks),
                menu_page,
                user_id=callback.from_user.id,
            ),
        )
    except TelegramBadRequest:
        pass
    await callback.answer()
