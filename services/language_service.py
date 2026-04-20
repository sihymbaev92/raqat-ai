# -*- coding: utf-8 -*-
import re
from contextlib import contextmanager
from typing import Any, Iterator

from config.settings import DB_PATH
from db.connection import db_conn
from db.dialect_sql import execute as _exec
from state.memory import USER_CONTENT_LANG, USER_LANG


@contextmanager
def _lang_db() -> Iterator[Any]:
    """PostgreSQL DSN болса `get_db_writer()`, әйтпесе SQLite `DB_PATH`."""
    from db.get_db import get_db_writer, is_postgresql_configured

    if is_postgresql_configured():
        with get_db_writer() as conn:
            yield conn
    else:
        with db_conn(DB_PATH) as conn:
            yield conn

DEFAULT_LANGUAGE = "kk"
FOLLOW_UI_SENTINEL = ""

LANGUAGE_ORDER = [
    "kk",
    "en",
    "ar",
    "tr",
    "ru",
    "uz",
    "ky",
    "tg",
    "az",
    "zh",
    "ku",
    "ur",
    "fa",
    "id",
    "ms",
]

LANGUAGES = {
    "kk": {"native": "Қазақша", "english": "Kazakh"},
    "en": {"native": "English", "english": "English"},
    "ar": {"native": "العربية", "english": "Arabic"},
    "tr": {"native": "Türkçe", "english": "Turkish"},
    "ru": {"native": "Русский", "english": "Russian"},
    "uz": {"native": "O'zbekcha", "english": "Uzbek"},
    "ky": {"native": "Кыргызча", "english": "Kyrgyz"},
    "tg": {"native": "Тоҷикӣ", "english": "Tajik"},
    "az": {"native": "Azərbaycanca", "english": "Azerbaijani"},
    "zh": {"native": "中文", "english": "Chinese"},
    "ku": {"native": "Kurmancî", "english": "Kurmanji"},
    "ur": {"native": "اردو", "english": "Urdu"},
    "fa": {"native": "فارسی", "english": "Persian"},
    "id": {"native": "Bahasa Indonesia", "english": "Indonesian"},
    "ms": {"native": "Bahasa Melayu", "english": "Malay"},
}

