# -*- coding: utf-8 -*-
import re
from html import escape

from aiogram import types
from aiogram.exceptions import TelegramBadRequest
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config.settings import DB_PATH, RAQAT_BOT_API_ONLY
from db.connection import db_conn
from db.dialect_sql import execute as _exec
from db.get_db import is_postgresql_configured
from db.hadith_repeat import hadith_unique_only_sql_suffix
from db.hadith_repo import resolve_hadith_text_choice
from services.language_service import (
    _lang_db,
    get_language_name,
    get_user_content_lang,
    get_user_lang,
    tr,
    translation_notice,
)
from services.ops_service import log_event
from services.text_cleanup import clean_text_content
from services.platform_content_service import fetch_hadith_random, fetch_hadith_search
from state.memory import USER_STATE

STRICT_SAHIH_SOURCES = {
    "Sahih al-Bukhari",
    "Sahih Muslim",
}

# Негізгі «сахих» бөлімі: тек кітап тұтастай сахих болып саналатын екі жинақ
SAHIH_SOURCE_META = [
    {
        "slug": "bukhari",
        "title": "Сахих әл-Бұхари",
        "source": "Sahih al-Bukhari",
        "strict_book": True,
    },
    {
        "slug": "muslim",
        "title": "Сахих Муслим",
        "source": "Sahih Muslim",
        "strict_book": True,
    },
]

# Басқа жинақтар: сахих емес (немесе дәрежесі басқа) риуаяттар — тек осы бөлімнен
OTHER_SOURCE_META = [
    {
        "slug": "abudawud",
        "title": "Сунан Әбу Дәуд",
        "source": "Sunan Abi Dawud",
    },
    {
        "slug": "tirmidhi",
        "title": "Жәмиғ әт-Тирмизи",
        "source": "Jami` at-Tirmidhi",
    },
    {
        "slug": "nasai",
        "title": "Сунан ан-Нәсаи",
        "source": "Sunan an-Nasa'i",
    },
    {
        "slug": "ibnmajah",
        "title": "Сунан Ибн Мәжа",
        "source": "Sunan Ibn Majah",
    },
]


def _safe(text: str) -> str:
    return escape(clean_text_content(text), quote=False)


def _source_map(mode: str) -> dict[str, dict]:
    items = SAHIH_SOURCE_META if mode == "s" else OTHER_SOURCE_META
    return {item["slug"]: item for item in items}


def _normalize_grade(grade: str) -> str:
    return (grade or "").strip().lower().replace("’", "'")


def _is_sahih_row(row) -> bool:
    """Тек Сахих Бұхари және Сахих Муслим — іздеудегі «сахих» санаты."""
    source = (row["source"] or "").strip()
    return source in STRICT_SAHIH_SOURCES


def _search_prompt_text(lang: str) -> str:
    if lang == "kk":
        return (
            "🔎 <b>Хадистен тақырып бойынша іздеу</b>\n\n"
            "Тақырыпты жазыңыз.\n"
            "Мысалы: <i>намаз, ораза, зекет, ата-ана, білім</i>.\n\n"
            "Алдымен <b>Сахих Бұхари және Сахих Муслим</b>, содан кейін (болса) "
            "басқа жинақтар — <b>ескертумен</b>."
        )
    return tr("hadith_search_prompt", lang)


