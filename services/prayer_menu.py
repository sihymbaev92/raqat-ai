# -*- coding: utf-8 -*-
"""
Намаз бөлімі: екі деңгейлі мәзір (басты → ішкі → тарау).
"""
from __future__ import annotations

from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

# Тарау кілті → қай ішкі мәзірге «артқа»
SECTION_PARENT: dict[str, str] = {
    # дәрет (eski callback-тар да «артқа» дәрет топына барады)
    "purification": "wudu",
    "wudu_rules": "wudu",
    "wudu_visual": "wudu",
    "visual_wudu": "wudu",
    "wudu_men": "wudu",
    "wudu_women": "wudu",
    # намаз оқу
    "conditions": "salah",
    "salah_2rakat": "salah",
    "salah_duas": "salah",
    "steps": "salah",
    "visual_salah": "salah",
    "men": "salah",
    "women": "salah",
    "mistakes": "salah",
    "invalidators": "salah",
    # түрлері
    "types": "kinds",
    "fard": "kinds",
    "wajib": "kinds",
    "sunnah": "kinds",
    "tahajjud": "kinds",
    "witr": "kinds",
    "extra": "kinds",
    # сапар / жұма
    "travel": "other",
    "jumuah": "other",
}

SUBMENU_INTRO: dict[str, str] = {
    "wudu": (
        "💧 <b>Дәрет және тазалық</b>\n\n"
        "• <b>10 қадам</b> — дәрет алу тәртібі\n"
        "• <b>Мәкрүһ · әдеп · түрлері</b> — дәретсіз харам, бұзатындар, ғұсыл/таяммум\n"
        "• <b>Суретті схема</b> — қысқаша жолақ\n\n"
        "Ескі «ер/әйел дәреті» callback-тары әлі жұмыс істейді."
    ),
    "salah": (
        "🧎 <b>Намаз оқу</b>\n\n"
        "Инфографика негізінде: <b>екі рәкағат толық нұсқау</b>, "
        "<b>дұғалар мен қысқа сүрелер</b>, сондай-ақ шарттар, төрт/үш рәкағат схемасы, "
        "ер/әйел, сәһу сәжде және бұзатындар.\n\n"
        "Төменнен тарауды таңдаңыз."
    ),
    "kinds": (
        "📚 <b>Намаз түрлері</b>\n\n"
        "Парыз бес уақыт, уәжіп намаздар, сүннет пен нәпіл, <b>тәһажжуд</b>, "
        "<b>үтір</b> және тарауих, истихара, қаза сияқты қосымша намаздарға шолу.\n\n"
        "Төменнен нақты тарауды ашыңыз."
    ),
    "other": (
        "🧳 <b>Сапар, қаза, жұма және жаназа</b>\n\n"
        "Сапарда қысқарту, қаза өтеу, жұма намазының жалпы сипаты және жаназа "
        "туралы қысқаша ақпарат.\n\n"
        "Нақты шарттар мен мәзһабтық ерекшеліктерді ұстазбен растаған жөн.\n\n"
        "Төменнен тарауды таңдаңыз."
    ),
    "hajj": (
        "🕋 <b>Қажылық</b>\n\n"
        "Төмендегі түймелер — <b>қажылық бөлімінің</b> басты мәзірімен бірдей: "
        "ихрам, Зұлхижже күндері, Арафат, Мина, таваф, умра және ескертулер.\n\n"
        "⚠️ Нақты фиқһ пен сапар нұсқауларын ұстаз немесе ресми топпен растаңыз."
    ),
}

# ішкі мәзір: sub_id -> [(section_key, button_label)]
SUBMENU_SECTIONS: dict[str, list[tuple[str, str]]] = {
    "wudu": [
        ("purification", "📖 10 қадам: дәрет тәртібі"),
        ("wudu_rules", "📋 Мәкрүһ · әдеп · бұзатындар"),
        ("wudu_visual", "🖼️ Суретті схема · ер · әйел"),
    ],
    "salah": [
        ("conditions", "📜 Шарттар мен рүкін"),
        ("salah_2rakat", "🕌 Екі рәкағат (толық)"),
        ("salah_duas", "📿 Дұғалар мен сүрелер"),
        ("steps", "📋 Төрт/үш рәкағат схемасы"),
        ("visual_salah", "🖼️ Суретті намаз"),
        ("men", "👨 Ер кісі"),
        ("women", "🧕 Әйел кісі"),
        ("mistakes", "🛠️ Сәһу сәжде"),
        ("invalidators", "❗ Намазды бұзатындар"),
    ],
    "kinds": [
        ("types", "📚 Түрлерге шолу"),
        ("fard", "☀️ Парыз (5 уақыт)"),
        ("wajib", "📿 Уәжіп"),
        ("sunnah", "🌟 Сүннет / нәпіл"),
        ("tahajjud", "🌙 Тәһажжуд"),
        ("witr", "✨ Үтір"),
        ("extra", "➕ Қосымша намаздар"),
    ],
    "other": [
        ("travel", "🧳 Сапар · қаза"),
        ("jumuah", "🕌 Жұма · жаназа"),
    ],
    # Түймелер hajj_menu.MAIN_MENU_BUTTONS-пен бірдей; callback: hajj:... (handlers/hajj.py)
    "hajj": [],
}