MENU_LABELS = {
    "quran": {
        "kk": "📖 ҚҰРАН",
        "en": "📖 QURAN",
        "ar": "📖 القرآن",
        "tr": "📖 KUR'AN",
        "ru": "📖 КОРАН",
        "uz": "📖 QUR'ON",
        "ky": "📖 КУРАН",
        "tg": "📖 ҚУРЪОН",
        "az": "📖 QURAN",
        "zh": "📖 古兰经",
        "ku": "📖 QUR'AN",
        "ur": "📖 قرآن",
        "fa": "📖 قرآن",
        "id": "📖 AL-QURAN",
        "ms": "📖 AL-QURAN",
    },
    "tajwid": {
        "kk": "🎓 ТӘЖУИД",
        "en": "🎓 TAJWID",
        "ar": "🎓 التجويد",
        "tr": "🎓 TECVID",
        "ru": "🎓 ТАДЖВИД",
        "uz": "🎓 TAJVID",
        "ky": "🎓 ТАЖВИД",
        "tg": "🎓 ТАҶВИД",
        "az": "🎓 TƏCVID",
        "zh": "🎓 泰吉威德",
        "ku": "🎓 TECWÎD",
        "ur": "🎓 تجوید",
        "fa": "🎓 تجوید",
        "id": "🎓 TAJWID",
        "ms": "🎓 TAJWID",
    },
    "khatm": {
        "kk": "📍 ХАТЫМ",
        "en": "📍 KHATM",
        "ar": "📍 الختمة",
        "tr": "📍 HATM",
        "ru": "📍 ХАТМ",
        "uz": "📍 HATM",
        "ky": "📍 ХАТМ",
        "tg": "📍 ХАТМ",
        "az": "📍 XƏTM",
        "zh": "📍 ختم进度",
        "ku": "📍 XETM",
        "ur": "📍 ختم",
        "fa": "📍 ختم",
        "id": "📍 KHATM",
        "ms": "📍 KHATM",
    },
    "wudu": {
        "kk": "💧 ДӘРЕТ",
        "en": "💧 WUDU",
        "ar": "💧 الوضوء",
        "tr": "💧 ABDEST",
        "ru": "💧 ОМОВЕНИЕ",
        "uz": "💧 TAHORAT",
        "ky": "💧 ДАРЕТ",
        "tg": "💧 ТАҲОРАТ",
        "az": "💧 DƏSTƏMAZ",
        "zh": "💧 小净",
        "ku": "💧 DESTNÎŞT",
        "ur": "💧 وضو",
        "fa": "💧 وضو",
        "id": "💧 WUDHU",
        "ms": "💧 WUDUK",
    },
    "prayer": {
        "kk": "🕌 НАМАЗ",
        "en": "🕌 PRAYER",
        "ar": "🕌 الصلاة",
        "tr": "🕌 NAMAZ",
        "ru": "🕌 НАМАЗ",
        "uz": "🕌 NAMOZ",
        "ky": "🕌 НАМАЗ",
        "tg": "🕌 НАМОЗ",
        "az": "🕌 NAMAZ",
        "zh": "🕌 礼拜",
        "ku": "🕌 NIMÊJ",
        "ur": "🕌 نماز",
        "fa": "🕌 نماز",
        "id": "🕌 SHALAT",
        "ms": "🕌 SOLAT",
    },
    "hajj": {
        "kk": "🕋 ҚАЖЫЛЫҚ",
        "en": "🕋 HAJJ",
        "ar": "🕋 الحج",
        "tr": "🕋 HAC",
        "ru": "🕋 ХАДЖ",
        "uz": "🕋 HAJ",
        "ky": "🕋 АЖЫЛЫК",
        "tg": "🕋 ҲАҶҶ",
        "az": "🕋 HƏCC",
        "zh": "🕋 朝觐",
        "ku": "🕋 HEC",
        "ur": "🕋 حج",
        "fa": "🕋 حج",
        "id": "🕋 HAJI",
        "ms": "🕋 HAJI",
    },
    "hadith": {
        "kk": "📚 ХАДИС",
        "en": "📚 HADITH",
        "ar": "📚 الحديث",
        "tr": "📚 HADIS",
        "ru": "📚 ХАДИС",
        "uz": "📚 HADIS",
        "ky": "📚 ХАДИС",
        "tg": "📚 ҲАДИС",
        "az": "📚 HƏDIS",
        "zh": "📚 圣训",
        "ku": "📚 HEDÎS",
        "ur": "📚 حدیث",
        "fa": "📚 حدیث",
        "id": "📚 HADIS",
        "ms": "📚 HADIS",
    },
    "ai": {
        "kk": "🤖 RAQAT AI · КӨМЕКШІ",
        **{code: "🤖 RAQAT AI" for code in LANGUAGE_ORDER if code != "kk"},
    },
    "tasbih": {
        "kk": "📿 ТӘСПІ",
        "en": "📿 TASBIH",
        "ar": "📿 التسبيح",
        "tr": "📿 TESBIH",
        "ru": "📿 ТАСБИХ",
        "uz": "📿 TASBIH",
        "ky": "📿 ТАСБИХ",
        "tg": "📿 ТАСБЕҲ",
        "az": "📿 TƏSBIH",
        "zh": "📿 赞念",
        "ku": "📿 TESBÎH",
        "ur": "📿 تسبیح",
        "fa": "📿 تسبیح",
        "id": "📿 TASBIH",
        "ms": "📿 TASBIH",
    },
    "halal": {code: "🥗 HALAL" for code in LANGUAGE_ORDER},
    "language": {
        "kk": "🌐 ТІЛ",
        "en": "🌐 LANGUAGE",
        "ar": "🌐 اللغة",
        "tr": "🌐 DIL",
        "ru": "🌐 ЯЗЫК",
        "uz": "🌐 TIL",
        "ky": "🌐 ТИЛ",
        "tg": "🌐 ЗАБОН",
        "az": "🌐 DIL",
        "zh": "🌐 语言",
        "ku": "🌐 ZIMAN",
        "ur": "🌐 زبان",
        "fa": "🌐 زبان",
        "id": "🌐 BAHASA",
        "ms": "🌐 BAHASA",
    },
    "feedback": {
        "kk": "💬 КЕРІ БАЙЛАНЫС",
        "en": "💬 FEEDBACK",
        "ar": "💬 الملاحظات",
        "tr": "💬 GERI BILDIRIM",
        "ru": "💬 ОТЗЫВ",
        "uz": "💬 FIKR",
        "ky": "💬 ПИКИР",
        "tg": "💬 ФИКР",
        "az": "💬 RƏY",
        "zh": "💬 反馈",
        "ku": "💬 FEEDBACK",
        "ur": "💬 رائے",
        "fa": "💬 بازخورد",
        "id": "💬 MASUKAN",
        "ms": "💬 MAKLUM BALAS",
    },
    "unified": {
        "kk": "🔗 БІР ДЕНЕ",
        "en": "🔗 ONE BODY",
        "ar": "🔗 جسد واحد",
        "tr": "🔗 TEK GÖVDE",
        "ru": "🔗 ЕДИНОЕ ТЕЛО",
        "uz": "🔗 BITTA TANA",
        "ky": "🔗 БИР ДЕНЕ",
        "tg": "🔗 ЯК ТАН",
        "az": "🔗 TƏK BƏDƏN",
        "zh": "🔗 一体",
        "ku": "🔗 YEK LAŞ",
        "ur": "🔗 ایک جسم",
        "fa": "🔗 یک بدن",
        "id": "🔗 SATU BADAN",
        "ms": "🔗 SATU BADAN",
    },
}

