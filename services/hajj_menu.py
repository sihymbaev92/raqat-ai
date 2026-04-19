# -*- coding: utf-8 -*-
"""Қажылық бөлімі: басты → ішкі → тарау (callback: hajj:...)."""
from __future__ import annotations

from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

SECTION_PARENT: dict[str, str] = {
    "overview": "basics",
    "ihram": "basics",
    "talbiyah": "basics",
    "d8": "hajj_days",
    "d9_arafah": "hajj_days",
    "d10_13": "hajj_days",
    "tawaf_ziyarah_sai": "main_rites",
    "jamarat_nahr": "main_rites",
    "wida": "main_rites",
    "umrah_full": "umrah",
    "women": "reminders",
    "health": "reminders",
    "mistakes": "reminders",
}

SUBMENU_INTRO: dict[str, str] = {
    "basics": (
        "📖 <b>Бастапқы</b>\n\n"
        "Қажылықтың мәні, парыз компоненттерінің жалпы тізімі, "
        "<b>ихрам</b> және <b>талбия (ләбәйка)</b> — умра мен қажылықта ихрамнан "
        "кейін жиі айтылатын дұға.\n\n"
        "Төменнен тарауды таңдаңыз."
    ),
    "hajj_days": (
        "📅 <b>Зұлхижже күндері</b>\n\n"
        "8 — Таруиа, 9 — Арафат, 10–13 — Мина · таштау · құрбан.\n\n"
        "Нақты уақыт пен орынды сапар ұйымымен растаңыз."
    ),
    "main_rites": (
        "🕋 <b>Негізгі рәсімдер</b>\n\n"
        "Тауаф ә-зиярә мен сәғи, жамарат пен құрбан, уада тауафы."
    ),
    "umrah": (
        "🔄 <b>Умра</b>\n\n"
        "Түмүкке, таваф, сәғи және шаш қысқарту — қысқа толық схема."
    ),
    "reminders": (
        "⚠️ <b>Ескертулер</b>\n\n"
        "Әйелдерге арналған ескертулер, денсаулық және жиі қателер."
    ),
}

SUBMENU_SECTIONS: dict[str, list[tuple[str, str]]] = {
    "basics": [
        ("overview", "📖 Қажылық не? · парыздар"),
        ("ihram", "🎽 Ихрам · миқат · тыйымдар"),
        ("talbiyah", "📣 Ләбәйка · талбия (толық мәтін)"),
    ],
    "hajj_days": [
        ("d8", "📅 8 зұлхижже (Таруиа)"),
        ("d9_arafah", "🌄 9 зұлхижже — Арафат"),
        ("d10_13", "🪨 10–13 — Мина · таштау · құрбан"),
    ],
    "main_rites": [
        ("tawaf_ziyarah_sai", "🕋 Тауаф ә-зиярә · сәғи"),
        ("jamarat_nahr", "🪨 Жамарат · құрбан · шаш"),
        ("wida", "👋 Уада (қоштасу) тауафы"),
    ],
    "umrah": [
        ("umrah_full", "🔄 Умра — толық қадамдар"),
    ],
    "reminders": [
        ("women", "🧕 Әйел қажыға"),
        ("health", "🩺 Денсаулық · ыстық · су"),
        ("mistakes", "⚠️ Жиі қателер"),
    ],
}

MAIN_MENU_BUTTONS: list[tuple[str, str]] = [
    ("sub:basics", "📖 Бастапқы: таныстыру · ихрам"),
    ("sub:hajj_days", "📅 Зұлхижже күндері"),
    ("sub:main_rites", "🕋 Негізгі рәсімдер"),
    ("sub:umrah", "🔄 Умра"),
    ("sub:reminders", "⚠️ Ескертулер"),
]

MAIN_MENU_INTRO = (
    "🕋 <b>Қажылық (Хадж)</b>\n\n"
    "Мұнда — <b>жол жүріс схемасы</b>, ихрам, Арафат, Мина, таштау, таваф және умра "
    "туралы <b>жалпы ақпарат</b>.\n\n"
    "⚠️ <b>Маңызды:</b> нақты фиқһ үкімі, мәзһаб, денсаулық және қауіпсіздік "
    "үшін <b>сенімді ұстаз</b> немесе рәсми хадж топтарының нұсқауларын "
    "орындаңыз. Бұл мәтін <b>ақпараттық</b> ғана.\n\n"
    "Төменнен бөлімді таңдаңыз."
)


def build_main_markup() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for suffix, label in MAIN_MENU_BUTTONS:
        builder.button(text=label, callback_data=f"hajj:{suffix}")
    builder.adjust(1)
    return builder.as_markup()


def build_sub_markup(sub_id: str) -> InlineKeyboardMarkup:
    rows = SUBMENU_SECTIONS.get(sub_id, [])
    builder = InlineKeyboardBuilder()
    for key, label in rows:
        builder.button(text=label, callback_data=f"hajj:{key}")
    builder.button(text="⬅️ Қажылық басты мәзір", callback_data="hajj:menu")
    builder.adjust(1)
    return builder.as_markup()


def build_leaf_markup(section: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    parent = SECTION_PARENT.get(section)
    if parent:
        builder.button(
            text="⬅️ Артқа (бөлікке)",
            callback_data=f"hajj:sub:{parent}",
        )
    builder.button(text="🏠 Қажылық басты", callback_data="hajj:menu")
    builder.adjust(1, 1)
    return builder.as_markup()


def parse_hajj_callback(data: str | None) -> tuple[str, str | None]:
    parts = (data or "").split(":")
    if len(parts) < 2 or parts[0] != "hajj":
        return "menu", None
    if parts[1] == "menu":
        return "menu", None
    if parts[1] == "sub" and len(parts) >= 3 and parts[2]:
        return "sub", parts[2]
    if len(parts) >= 2 and parts[1] not in ("menu", "sub"):
        return "leaf", parts[1]
    return "menu", None


ALL_SECTION_KEYS: frozenset[str] = frozenset(SECTION_PARENT.keys())