# басты мәзір: [(callback_suffix, label)] — callback = prayer:SUB або prayer:times
MAIN_MENU_BUTTONS: list[tuple[str, str]] = [
    ("times", "🕐 Уақыттар"),
    ("sub:wudu", "💧 Дәрет және тазалық"),
    ("sub:salah", "🧎 Намаз оқу"),
    ("sub:kinds", "📚 Намаз түрлері"),
    ("sub:other", "🧳 Сапар · жұма · қаза"),
    ("sub:hajj", "🕋 Қажылық"),
]

MAIN_MENU_INTRO = (
    "🕌 <b>Намаз бөлімі</b>\n\n"
    "Мазмұн төменде <b>алты топқа</b> реттелген — алдымен топты, содан кейін "
    "нақты тарауды таңдаңыз.\n\n"
    "🕐 <b>Уақыттар</b> — бүгінгі намаз уақыттары (жаңарту үшін интернет қажет)\n"
    "💧 <b>Дәрет және тазалық</b> — дәрет, ғұсыл, таяммум; суретті дәрет бір экранда\n"
    "🧎 <b>Намаз оқу</b> — шарттар, рет, ер/әйел, сәһу сәжде, бұзатындар\n"
    "📚 <b>Намаз түрлері</b> — парыз, уәжіп, сүннет, тәһажжуд, үтір, қосымшалар\n"
    "🧳 <b>Сапар · жұма · қаза</b> — сапар, қаза, жұма, жаназа\n"
    "🕋 <b>Қажылық</b> — ихрам, Арафат, Мина, таваф, умра (толық мәзір осы топтың ішінде)\n\n"
    "<i>Жалпы ақпарат; нақты фиқһ мәзһаб пен ұстазбен расталуы керек.</i>"
)


def build_main_markup() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for suffix, label in MAIN_MENU_BUTTONS:
        builder.button(text=label, callback_data=f"prayer:{suffix}")
    builder.adjust(1, 2, 2, 1)
    return builder.as_markup()


def build_sub_markup(sub_id: str) -> InlineKeyboardMarkup:
    if sub_id == "hajj":
        from services.hajj_menu import MAIN_MENU_BUTTONS as _hajj_main

        builder = InlineKeyboardBuilder()
        for suffix, label in _hajj_main:
            builder.button(text=label, callback_data=f"hajj:{suffix}")
        builder.button(text="⬅️ Бас намаз мәзірі", callback_data="prayer:menu")
        builder.adjust(1)
        return builder.as_markup()

    rows = SUBMENU_SECTIONS.get(sub_id, [])
    builder = InlineKeyboardBuilder()
    for key, label in rows:
        builder.button(text=label, callback_data=f"prayer:{key}")
    builder.button(text="⬅️ Бас намаз мәзірі", callback_data="prayer:menu")
    builder.adjust(2)
    return builder.as_markup()


def build_leaf_markup(section: str) -> InlineKeyboardMarkup:
    """Тарау мәтіні үшін: артқа (ішкі мәзір не бас мәзір)."""
    builder = InlineKeyboardBuilder()
    parent = SECTION_PARENT.get(section)
    if parent:
        builder.button(
            text="⬅️ Артқа (топқа)",
            callback_data=f"prayer:sub:{parent}",
        )
    builder.button(text="🏠 Бас намаз мәзірі", callback_data="prayer:menu")
    builder.adjust(1, 1)
    return builder.as_markup()


def parse_prayer_callback(data: str | None) -> tuple[str, str | None]:
    """
    Қайтарады: (түрі, мән)
    түрі: 'menu' | 'sub' | 'leaf'
    sub үшін мән: wudu | salah | kinds | other
    leaf үшін мән: section кілті (times, purification, ...)
    """
    parts = (data or "").split(":")
    if len(parts) < 2 or parts[0] != "prayer":
        return "menu", None
    if parts[1] == "menu":
        return "menu", None
    if parts[1] == "sub":
        if len(parts) >= 3 and parts[2]:
            return "sub", parts[2]
        return "menu", None
    return "leaf", parts[1]


ALL_SECTION_KEYS: frozenset[str] = frozenset(
    {"times"}
    | set(SECTION_PARENT.keys())
)