ACTION_ALIASES = {
    "quran": {"құран", "quran", "коран", "القرآن"},
    "tajwid": {"тәжуид", "tajwid", "таджвид", "араб әріптері", "арабша әріп", "التجويد"},
    "khatm": {"хатым", "хатм", "khatm", "ختم"},
    "wudu": {"дәрет", "wudu", "тахарат", "وضو"},
    "prayer": {"намаз", "prayer", "salat", "salah", "الصلاة"},
    "hajj": {
        "қажылық",
        "қажы",
        "hajj",
        "hadj",
        "хадж",
        "حج",
        "hac",
        "hec",
    },
    "hadith": {"хадис", "hadith", "حديث"},
    "ai": {"raqat ai", "ai", "рақат ai"},
    "qibla": {"құбыла", "qibla", "кибла", "قبلة"},
    "tasbih": {"тәспі", "тасбих", "tasbih", "تسبيح"},
    # Ескі онбординг / кэш: «Halal фото» — толық нормализациямен сәйкес
    "halal": {
        "halal",
        "халал",
        "حلال",
        "halal фото",
        "halal photo",
    },
    "language": {"тіл", "language", "lang", "язык", "language", "اللغة", "ziman"},
    "feedback": {"пікір", "feedback", "кері байланыс", "отзыв", "обратная связь"},
    "unified": {
        "бір дене",
        "bir dene",
        "one body",
        "единое тело",
        "jedno telo",
        "raqat body",
        "платформа бот",
    },
}