def _menu_text(mode: str, lang: str) -> str:
    if lang == "ru":
        if mode == "o":
            return (
                "📁 <b>Другие сборники хадисов</b>\n\n"
                "В этом разделе показаны риваяты вне строгого ядра Сахих аль-Бухари/Муслим."
            )
        return (
            "📚 <b>Достоверные хадисы</b>\n\n"
            "В этом разделе в приоритете <b>Сахих аль-Бухари</b> и <b>Сахих Муслим</b>."
        )

    if lang != "kk":
        if mode == "o":
            return (
                "📁 <b>Other Hadith Collections</b>\n\n"
                "This section contains narrations outside the strict Sahih Bukhari/Muslim core."
            )
        return (
            "📚 <b>Sahih Hadith</b>\n\n"
            "This section prioritizes <b>Sahih al-Bukhari</b> and <b>Sahih Muslim</b>."
        )

    if mode == "o":
        return (
            "📁 <b>Басқа хадистер</b>\n\n"
            "Мұнда Сунан жинақтарындағы <b>сахих емес</b> (немесе дәрежесі өзгеше) риуаяттар көрсетіледі.\n\n"
            "⚠️ <b>Ескерту:</b> осы риуаяттармен <b>фәтуа немесе шариғи үкім шығаруға болмайды</b>. "
            "Негізгі үкім үшін сахих Бұхари/Муслим бөлімін қолданыңыз."
        )

    return (
        "📚 <b>Сахих хадистер</b>\n\n"
        "Тек <b>Сахих әл-Бұхари</b> және <b>Сахих Муслим</b> жинақтары — "
        "осы екі кітаптың риуаяттары сахих деп танылған негізгі дереккөз ретінде беріледі.\n\n"
        "Сунан Әбу Дәуд, Тирмизи, Нәсаи, Ибн Мәжа — <b>«Басқа хадистер»</b> бөлімінде."
    )


