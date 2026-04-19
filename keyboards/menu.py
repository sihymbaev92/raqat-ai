# -*- coding: utf-8 -*-
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from services.language_service import (
    get_supported_language_codes,
    get_language_name,
    get_user_lang,
    menu_label,
)
from services.platform_link_service import platform_link_configured

def main_menu(user_id: int | None = None, lang: str | None = None):
    lang = lang or (get_user_lang(user_id) if user_id else None) or "kk"
    kb = ReplyKeyboardBuilder()
    # Алдымен: Құран → Хадис → RAQAT AI → Халал, содан қалғалары
    actions = [
        "quran",
        "hadith",
        "ai",
        "halal",
        "tajwid",
        "khatm",
        "prayer",
        "qibla",
        "tasbih",
        "language",
        "feedback",
    ]
    has_unified = platform_link_configured()
    if has_unified:
        i = actions.index("ai") + 1
        actions = actions[:i] + ["unified"] + actions[i:]
    for action in actions:
        kb.button(text=menu_label(action, lang))
    n = len(actions)
    layout = [2] * (n // 2)
    if n % 2:
        layout.append(1)
    kb.adjust(*layout)
    return kb.as_markup(resize_keyboard=True)


def language_menu(selected_lang: str | None = None):
    kb = InlineKeyboardBuilder()
    for code in get_supported_language_codes():
        marker = "● " if code == selected_lang else ""
        kb.button(
            text=f"{marker}{get_language_name(code)}",
            callback_data=f"lang:{code}",
        )
    kb.adjust(3, 3, 3, 3, 3)
    return kb.as_markup()


def translation_menu(ui_lang: str, selected_lang: str | None = None):
    kb = InlineKeyboardBuilder()
    follow_marker = "● " if selected_lang is None else ""
    follow_label = (
        f"{follow_marker}🔗 Интерфейс тілімен бірге"
        if ui_lang == "kk"
        else f"{follow_marker}🔗 Follow Interface"
        if ui_lang == "en"
        else f"{follow_marker}🔗 Вместе с интерфейсом"
    )
    kb.button(text=follow_label, callback_data="translate:follow_ui")

    for code in get_supported_language_codes():
        marker = "● " if code == selected_lang else ""
        kb.button(
            text=f"{marker}{get_language_name(code)}",
            callback_data=f"translate:set:{code}",
        )
    kb.adjust(1, 3, 3, 3, 3, 3)
    return kb.as_markup()


def onboarding_menu(lang: str):
    kb = InlineKeyboardBuilder()
    if lang == "ru":
        translation_label = "🌐 Перевод"
        quran_label = "📖 Поиск в Коране"
        feedback_label = "💬 Отзыв"
        done_label = "✅ Понятно"
    elif lang == "en":
        translation_label = "🌐 Translation"
        quran_label = "📖 Quran Search"
        feedback_label = "💬 Feedback"
        done_label = "✅ Done"
    else:
        translation_label = "🌐 Аударма"
        quran_label = "📖 Құран іздеу"
        feedback_label = "💬 Кері байланыс"
        done_label = "✅ Түсінікті"
    # Негізгі reply keyboard-пен бірдей (menu_text_matches сәйкестігі)
    halal_label = menu_label("halal", lang)

    kb.button(text=translation_label, callback_data="onboarding:translation")
    kb.button(text=quran_label, callback_data="onboarding:quran_search")
    kb.button(text=halal_label, callback_data="onboarding:halal")
    kb.button(text=feedback_label, callback_data="onboarding:feedback")
    kb.button(text=done_label, callback_data="onboarding:done")
    kb.adjust(2, 2, 1)
    return kb.as_markup()


def feedback_menu(lang: str):
    kb = InlineKeyboardBuilder()
    if lang == "ru":
        items = [
            ("🐞 Баг", "feedback:bug"),
            ("💡 Идея", "feedback:idea"),
            ("🧪 Контент / QA", "feedback:content"),
            ("❌ Отмена", "feedback:cancel"),
        ]
    elif lang == "en":
        items = [
            ("🐞 Bug", "feedback:bug"),
            ("💡 Idea", "feedback:idea"),
            ("🧪 Content / QA", "feedback:content"),
            ("❌ Cancel", "feedback:cancel"),
        ]
    else:
        items = [
            ("🐞 Қате", "feedback:bug"),
            ("💡 Ұсыныс", "feedback:idea"),
            ("🧪 Контент / QA", "feedback:content"),
            ("❌ Болдырмау", "feedback:cancel"),
        ]

    for text, data in items:
        kb.button(text=text, callback_data=data)
    kb.adjust(2, 1, 1)
    return kb.as_markup()


def admin_menu():
    kb = InlineKeyboardBuilder()
    kb.button(text="❤️ Health", callback_data="admin:health")
    kb.button(text="📊 Stats", callback_data="admin:stats")
    kb.button(text="💬 Feedback", callback_data="admin:feedbacks")
    kb.button(text="🧪 QA", callback_data="admin:qa")
    kb.adjust(2, 2)
    return kb.as_markup()


def feedback_admin_actions(feedback_id: int):
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Done", callback_data=f"admin:feedback_done:{feedback_id}")
    kb.button(text="📂 Reviewed", callback_data=f"admin:feedback_reviewed:{feedback_id}")
    kb.adjust(2)
    return kb.as_markup()

def next_hadith_keyboard():
    kb = InlineKeyboardBuilder()
    kb.button(text="🔄 Келесі сахих", callback_data="next_hadith")
    return kb.as_markup()

def tasbih_keyboard(uid: int):
    """Тасбих + зікір таңдау (дерекқордан алғашқы 8 жол)."""
    from config.settings import DB_PATH
    from db.connection import db_conn
    from db.dhikr_repo import list_dhikrs
    from state.memory import TASBIH_TARGET

    target = int(TASBIH_TARGET.get(uid, 33) or 33)
    kb = InlineKeyboardBuilder()
    kb.button(text="+1", callback_data="tasbih_plus")
    kb.button(
        text=f"{'● ' if target == 33 else '○ '}33",
        callback_data="tasbih_goal_33",
    )
    kb.button(
        text=f"{'● ' if target == 99 else '○ '}99",
        callback_data="tasbih_goal_99",
    )
    with db_conn(DB_PATH) as conn:
        rows = list_dhikrs(conn, limit=8)
    for idx, r in enumerate(rows, start=1):
        label = (r["text_kk"] or r["slug"] or str(r["id"]))[:18]
        kb.button(text=f"{idx}. {label}", callback_data=f"tasbih_z_{int(r['id'])}")
    kb.button(text="🔄 Нөлдеу", callback_data="tasbih_reset")
    kb.adjust(1, 2, 4, 4, 1)
    return kb.as_markup()