UI_TEXTS = {
    "choose_language": {
        "kk": "🌐 <b>Тілді таңдаңыз</b>\n\nБір тіл таңдалса, мәзір мен Құран/хадис ағыны сол тілге байланады.\nБатырмамен де, мәтінмен де, дауыспен де ауыстыра аласыз: <i>\"орысша\"</i>, <i>\"english\"</i>.",
        "en": "🌐 <b>Choose a language</b>\n\nOnce selected, the menu and Quran/Hadith flow will follow that language.\nYou can switch it by button, text, or voice too: <i>\"Russian\"</i>, <i>\"English\"</i>.",
        "ru": "🌐 <b>Выберите язык</b>\n\nПосле выбора меню и поток Корана/хадисов будут подстраиваться под этот язык.\nЯзык можно менять кнопкой, текстом или голосом: <i>\"русский\"</i>, <i>\"english\"</i>.",
    },
    "language_saved": {
        "kk": "🌐 Тіл сақталды: <b>{language}</b>",
        "en": "🌐 Language saved: <b>{language}</b>",
        "ru": "🌐 Язык сохранен: <b>{language}</b>",
    },
    "welcome": {
        "kk": "🌙 <b>RAQAT AI PRO</b>\n\nТіл: <b>{language}</b>\nТөмендегі бөлімдердің бірін таңдаңыз.",
        "en": "🌙 <b>RAQAT AI PRO</b>\n\nLanguage: <b>{language}</b>\nChoose one of the sections below.",
        "ru": "🌙 <b>RAQAT AI PRO</b>\n\nЯзык: <b>{language}</b>\nВыберите один из разделов ниже.",
    },
    "unified_body_connected": {
        "kk": "🔗 <b>Бір дене қосылды.</b>\n\nБот, платформа API және қолданба (JWT) бір профильге байланды. Тарих пен AI бір кестеден жүреді.",
        "en": "🔗 <b>One body connected.</b>\n\nBot, platform API and app (JWT) now share one profile. History and AI use the same account.",
        "ru": "🔗 <b>Единое тело подключено.</b>\n\nБот, API платформы и приложение (JWT) связаны с одним профилем. История и AI в одном аккаунте.",
    },
    "unified_body_disconnected": {
        "kk": "⚪ <b>Сым үзілді.</b>\n\nБоттағы JWT өшірілді; <code>/start</code> енді автоматты қайта байламайды. Қайта қосу үшін <b>«Бір дене»</b> немесе <code>/body</code>.\n\n<i>Сервердегі аккаунт сақталады.</i>",
        "en": "⚪ <b>Disconnected.</b>\n\nPlatform tokens were removed from this bot. Tap <b>One body</b> again to reconnect.\n\n<i>Your server account remains; this device stops sending Bearer to the API.</i>",
        "ru": "⚪ <b>Связь снята.</b>\n\nТокены платформы удалены из этого бота. Нажмите <b>«Единое тело»</b>, чтобы подключить снова.\n\n<i>Аккаунт на сервере сохраняется; бот на этом устройстве не шлёт Bearer в API.</i>",
    },
    "unified_body_connect_failed": {
        "kk": "❌ Платформаға қосылу сәтсіз. Интернет немесе <code>RAQAT_PLATFORM_API_BASE</code> / <code>RAQAT_BOT_LINK_SECRET</code> тексеріңіз.",
        "en": "❌ Could not link to the platform. Check network and <code>RAQAT_PLATFORM_API_BASE</code> / <code>RAQAT_BOT_LINK_SECRET</code>.",
        "ru": "❌ Не удалось связать с платформой. Проверьте сеть и <code>RAQAT_PLATFORM_API_BASE</code> / <code>RAQAT_BOT_LINK_SECRET</code>.",
    },
    "unified_body_api_not_configured": {
        "kk": "ℹ️ Платформа батырмасы бұл серверде өшірілген (<code>RAQAT_PLATFORM_API_BASE</code> немесе <code>RAQAT_BOT_LINK_SECRET</code> бос).",
        "en": "ℹ️ Platform link is disabled on this server (missing <code>RAQAT_PLATFORM_API_BASE</code> or <code>RAQAT_BOT_LINK_SECRET</code>).",
        "ru": "ℹ️ Связка с платформой отключена на этом сервере (нет <code>RAQAT_PLATFORM_API_BASE</code> или <code>RAQAT_BOT_LINK_SECRET</code>).",
    },
    "fallback_unknown": {
        "kk": "Түсінбедім.\n\nТөмендегі батырмалардың бірін таңдаңыз:",
        "en": "I didn't understand.\n\nChoose one of the buttons below:",
        "ru": "Не понял.\n\nВыберите одну из кнопок ниже:",
    },
    "quran_search_prompt": {
        "kk": "🔎 <b>Құраннан іздеу</b>\n\nІздеу сөзін жазыңыз.\nМысалы: <i>Алла, сабыр, рахмет</i>.",
        "en": "🔎 <b>Search in Quran</b>\n\nType a search word.\nExample: <i>Allah, patience, mercy</i>.",
        "ru": "🔎 <b>Поиск по Корану</b>\n\nВведите слово для поиска.\nНапример: <i>Аллах, терпение, милость</i>.",
    },
    "hadith_search_prompt": {
        "kk": "🔎 <b>Хадистен іздеу</b>\n\nТақырыпты жазыңыз.\nМысалы: <i>намаз, ораза, білім</i>.",
        "en": "🔎 <b>Search in Hadith</b>\n\nType a topic.\nExample: <i>prayer, fasting, knowledge</i>.",
        "ru": "🔎 <b>Поиск по хадисам</b>\n\nВведите тему.\nНапример: <i>намаз, пост, знание</i>.",
    },
    "empty_query": {
        "kk": "Іздеу сөзін жазыңыз.",
        "en": "Please type a search term.",
        "ru": "Введите слово для поиска.",
    },
    "no_results": {
        "kk": "Ештеңе табылмады.",
        "en": "Nothing found.",
        "ru": "Ничего не найдено.",
    },
    "translation_pending": {
        "kk": "🌐 <b>{requested}</b> тілі базаға толық толмаған. Қазір <b>{fallback}</b> нұсқа көрсетіліп тұр.",
        "en": "🌐 Full <b>{requested}</b> content is not in the database yet. Showing <b>{fallback}</b> for now.",
        "ru": "🌐 Контент на языке <b>{requested}</b> еще не полностью загружен в базу. Сейчас показывается вариант <b>{fallback}</b>.",
    },
    "choose_translation": {
        "kk": "🌐 <b>Құран мен хадис аударма тілін таңдаңыз</b>\n\nБұл бап интерфейс тілінен бөлек жұмыс істейді.",
        "en": "🌐 <b>Choose the Quran and Hadith translation language</b>\n\nThis setting works separately from the interface language.",
        "ru": "🌐 <b>Выберите язык перевода Корана и хадисов</b>\n\nЭта настройка работает отдельно от языка интерфейса.",
    },
    "translation_saved": {
        "kk": "🌐 Аударма тілі сақталды: <b>{language}</b>",
        "en": "🌐 Translation language saved: <b>{language}</b>",
        "ru": "🌐 Язык перевода сохранен: <b>{language}</b>",
    },
    "translation_follow_ui": {
        "kk": "🌐 Аударма тілі интерфейс тіліне байланды: <b>{language}</b>",
        "en": "🌐 Translation language now follows the interface language: <b>{language}</b>",
        "ru": "🌐 Язык перевода теперь следует за языком интерфейса: <b>{language}</b>",
    },
    "translation_current": {
        "kk": "Қазіргі аударма тілі: <b>{language}</b>",
        "en": "Current translation language: <b>{language}</b>",
        "ru": "Текущий язык перевода: <b>{language}</b>",
    },
    "voice_mode_on": {
        "kk": "🔊 Дауыспен жауап беру қосылды.",
        "en": "🔊 Voice replies are enabled.",
        "ru": "🔊 Голосовые ответы включены.",
    },
    "voice_mode_off": {
        "kk": "🔇 Дауыспен жауап беру өшірілді.",
        "en": "🔇 Voice replies are disabled.",
        "ru": "🔇 Голосовые ответы выключены.",
    },
}

