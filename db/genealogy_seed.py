# -*- coding: utf-8 -*-
"""GENEALOGY-P0 catalog — қазақ үш жүз + негізгі ру/тармақ (Mashhur/Шәкәрім/NAS)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class GenealogyClanDef:
    id: str
    parent_id: str | None
    level: int
    name_kk: str
    sort_order: int
    name_kk_alt: str | None = None
    name_lat: str | None = None
    description_kk: str | None = None


# Parent rows алдымен (sort_order бойынша upsert).
GENEALOGY_P0_CLANS: list[GenealogyClanDef] = [
    # —— Жүз (L1) ——
    GenealogyClanDef(
        "uly_zhuz",
        None,
        1,
        "Ұлы жүз",
        10,
        name_lat="Uly zhuz",
        description_kk="Оңтүстік және оңтүстік-батыс Қазақстан аумағында кең таралған жүз.",
    ),
    GenealogyClanDef(
        "orta_zhuz",
        None,
        1,
        "Орта жүз",
        50,
        name_lat="Orta zhuz",
        description_kk="Оrta Қазақстан, Сарыарқа және Шығыс Қазақстанға жақын жүз.",
    ),
    GenealogyClanDef(
        "kishi_zhuz",
        None,
        1,
        "Кіші жүз",
        110,
        name_lat="Kishi zhuz",
        description_kk="Батыс Қазақстан мен Жайық-Cелеу ауданына байланысты жүз.",
    ),
    # —— Ұлы жүз (L2–L3) ——
    GenealogyClanDef("uisin", "uly_zhuz", 2, "Үйсін", 20, name_lat="Uisin",
                     description_kk="Ұлы жүздің ірі руларының бірі; Дулат осы тармақтан."),
    GenealogyClanDef("dulat", "uisin", 3, "Дулат", 30, name_lat="Dulat",
                     description_kk="Үйсін руының ірі тармағы; Оңтүстік Қазақстан мен Жетісуға кең таралған."),
    # —— Дулат L4 (Мәшһүр шежіресі) ——
    GenealogyClanDef("botbay", "dulat", 4, "Ботбай", 31, name_lat="Botbay",
                     description_kk="Дулат руының негізгі тармағы."),
    GenealogyClanDef("tobyqty", "dulat", 4, "Тобықты", 32, name_lat="Tobyqty",
                     description_kk="Дулат ішіндегі ірі тармақ."),
    GenealogyClanDef("zhelibu", "dulat", 4, "Желібі", 33, name_lat="Zhelibu",
                     description_kk="Дулат руының тармағы (Мәшһүр шежіресі)."),
    GenealogyClanDef("sholanga", "dulat", 4, "Шоланға", 34, name_lat="Sholanga",
                     description_kk="Дулат руының тармағы."),
    GenealogyClanDef("sary_uisin", "uly_zhuz", 2, "Сарыүйсін", 35, name_lat="Sary uisin",
                     description_kk="Ұлы жүз Үйсін руының тармағы."),
    GenealogyClanDef("alban", "uly_zhuz", 2, "Албан", 40, name_lat="Alban",
                     description_kk="Ұлы жүздің ірі руларының бірі."),
    # —— Албан L3 (Мәшһүр шежіресі) ——
    GenealogyClanDef("saryzhas", "alban", 3, "Сарыжас", 41, name_lat="Saryzhas",
                     description_kk="Албан руының ірі тармағы."),
    GenealogyClanDef("tana", "alban", 3, "Тана", 42, name_lat="Tana",
                     description_kk="Албан руының тармағы."),
    GenealogyClanDef("karauyl", "alban", 3, "Қарауыл", 43, name_lat="Karauyl",
                     description_kk="Албан руының тармағы (Мәшһүр шежіресі)."),
    GenealogyClanDef("suan", "uly_zhuz", 2, "Суан", 45, name_lat="Suan",
                     description_kk="Ұлы жүздің ірі руларының бірі."),
    # —— Суан L3 (Мәшһүр шежіресі) ——
    GenealogyClanDef("makshym", "suan", 3, "Макшым", 46, name_lat="Makshym",
                     description_kk="Суан руының тармағы."),
    GenealogyClanDef("kete_suan", "suan", 3, "Кете", 47, name_lat="Kete suan",
                     description_kk="Суан руының тармағы."),
    GenealogyClanDef("borik", "suan", 3, "Борық", 48, name_lat="Borik",
                     description_kk="Суан руының тармағы (Мәшһүр шежіресі)."),
    GenealogyClanDef("jalayir", "uly_zhuz", 2, "Жалайыр", 50, name_lat="Jalayir"),
    GenealogyClanDef("shapyrashty", "uly_zhuz", 2, "Шапырашты", 55, name_lat="Shapyrashty"),
    GenealogyClanDef("ysty", "uly_zhuz", 2, "Ысты", 60, name_lat="Ysty"),
    GenealogyClanDef("oshakty", "uly_zhuz", 2, "Ошақты", 65, name_lat="Oshakty"),
    # —— Орта жүз (L2–L3) ——
    GenealogyClanDef("argyn", "orta_zhuz", 2, "Арғын", 70, name_lat="Argyn",
                     description_kk="Орта жүздің ірі руларының бірі; Сарыарқа мен Шығысқа кең таралған."),
    GenealogyClanDef("karakesek", "argyn", 3, "Қаракесек", 80, name_lat="Karakesek"),
    GenealogyClanDef("kuandyk", "argyn", 3, "Қуандық", 90, name_lat="Kuandyk"),
    GenealogyClanDef("tortuyl", "argyn", 3, "Төртуыл", 100, name_lat="Tortuyl"),
    GenealogyClanDef("nayman", "orta_zhuz", 2, "Найман", 110, name_lat="Nayman",
                     description_kk="Орта жүздің ірі руларының бірі; Шәкәрім шежіресінде кең орын алады."),
    # —— Найман L3 (Шәкәрім шежіресі) ——
    GenealogyClanDef("sadyr", "nayman", 3, "Садыр", 111, name_lat="Sadyr",
                     description_kk="Найман руының ірі тармағы."),
    GenealogyClanDef("bura", "nayman", 3, "Бура", 112, name_lat="Bura",
                     description_kk="Найман руының тармағы."),
    GenealogyClanDef("karke", "nayman", 3, "Керкей", 113, name_lat="Karke",
                     description_kk="Найман руының тармағы (Шәкәрім шежіресі)."),
    GenealogyClanDef("kongrat", "orta_zhuz", 2, "Қоңырат", 120, name_lat="Kongrat",
                     description_kk="Орта жүздің ірі руларының бірі."),
    # —— Қоңырат L3 (Шәкәрім шежіресі) ——
    GenealogyClanDef("kozhaman", "kongrat", 3, "Кожаман", 121, name_lat="Kozhaman",
                     description_kk="Қоңырат руының ірі тармағы."),
    GenealogyClanDef("kobenshi", "kongrat", 3, "Көбенші", 122, name_lat="Kobenshi",
                     description_kk="Қоңырат руының тармағы."),
    GenealogyClanDef("kurak", "kongrat", 3, "Курек", 123, name_lat="Kurak",
                     description_kk="Қоңырат руының тармағы (Шәкәрім шежіресі)."),
    GenealogyClanDef("kerey", "orta_zhuz", 2, "Керей", 130, name_kk_alt="Керderi", name_lat="Kerey"),
    GenealogyClanDef("uak", "orta_zhuz", 2, "Уақ", 140, name_lat="Uak"),
    GenealogyClanDef("qypshaq", "orta_zhuz", 2, "Қыпшақ", 145, name_lat="Qypshaq"),
    # —— Кіші жүз (L2–L3) ——
    GenealogyClanDef("alshyn", "kishi_zhuz", 2, "Алшын", 150, name_lat="Alshyn"),
    GenealogyClanDef("alimuly", "alshyn", 3, "Әлімұлы", 160, name_lat="Alimuly"),
    GenealogyClanDef("tabyn", "alimuly", 4, "Табын", 165, name_lat="Tabyn",
                     description_kk="Кіші жүз Әлімұлы құрамындағы ру."),
    GenealogyClanDef("zhappas", "tabyn", 5, "Жаппас", 1651, name_lat="Zhappas",
                     description_kk="Табын руының тармағы."),
    GenealogyClanDef("kaldama", "tabyn", 5, "Қалдама", 1652, name_lat="Kaldama",
                     description_kk="Табын руының тармағы."),
    GenealogyClanDef("baimuly", "tabyn", 5, "Баймұлы", 1653, name_lat="Baimuly",
                     description_kk="Табын руының тармағы."),
    GenealogyClanDef("shekty", "alimuly", 4, "Шекті", 166, name_lat="Shekty",
                     description_kk="Кіші жүз Әлімұлы құрамындағы ру."),
    GenealogyClanDef("baiuly", "alshyn", 3, "Байұлы", 170, name_lat="Baiuly"),
]

# (clan_id, source_key, page_or_section)
DEFAULT_SOURCE_REFS: list[tuple[str, str, str | None]] = [
    ("uly_zhuz", "nas_ethnography_kz", "Жүз деңгейі"),
    ("orta_zhuz", "nas_ethnography_kz", "Жүз деңгейі"),
    ("kishi_zhuz", "nas_ethnography_kz", "Жүз деңгейі"),
    ("uisin", "mashhur_jusip_shezhire", None),
    ("dulat", "mashhur_jusip_shezhire", None),
    ("botbay", "mashhur_jusip_shezhire", None),
    ("tobyqty", "mashhur_jusip_shezhire", None),
    ("zhelibu", "mashhur_jusip_shezhire", None),
    ("sholanga", "mashhur_jusip_shezhire", None),
    ("sary_uisin", "mashhur_jusip_shezhire", None),
    ("alban", "mashhur_jusip_shezhire", None),
    ("saryzhas", "mashhur_jusip_shezhire", None),
    ("tana", "mashhur_jusip_shezhire", None),
    ("karauyl", "mashhur_jusip_shezhire", None),
    ("suan", "mashhur_jusip_shezhire", None),
    ("makshym", "mashhur_jusip_shezhire", None),
    ("kete_suan", "mashhur_jusip_shezhire", None),
    ("borik", "mashhur_jusip_shezhire", None),
    ("jalayir", "mashhur_jusip_shezhire", None),
    ("shapyrashty", "mashhur_jusip_shezhire", None),
    ("ysty", "mashhur_jusip_shezhire", None),
    ("oshakty", "mashhur_jusip_shezhire", None),
    ("argyn", "shakarim_shezhire", None),
    ("karakesek", "mashhur_jusip_shezhire", None),
    ("kuandyk", "mashhur_jusip_shezhire", None),
    ("tortuyl", "mashhur_jusip_shezhire", None),
    ("nayman", "shakarim_shezhire", None),
    ("sadyr", "shakarim_shezhire", None),
    ("bura", "shakarim_shezhire", None),
    ("karke", "shakarim_shezhire", None),
    ("kongrat", "shakarim_shezhire", None),
    ("kozhaman", "shakarim_shezhire", None),
    ("kobenshi", "shakarim_shezhire", None),
    ("kurak", "shakarim_shezhire", None),
    ("kerey", "shakarim_shezhire", None),
    ("uak", "shakarim_shezhire", None),
    ("qypshaq", "nas_ethnography_kz", None),
    ("alshyn", "mashhur_jusip_shezhire", None),
    ("alimuly", "mashhur_jusip_shezhire", None),
    ("tabyn", "mashhur_jusip_shezhire", None),
    ("zhappas", "mashhur_jusip_shezhire", None),
    ("kaldama", "mashhur_jusip_shezhire", None),
    ("baimuly", "mashhur_jusip_shezhire", None),
    ("shekty", "mashhur_jusip_shezhire", None),
    ("baiuly", "mashhur_jusip_shezhire", None),
]

P0_CLAN_COUNT = len(GENEALOGY_P0_CLANS)


def upsert_genealogy_p0_clans(conn: Any) -> int:
    """Idempotent upsert — parent rows алдымен (sort_order бойынша)."""
    from db.dialect_sql import execute, is_psycopg_connection, is_sqlite_connection

    count = 0
    for clan in GENEALOGY_P0_CLANS:
        if is_sqlite_connection(conn):
            execute(
                conn,
                """
                INSERT INTO genealogy_clans (
                    id, parent_id, level, name_kk, name_kk_alt, name_lat,
                    sort_order, description_kk, is_published, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
                ON CONFLICT(id) DO UPDATE SET
                    parent_id = excluded.parent_id,
                    level = excluded.level,
                    name_kk = excluded.name_kk,
                    name_kk_alt = excluded.name_kk_alt,
                    name_lat = excluded.name_lat,
                    sort_order = excluded.sort_order,
                    description_kk = excluded.description_kk,
                    updated_at = datetime('now')
                """,
                (
                    clan.id,
                    clan.parent_id,
                    clan.level,
                    clan.name_kk,
                    clan.name_kk_alt,
                    clan.name_lat,
                    clan.sort_order,
                    clan.description_kk,
                ),
            )
        elif is_psycopg_connection(conn):
            execute(
                conn,
                """
                INSERT INTO genealogy_clans (
                    id, parent_id, level, name_kk, name_kk_alt, name_lat,
                    sort_order, description_kk, is_published, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    parent_id = EXCLUDED.parent_id,
                    level = EXCLUDED.level,
                    name_kk = EXCLUDED.name_kk,
                    name_kk_alt = EXCLUDED.name_kk_alt,
                    name_lat = EXCLUDED.name_lat,
                    sort_order = EXCLUDED.sort_order,
                    description_kk = EXCLUDED.description_kk,
                    updated_at = NOW()
                """,
                (
                    clan.id,
                    clan.parent_id,
                    clan.level,
                    clan.name_kk,
                    clan.name_kk_alt,
                    clan.name_lat,
                    clan.sort_order,
                    clan.description_kk,
                ),
            )
        else:
            raise TypeError(f"Unsupported connection: {type(conn)!r}")
        count += 1
    return count


def upsert_genealogy_default_source_refs(conn: Any) -> int:
    from db.dialect_sql import execute, is_psycopg_connection, is_sqlite_connection

    count = 0
    for clan_id, source_key, page in DEFAULT_SOURCE_REFS:
        if is_sqlite_connection(conn):
            execute(
                conn,
                """
                INSERT OR IGNORE INTO genealogy_source_refs (
                    clan_id, source_key, page_or_section, sort_order
                ) VALUES (?, ?, ?, ?)
                """,
                (clan_id, source_key, page, count),
            )
        elif is_psycopg_connection(conn):
            execute(
                conn,
                """
                INSERT INTO genealogy_source_refs (clan_id, source_key, page_or_section, sort_order)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (clan_id, source_key) DO NOTHING
                """,
                (clan_id, source_key, page, count),
            )
        count += 1
    return count