def _menu_markup(mode: str, lang: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    items = SAHIH_SOURCE_META if mode == "s" else OTHER_SOURCE_META

    for item in items:
        builder.button(
            text=item["title"],
            callback_data=f"hadith:src:{mode}:{item['slug']}",
        )

    builder.button(
        text="🔎 Тақырып іздеу" if lang == "kk" else "🔎 Поиск по теме" if lang == "ru" else "🔎 Search Topic",
        callback_data="hadith:search",
    )
    builder.button(
        text="🌐 Аударма" if lang == "kk" else "🌐 Перевод" if lang == "ru" else "🌐 Translation",
        callback_data="translate:open",
    )
    if mode == "s":
        builder.button(
            text="📁 Басқа хадистер" if lang == "kk" else "📁 Другие хадисы" if lang == "ru" else "📁 Other Hadith",
            callback_data="hadith:menu:o",
        )
    else:
        builder.button(
            text="⬅️ Сахих (Бұхари/Муслим)" if lang == "kk" else "⬅️ Сахих (Бухари/Муслим)" if lang == "ru" else "⬅️ Sahih (Bukhari/Muslim)",
            callback_data="hadith:menu:s",
        )

    if mode == "s":
        builder.adjust(2, 2, 1)
    else:
        builder.adjust(2, 2, 2, 1)
    return builder.as_markup()


def _item_markup(mode: str, slug: str, lang: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(
        text="🔄 Келесі" if lang == "kk" else "🔄 Следующий" if lang == "ru" else "🔄 Next",
        callback_data=f"hadith:next:{mode}:{slug}",
    )
    builder.button(text="🔎 Іздеу" if lang == "kk" else "🔎 Поиск" if lang == "ru" else "🔎 Search", callback_data="hadith:search")
    builder.button(text="🌐 Аударма" if lang == "kk" else "🌐 Перевод" if lang == "ru" else "🌐 Translation", callback_data="translate:open")
    builder.button(text="⬅️ Артқа" if lang == "kk" else "⬅️ Назад" if lang == "ru" else "⬅️ Back", callback_data=f"hadith:menu:{mode}")
    builder.adjust(2, 2)
    return builder.as_markup()


def _search_result_markup(lang: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="🔎 Қайта іздеу" if lang == "kk" else "🔎 Искать снова" if lang == "ru" else "🔎 Search Again", callback_data="hadith:search")
    builder.button(text="⬅️ Хадис мәзірі" if lang == "kk" else "⬅️ Меню хадисов" if lang == "ru" else "⬅️ Hadith Menu", callback_data="hadith:menu:s")
    builder.button(text="🌐 Аударма" if lang == "kk" else "🌐 Перевод" if lang == "ru" else "🌐 Translation", callback_data="translate:open")
    builder.adjust(2, 1)
    return builder.as_markup()


def _get_random_hadith(mode: str, slug: str, content_lang: str):
    meta = _source_map(mode).get(slug)
    if not meta:
        return None

    source = meta["source"]
    choice = resolve_hadith_text_choice(content_lang)
    text_column = choice["actual"] or "text_en"
    params = [source]

    if mode == "s":
        if meta.get("strict_book"):
            where_clause = "source = ?"
        else:
            where_clause = "source = ? AND lower(COALESCE(grade, '')) LIKE '%sahih%'"
    else:
        where_clause = "source = ? AND lower(COALESCE(grade, '')) NOT LIKE '%sahih%'"

    if RAQAT_BOT_API_ONLY:
        row, _ = fetch_hadith_random(
            source,
            strict_sahih=bool(mode == "s" and not meta.get("strict_book")),
            lang=content_lang,
            unique=True,
        )
        return row

    with db_conn(DB_PATH) as conn:
        w = where_clause + hadith_unique_only_sql_suffix(conn)
        return conn.execute(
            f"""
            SELECT source, text_ar, {text_column} AS text_tr, grade
            FROM hadith
            WHERE {w}
            ORDER BY RANDOM()
            LIMIT 1
            """,
            params,
        ).fetchone()


def _get_random_hadith_sqlite(mode: str, slug: str, content_lang: str):
    """RAQAT_BOT_API_ONLY қосулы болса да, локал DB-дан резервтік оқу."""
    meta = _source_map(mode).get(slug)
    if not meta:
        return None
    source = meta["source"]
    choice = resolve_hadith_text_choice(content_lang)
    text_column = choice["actual"] or "text_en"
    params = [source]
    if mode == "s":
        where_clause = "source = ?"
    else:
        where_clause = "source = ? AND lower(COALESCE(grade, '')) NOT LIKE '%sahih%'"

    with db_conn(DB_PATH) as conn:
        w = where_clause + hadith_unique_only_sql_suffix(conn)
        return conn.execute(
            f"""
            SELECT source, text_ar, {text_column} AS text_tr, grade
            FROM hadith
            WHERE {w}
            ORDER BY RANDOM()
            LIMIT 1
            """,
            params,
        ).fetchone()


def _enrich_api_hadith_rows_with_sqlite(rows: list[dict], content_lang: str) -> list[dict]:
    """
    API-дан келген жолда аударма бос болса, локал DB-дан дәл сол (source + text_ar) жолын толтырады.
    Бұл Бухари/Муслим толық шығуын тұрақтандырады.
    """
    if not rows:
        return rows
    choice = resolve_hadith_text_choice(content_lang)
    text_column = choice["actual"] or "text_en"
    if text_column != "text_kk":
        return rows

    need = []
    for i, row in enumerate(rows):
        text_tr = (row.get("text_tr") or "").strip()
        if not text_tr and (row.get("text_ar") or "").strip():
            need.append((i, (row.get("source") or "").strip(), (row.get("text_ar") or "").strip()))
    if not need:
        return rows

    with db_conn(DB_PATH) as conn:
        for idx, source, text_ar in need:
            found = conn.execute(
                """
                SELECT text_kk
                FROM hadith
                WHERE source = ? AND text_ar = ? AND TRIM(COALESCE(text_kk, '')) <> ''
                LIMIT 1
                """,
                (source, text_ar),
            ).fetchone()
            if found and found["text_kk"]:
                rows[idx]["text_tr"] = found["text_kk"]
    return rows


def _format_hadith(row, mode: str, title: str, lang: str, content_lang: str) -> str:
    if not row:
        if mode == "s":
            return (
                "Бұл бөлімнен хадис табылмады."
                if lang == "kk"
                else "В этом разделе хадис не найден."
                if lang == "ru"
                else "No hadith found in this section."
            )
        return (
            "Бұл жинақта бөлек көрсетілетін сахих емес хадис табылмады.\n"
            "Негізгі сахих бөлімін қолданыңыз."
            if lang == "kk"
            else "В этом сборнике не найден подходящий риваят вне основного сахих-раздела."
            if lang == "ru"
            else "No matching non-core narration found in this collection."
        )

    parts = [f"📚 <b>{_safe(title)}</b>"]

    if mode == "s":
        parts.append("✅ <b>Сахих бөлім</b>" if lang == "kk" else "✅ <b>Раздел сахих</b>" if lang == "ru" else "✅ <b>Sahih Section</b>")
    else:
        parts.append(
            (
                "⚠️ <b>Ескерту</b>\n"
                "Бұл риуаят негізгі сахих бөлімінде емес. "
                "Онымен фәтуа не нақты үкім шығаруға болмайды."
            )
            if lang == "kk"
            else (
                "⚠️ <b>Предупреждение</b>\n"
                "Этот риваят не относится к основному разделу сахих. "
                "На его основе нельзя выносить фетву или точное шариатское решение."
            )
            if lang == "ru"
            else (
                "⚠️ <b>Warning</b>\n"
                "This narration is outside the main sahih section. "
                "It should not be used alone for fatwa or final rulings."
            )
        )

    text_ar = _safe(row["text_ar"] or "")
    text_tr = _safe(row["text_tr"] or "")
    grade = _safe(row["grade"] or "")

    if text_ar:
        parts.append(f"🇸🇦 <code>{text_ar}</code>")

    notice = translation_notice(
        lang,
        resolve_hadith_text_choice(content_lang)["actual"],
        requested_lang=content_lang,
    )
    if notice:
        parts.append(notice)
    if text_tr:
        parts.append(f"🌐 {text_tr}")

    if grade:
        parts.append(f"⭐ {grade}")
    elif mode == "s":
        parts.append("⭐ Сахих жинақтан алынды" if lang == "kk" else "⭐ Из сахих-сборника" if lang == "ru" else "⭐ Taken from a sahih collection")

    return "\n\n".join(parts)


def _build_search_terms(query: str) -> list[str]:
    raw_terms = re.findall(r"[\w']+", (query or "").lower(), flags=re.UNICODE)
    filtered = [term for term in raw_terms if len(term) >= 2]
    return filtered[:5] or [query.strip().lower()]


def _fts_quote_phrase(term: str) -> str:
    """FTS5 MATCH ішіндегі сөзді қос тырнаққа алу үшін қауіпсіздендіру."""
    t = (term or "").strip()
    if not t:
        return ""
    t = re.sub(r'[\s"\'`]+', " ", t)
    t = t.replace('"', '""')
    return t.strip()


def _fts_terms_for_match(terms: list[str]) -> list[str]:
    out = []
    for term in terms:
        q = _fts_quote_phrase(term)
        if len(q) >= 2:
            out.append(q)
    return out[:5]


def _search_rank(row) -> tuple[int, int]:
    source = (row["source"] or "").strip()
    grade = _normalize_grade(row["grade"] or "")

    if source == "Sahih al-Bukhari":
        return (0, 0)
    if source == "Sahih Muslim":
        return (0, 1)
    if "sahih" in grade:
        return (1, 0)
    if "hasan" in grade:
        return (2, 0)
    return (3, 0)


def _search_hadith_rows(query: str, content_lang: str):
    if RAQAT_BOT_API_ONLY:
        rows = fetch_hadith_search(query, lang=content_lang, limit=60, unique=True)
        if rows is None:
            return [], [], True
        rows = _enrich_api_hadith_rows_with_sqlite(rows, content_lang)
        ranked = sorted(rows, key=_search_rank)
        sahih_rows = [row for row in ranked if _is_sahih_row(row)]
        other_rows = [row for row in ranked if not _is_sahih_row(row)]
        return sahih_rows, other_rows, False

    terms = _build_search_terms(query)
    fts_terms = _fts_terms_for_match(terms)
    choice = resolve_hadith_text_choice(content_lang)
    text_column = choice["actual"] or "text_en"

    rows = []

    if is_postgresql_configured():
        with _lang_db() as conn:
            if terms:
                where = " AND ".join(
                    [
                        f"""
                        lower(
                            COALESCE({text_column}, '') || ' ' ||
                            COALESCE(text_en, '') || ' ' ||
                            COALESCE(text_ar, '')
                        ) LIKE ?
                        """
                    ]
                    * len(terms)
                )
                where += hadith_unique_only_sql_suffix(conn)
                params = [f"%{term}%" for term in terms]
                rows = _exec(
                    conn,
                    f"""
                    SELECT source, text_ar, {text_column} AS text_tr, grade
                    FROM hadith
                    WHERE {where}
                    LIMIT 60
                    """,
                    params,
                ).fetchall()
    else:
        with db_conn(DB_PATH) as conn:
            has_fts = int(
                conn.execute(
                    """
                    SELECT COUNT(*)
                    FROM sqlite_master
                    WHERE type='table' AND name='hadith_fts'
                    """
                ).fetchone()[0]
            )

            uq = hadith_unique_only_sql_suffix(conn)
            uq_h = hadith_unique_only_sql_suffix(conn, "h")
            if has_fts and fts_terms:
                fts_query = " AND ".join(
                    f'({text_column}:"{t}" OR text_en:"{t}" OR text_ar:"{t}")'
                    for t in fts_terms
                )
                try:
                    rows = conn.execute(
                        f"""
                        SELECT h.source, h.text_ar, h.{text_column} AS text_tr, h.grade
                        FROM hadith_fts f
                        INNER JOIN hadith h ON h.id = f.hadith_id
                        WHERE f MATCH ?{uq_h}
                        ORDER BY bm25(f)
                        LIMIT 60
                        """,
                        (fts_query,),
                    ).fetchall()
                except Exception:
                    rows = []

            if not rows and terms:
                where = " AND ".join(
                    [
                        f"""
                        lower(
                            COALESCE({text_column}, '') || ' ' ||
                            COALESCE(text_en, '') || ' ' ||
                            COALESCE(text_ar, '')
                        ) LIKE ?
                        """
                    ]
                    * len(terms)
                )
                where += uq
                params = [f"%{term}%" for term in terms]
                rows = conn.execute(
                    f"""
                    SELECT source, text_ar, {text_column} AS text_tr, grade
                    FROM hadith
                    WHERE {where}
                    LIMIT 60
                    """,
                    params,
                ).fetchall()

    ranked = sorted(rows, key=_search_rank)
    sahih_rows = [row for row in ranked if _is_sahih_row(row)]
    other_rows = [row for row in ranked if not _is_sahih_row(row)]
    return sahih_rows, other_rows, False


def _api_unavailable_text(lang: str) -> str:
    if lang == "kk":
        return "⚠️ Контент API уақытша қолжетімсіз. Сәл кейін қайта көріңіз."
    if lang == "ru":
        return "⚠️ Контент API временно недоступен. Попробуйте чуть позже."
    return "⚠️ Content API is temporarily unavailable. Please try again later."


def _excerpt(text: str, query: str, width: int = 320) -> str:
    cleaned = " ".join((text or "").split())
    if len(cleaned) <= width:
        return cleaned

    lower = cleaned.lower()
    terms = _build_search_terms(query)
    position = -1
    match_term = ""

    for term in [query.lower(), *terms]:
        if not term:
            continue
        position = lower.find(term)
        if position >= 0:
            match_term = term
            break

    if position < 0:
        return cleaned[:width].rstrip() + "..."

    term_len = len(match_term) or 1
    start = max(0, position - width // 3)
    end = min(len(cleaned), position + term_len + (width // 2))
    snippet = cleaned[start:end].strip()

    if start > 0:
        snippet = "..." + snippet
    if end < len(cleaned):
        snippet = snippet + "..."

    return snippet


def _format_search_result_item(row, prefix: str, query: str) -> str:
    source = _safe(row["source"] or "Hadith")
    grade = _safe(row["grade"] or "")
    text = _safe(_excerpt(row["text_tr"] or row["text_ar"] or "", query))

    parts = [f"{prefix} <b>{source}</b>"]
    if grade:
        parts.append(f"⭐ {grade}")
    if text:
        parts.append(text)
    return "\n".join(parts)


def _format_search_results(query: str, sahih_rows, other_rows, lang: str) -> str:
    parts = [
        f"🔎 <b>{'Нәтиже' if lang == 'kk' else 'Результаты' if lang == 'ru' else 'Results'}</b>: {_safe(query)}"
    ]

    if sahih_rows:
        parts.append(
            "✅ <b>Сахих (тек Бұхари / Муслим)</b>"
            if lang == "kk"
            else "✅ <b>Сахих (только Бухари / Муслим)</b>"
            if lang == "ru"
            else "✅ <b>Sahih (Bukhari / Muslim only)</b>"
        )
        for row in sahih_rows[:2]:
            parts.append(_format_search_result_item(row, "•", query))
        if len(sahih_rows) > 2:
            parts.append(
                f"Тағы <b>{len(sahih_rows) - 2}</b> сәйкестік бар."
                if lang == "kk"
                else f"Есть еще <b>{len(sahih_rows) - 2}</b> совпадений."
                if lang == "ru"
                else f"There are <b>{len(sahih_rows) - 2}</b> more matches."
            )
    else:
        parts.append(
            "✅ <b>Сахих Бұхари/Муслим</b> бойынша дәл сәйкестік табылмады."
            if lang == "kk"
            else "✅ Точного совпадения по <b>Сахих Бухари/Муслим</b> не найдено."
            if lang == "ru"
            else "✅ No exact match was found in <b>Sahih Bukhari/Muslim</b>."
        )

    if other_rows:
        parts.append(
            (
                "⚠️ <b>Басқа жинақтардан риуаят</b> (сахих емес ретінде көрсетіледі)\n"
                "Мұнымен <b>фәтуа немесе шариғи үкім шығаруға болмайды</b>. "
                "Тек ақпарат ретінде қараңыз."
            )
            if lang == "kk"
            else (
                "⚠️ <b>Риваят из других сборников</b> (показывается вне строгого сахих-ядра)\n"
                "На его основе <b>нельзя выносить фетву или шариатское решение</b>. "
                "Смотрите только как справочную информацию."
            )
            if lang == "ru"
            else (
                "⚠️ <b>Narration from other collections</b> (outside the strict sahih core)\n"
                "It should <b>not</b> be used for fatwa or final rulings. Treat it as informational only."
            )
        )
        for row in other_rows[:2]:
            parts.append(_format_search_result_item(row, "•", query))
        if len(other_rows) > 2:
            parts.append(
                f"Тағы <b>{len(other_rows) - 2}</b> жазба бар."
                if lang == "kk"
                else f"Есть еще <b>{len(other_rows) - 2}</b> записей."
                if lang == "ru"
                else f"There are <b>{len(other_rows) - 2}</b> more records."
            )

    if not sahih_rows and not other_rows:
        parts.append(tr("no_results", lang))

    return "\n\n".join(parts)


async def hadith_show(message: types.Message):
    lang = get_user_lang(message.from_user.id)
    content_lang = get_user_content_lang(message.from_user.id, default=lang)
    log_event(message.from_user.id, "open_hadith")
    USER_STATE[message.from_user.id] = None
    await message.answer(
        _menu_text("s", lang) + "\n\n" + tr("translation_current", lang, language=get_language_name(content_lang)),
        reply_markup=_menu_markup("s", lang),
    )


async def hadith_search_router(message: types.Message):
    uid = message.from_user.id
    if USER_STATE.get(uid) != "hadith_search":
        return

    await send_hadith_search_results(message, (message.text or "").strip())
    USER_STATE[uid] = None


async def send_hadith_search_results(message: types.Message, query: str) -> None:
    uid = message.from_user.id
    lang = get_user_lang(uid)
    if not query:
        await message.answer(tr("empty_query", lang))
        return

    log_event(uid, "hadith_search", detail=query[:120])
    content_lang = get_user_content_lang(uid, default=lang)
    sahih_rows, other_rows, api_failed = _search_hadith_rows(query, content_lang)
    if api_failed:
        await message.answer(_api_unavailable_text(lang), reply_markup=_search_result_markup(lang))
        return
    await message.answer(
        _format_search_results(query, sahih_rows, other_rows, lang),
        reply_markup=_search_result_markup(lang),
    )


async def hadith_callback(callback: types.CallbackQuery):
    parts = (callback.data or "").split(":")
    if len(parts) < 2:
        await callback.answer()
        return

    _, action, *rest = parts

    if action == "search":
        USER_STATE[callback.from_user.id] = "hadith_search"
        log_event(callback.from_user.id, "hadith_search_open")
        lang = get_user_lang(callback.from_user.id)
        await callback.message.answer(_search_prompt_text(lang))
        await callback.answer()
        return

    if action == "menu":
        mode = rest[0] if rest else "s"
        lang = get_user_lang(callback.from_user.id)
        content_lang = get_user_content_lang(callback.from_user.id, default=lang)
        USER_STATE[callback.from_user.id] = None
        try:
            await callback.message.edit_text(
                _menu_text(mode, lang) + "\n\n" + tr("translation_current", lang, language=get_language_name(content_lang)),
                reply_markup=_menu_markup(mode, lang),
            )
        except TelegramBadRequest:
            await callback.message.answer(
                _menu_text(mode, lang) + "\n\n" + tr("translation_current", lang, language=get_language_name(content_lang)),
                reply_markup=_menu_markup(mode, lang),
            )
        await callback.answer()
        return

    if len(rest) < 2:
        await callback.answer("Бөлім табылмады" if get_user_lang(callback.from_user.id) == "kk" else "Раздел не найден" if get_user_lang(callback.from_user.id) == "ru" else "Section not found")
        return

    mode, slug = rest[0], rest[1]
    meta = _source_map(mode).get(slug)
    if not meta:
        await callback.answer("Бөлім табылмады" if get_user_lang(callback.from_user.id) == "kk" else "Раздел не найден" if get_user_lang(callback.from_user.id) == "ru" else "Section not found")
        return

    lang = get_user_lang(callback.from_user.id)
    content_lang = get_user_content_lang(callback.from_user.id, default=lang)
    USER_STATE[callback.from_user.id] = None
    if RAQAT_BOT_API_ONLY:
        source = meta["source"]
        row, error = fetch_hadith_random(
            source,
            strict_sahih=bool(mode == "s" and not meta.get("strict_book")),
            lang=content_lang,
        )
        if error == "unavailable":
            row = _get_random_hadith_sqlite(mode, slug, content_lang)
            if row is None:
                await callback.message.answer(_api_unavailable_text(lang), reply_markup=_menu_markup(mode, lang))
                await callback.answer()
                return
            row = dict(row)
        if row and not ((row.get("text_tr") if isinstance(row, dict) else row["text_tr"]) or "").strip() and content_lang == "kk":
            backup = _get_random_hadith_sqlite(mode, slug, content_lang)
            if backup:
                row = dict(backup)
        if error == "unavailable" and row is None:
            await callback.message.answer(_api_unavailable_text(lang), reply_markup=_menu_markup(mode, lang))
            await callback.answer()
            return
    else:
        row = _get_random_hadith(mode, slug, content_lang)
    text = _format_hadith(row, mode, meta["title"], lang, content_lang)
    markup = _item_markup(mode, slug, lang)

    try:
        await callback.message.edit_text(text, reply_markup=markup)
    except TelegramBadRequest:
        await callback.message.answer(text, reply_markup=markup)

    await callback.answer()