CONTENT_LANGUAGE_NAMES = {
    "text_ar": {"kk": "Arabic", "en": "Arabic", "ru": "арабский"},
    "text_kk": {"kk": "Kazakh", "en": "Kazakh", "ru": "казахский"},
    "text_kz": {"kk": "Kazakh", "en": "Kazakh", "ru": "казахский"},
    "text_ru": {"kk": "Russian", "en": "Russian", "ru": "русский"},
    "text_en": {"kk": "English", "en": "English", "ru": "английский"},
    "text_tr": {"kk": "Turkish", "en": "Turkish", "ru": "турецкий"},
    "text_uz": {"kk": "Uzbek", "en": "Uzbek", "ru": "узбекский"},
    "text_ky": {"kk": "Kyrgyz", "en": "Kyrgyz", "ru": "кыргызский"},
    "text_tg": {"kk": "Tajik", "en": "Tajik", "ru": "таджикский"},
    "text_az": {"kk": "Azerbaijani", "en": "Azerbaijani", "ru": "азербайджанский"},
    "text_zh": {"kk": "Chinese", "en": "Chinese", "ru": "китайский"},
    "text_ku": {"kk": "Kurmanji", "en": "Kurmanji", "ru": "курманджи"},
    "text_ur": {"kk": "Urdu", "en": "Urdu", "ru": "урду"},
    "text_fa": {"kk": "Persian", "en": "Persian", "ru": "персидский"},
    "text_id": {"kk": "Indonesian", "en": "Indonesian", "ru": "индонезийский"},
    "text_ms": {"kk": "Malay", "en": "Malay", "ru": "малайский"},
    "translit": {"kk": "Транскрипция", "en": "Transliteration", "ru": "транскрипция"},
}


def ensure_user_preferences_table() -> None:
    from db.dialect_sql import table_names
    from db.get_db import is_postgresql_configured

    if is_postgresql_configured():
        with _lang_db() as conn:
            if "user_preferences" not in table_names(conn):
                conn.execute(
                    """
                    CREATE TABLE user_preferences (
                        user_id BIGINT PRIMARY KEY,
                        lang_code TEXT NOT NULL,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            rows = conn.execute(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = 'public' AND lower(table_name) = 'user_preferences'
                """
            ).fetchall()
            columns = {str(r["column_name"]).lower() for r in rows}
            for col, decl in (
                ("voice_reply_enabled", "INTEGER NOT NULL DEFAULT 1"),
                ("content_lang_code", "TEXT NULL"),
                ("onboarding_seen_at", "TIMESTAMPTZ NULL"),
                ("telegram_username", "TEXT NULL"),
                ("full_name", "TEXT NULL"),
                ("platform_token_bundle", "TEXT NULL"),
            ):
                if col not in columns:
                    conn.execute(
                        f"ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS {col} {decl}"
                    )
        return

    with _lang_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id INTEGER PRIMARY KEY,
                lang_code TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        columns = {
            row[1]
            for row in conn.execute("PRAGMA table_info(user_preferences)").fetchall()
        }
        if "voice_reply_enabled" not in columns:
            conn.execute(
                """
                ALTER TABLE user_preferences
                ADD COLUMN voice_reply_enabled INTEGER NOT NULL DEFAULT 1
                """
            )
        if "content_lang_code" not in columns:
            conn.execute(
                """
                ALTER TABLE user_preferences
                ADD COLUMN content_lang_code TEXT NULL
                """
            )
        if "onboarding_seen_at" not in columns:
            conn.execute(
                """
                ALTER TABLE user_preferences
                ADD COLUMN onboarding_seen_at TEXT NULL
                """
            )
        if "telegram_username" not in columns:
            conn.execute(
                """
                ALTER TABLE user_preferences
                ADD COLUMN telegram_username TEXT NULL
                """
            )
        if "full_name" not in columns:
            conn.execute(
                """
                ALTER TABLE user_preferences
                ADD COLUMN full_name TEXT NULL
                """
            )
        if "platform_token_bundle" not in columns:
            conn.execute(
                """
                ALTER TABLE user_preferences
                ADD COLUMN platform_token_bundle TEXT NULL
                """
            )


def ensure_user_preferences_row(user_id: int) -> None:
    """FK мақсаттары үшін user_preferences жолы бар екеніне кепілдік береді."""
    ensure_user_preferences_table()
    with _lang_db() as conn:
        _exec(
            conn,
            """
            INSERT OR IGNORE INTO user_preferences (user_id, lang_code, updated_at)
            VALUES (?, ?, datetime('now'))
            """,
            (int(user_id), DEFAULT_LANGUAGE),
        )


def normalize_lang_code(code: str | None) -> str:
    value = (code or "").strip().lower()
    return value if value in LANGUAGES else DEFAULT_LANGUAGE


def get_language_name(code: str, *, native: bool = True) -> str:
    meta = LANGUAGES.get(normalize_lang_code(code), LANGUAGES[DEFAULT_LANGUAGE])
    return meta["native"] if native else meta["english"]


def get_supported_language_codes() -> list[str]:
    return list(LANGUAGE_ORDER)


def get_user_lang(user_id: int, default: str | None = DEFAULT_LANGUAGE) -> str | None:
    cached = USER_LANG.get(user_id)
    if cached in LANGUAGES:
        return cached

    ensure_user_preferences_table()
    with _lang_db() as conn:
        row = _exec(
            conn,
            """
            SELECT lang_code
            FROM user_preferences
            WHERE user_id = ?
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()

    if row and row["lang_code"] in LANGUAGES:
        USER_LANG[user_id] = row["lang_code"]
        return row["lang_code"]

    if default is None:
        return None

    USER_LANG[user_id] = normalize_lang_code(default)
    return USER_LANG.get(user_id)


def get_user_content_lang_preference(user_id: int) -> str | None:
    cached = USER_CONTENT_LANG.get(user_id, None)
    if cached == FOLLOW_UI_SENTINEL:
        return None
    if cached in LANGUAGES:
        return cached

    ensure_user_preferences_table()
    with _lang_db() as conn:
        row = _exec(
            conn,
            """
            SELECT content_lang_code
            FROM user_preferences
            WHERE user_id = ?
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()

    value = (row["content_lang_code"] if row else None) if row is not None else None
    if value in LANGUAGES:
        USER_CONTENT_LANG[user_id] = value
        return value

    USER_CONTENT_LANG[user_id] = FOLLOW_UI_SENTINEL
    return None


def get_user_content_lang(user_id: int, default: str | None = None) -> str:
    preferred = get_user_content_lang_preference(user_id)
    if preferred in LANGUAGES:
        return preferred

    fallback = default if default in LANGUAGES else get_user_lang(user_id, default=DEFAULT_LANGUAGE)
    return normalize_lang_code(fallback)


def set_user_lang(user_id: int, code: str) -> str:
    lang = normalize_lang_code(code)
    ensure_user_preferences_table()
    with _lang_db() as conn:
        _exec(
            conn,
            """
            INSERT INTO user_preferences (user_id, lang_code, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                lang_code = excluded.lang_code,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, lang),
        )
    USER_LANG[user_id] = lang
    return lang


def set_user_content_lang(user_id: int, code: str | None) -> str | None:
    lang = normalize_lang_code(code) if code else None
    ensure_user_preferences_table()
    current_lang = get_user_lang(user_id, default=DEFAULT_LANGUAGE) or DEFAULT_LANGUAGE
    with _lang_db() as conn:
        _exec(
            conn,
            """
            INSERT INTO user_preferences (user_id, lang_code, content_lang_code, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                lang_code = COALESCE(user_preferences.lang_code, excluded.lang_code),
                content_lang_code = excluded.content_lang_code,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, current_lang, lang),
        )

    USER_CONTENT_LANG[user_id] = lang or FOLLOW_UI_SENTINEL
    return lang


def has_seen_onboarding(user_id: int) -> bool:
    ensure_user_preferences_table()
    with _lang_db() as conn:
        row = _exec(
            conn,
            """
            SELECT onboarding_seen_at
            FROM user_preferences
            WHERE user_id = ?
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()
    return bool(row and row["onboarding_seen_at"])


def mark_onboarding_seen(user_id: int) -> None:
    ensure_user_preferences_table()
    current_lang = get_user_lang(user_id, default=DEFAULT_LANGUAGE) or DEFAULT_LANGUAGE
    with _lang_db() as conn:
        _exec(
            conn,
            """
            INSERT INTO user_preferences (user_id, lang_code, onboarding_seen_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                lang_code = COALESCE(user_preferences.lang_code, excluded.lang_code),
                onboarding_seen_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, current_lang),
        )


def platform_link_paused(user_id: int) -> bool:
    """Пайдаланушы «Бір дене» арқылы үзген: /start JWT қайта алмайды."""
    b = get_platform_token_bundle(user_id)
    return bool(b and b.get("_paused") is True)


def set_platform_link_paused(user_id: int) -> None:
    """JWT жойылды; /start автолинк тоқтайды — тек «Бір дене» қайта қосады."""
    set_platform_token_bundle(user_id, {"_paused": True})


def clear_platform_token_bundle(user_id: int) -> None:
    """Боттағы JWT пакетін толық өшіру (NULL). Тесттер / әкімші сценарийлері үшін."""
    ensure_user_preferences_table()
    current_lang = get_user_lang(user_id, default=DEFAULT_LANGUAGE) or DEFAULT_LANGUAGE
    with _lang_db() as conn:
        _exec(
            conn,
            """
            INSERT INTO user_preferences (user_id, lang_code, platform_token_bundle, updated_at)
            VALUES (?, ?, NULL, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                platform_token_bundle = NULL,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, current_lang),
        )


def set_platform_token_bundle(user_id: int, bundle: dict) -> None:
    """JWT жауабы (access/refresh) — серверде сақталады; API Bearer үшін `get_platform_token_bundle`."""
    import json

    ensure_user_preferences_table()
    raw = json.dumps(bundle, separators=(",", ":"))
    current_lang = get_user_lang(user_id, default=DEFAULT_LANGUAGE) or DEFAULT_LANGUAGE
    with _lang_db() as conn:
        _exec(
            conn,
            """
            INSERT INTO user_preferences (user_id, lang_code, platform_token_bundle, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                platform_token_bundle = excluded.platform_token_bundle,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, current_lang, raw),
        )


def get_platform_token_bundle(user_id: int) -> dict | None:
    import json

    ensure_user_preferences_table()
    with _lang_db() as conn:
        row = _exec(
            conn,
            """
            SELECT platform_token_bundle
            FROM user_preferences
            WHERE user_id = ?
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()
    if not row:
        return None
    val = row["platform_token_bundle"]
    if not val:
        return None
    try:
        return json.loads(str(val))
    except Exception:
        return None


def get_user_voice_reply_enabled(user_id: int, default: bool = True) -> bool:
    ensure_user_preferences_table()
    with _lang_db() as conn:
        row = _exec(
            conn,
            """
            SELECT voice_reply_enabled
            FROM user_preferences
            WHERE user_id = ?
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()

    if row is None or row["voice_reply_enabled"] is None:
        return bool(default)
    return bool(int(row["voice_reply_enabled"]))


def set_user_voice_reply_enabled(user_id: int, enabled: bool) -> bool:
    ensure_user_preferences_table()
    current_lang = get_user_lang(user_id, default=DEFAULT_LANGUAGE) or DEFAULT_LANGUAGE
    with _lang_db() as conn:
        _exec(
            conn,
            """
            INSERT INTO user_preferences (user_id, lang_code, voice_reply_enabled, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                lang_code = COALESCE(user_preferences.lang_code, excluded.lang_code),
                voice_reply_enabled = excluded.voice_reply_enabled,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, current_lang, int(bool(enabled))),
        )
    return bool(enabled)


def tr(key: str, lang: str, **kwargs) -> str:
    lang = normalize_lang_code(lang)
    bucket = UI_TEXTS.get(key, {})
    template = bucket.get(lang) or bucket.get("en") or bucket.get("kk") or key
    return template.format(**kwargs)


def menu_label(action: str, lang: str) -> str:
    lang = normalize_lang_code(lang)
    labels = MENU_LABELS.get(action, {})
    return labels.get(lang) or labels.get("en") or action.upper()


def _normalize_text(text: str) -> str:
    lowered = (text or "").lower().replace("ё", "е")
    lowered = re.sub(r"[^\w\s]+", " ", lowered, flags=re.UNICODE)
    return " ".join(lowered.split())


def menu_text_matches(text: str | None, action: str) -> bool:
    normalized = _normalize_text(text or "")
    if not normalized:
        return False

    for code in LANGUAGE_ORDER:
        if _normalize_text(menu_label(action, code)) == normalized:
            return True

    return normalized in {_normalize_text(item) for item in ACTION_ALIASES.get(action, set())}


def preferred_quran_columns(lang: str) -> list[str]:
    lang = normalize_lang_code(lang)
    if lang == "kk":
        return ["text_kk", "text_kz"]
    if lang in {"ky", "uz", "tg", "az", "tr"}:
        return [f"text_{lang}", "text_kk"]
    if lang == "ru":
        return ["text_ru", "text_en"]
    if lang == "ar":
        return ["text_ar"]
    return [f"text_{lang}", "text_en"]


def preferred_hadith_columns(lang: str) -> list[str]:
    lang = normalize_lang_code(lang)
    if lang == "kk":
        return ["text_kk", "text_kz", "text_en"]
    if lang == "ru":
        return ["text_ru", "text_en"]
    if lang == "ar":
        return ["text_ar", "text_en"]
    return [f"text_{lang}", "text_en", "text_ar"]


def content_language_name(column: str | None, ui_lang: str | None = None) -> str:
    if not column:
        lang = normalize_lang_code(ui_lang)
        if lang == "ru":
            return "оригинал"
        return "Original"
    names = CONTENT_LANGUAGE_NAMES.get(column, column)
    if isinstance(names, dict):
        lang = normalize_lang_code(ui_lang)
        return names.get(lang) or names.get("en") or column
    return names


def translation_notice(lang: str, actual_column: str | None, requested_lang: str | None = None) -> str:
    requested_code = normalize_lang_code(requested_lang or lang)
    requested_name = get_language_name(requested_code, native=True)
    fallback_name = content_language_name(actual_column, lang)

    requested_col = f"text_{requested_code}"
    if requested_code == "kk":
        requested_col = "text_kk"
    if requested_code == "ar":
        requested_col = "text_ar"

    if actual_column == requested_col:
        return ""

    if requested_code == "kk" and actual_column == "text_kz":
        return ""

    return tr(
        "translation_pending",
        lang,
        requested=requested_name,
        fallback=fallback_name,
    )
