# -*- coding: utf-8 -*-
"""P2: атақты тұлғалар — ру/тарmaq slug + дереккөз (NAS/шежіре/биография)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class GenealogyPersonDef:
    id: str
    clan_slug: str
    name_kk: str
    sort_order: int
    era: str = "historical"  # historical | contemporary
    name_lat: str | None = None
    birth_year: int | None = None
    death_year: int | None = None
    role_kk: str | None = None
    bio_kk: str | None = None


GENEALOGY_PERSON_DEFS: list[GenealogyPersonDef] = [
    GenealogyPersonDef(
        "abai_kunanbayev", "argyn", "Абай Құнанбайұлы", 10,
        birth_year=1845, death_year=1904, name_lat="Abai Kunanbayev",
        role_kk="Ақын, ойшыл, ағартушы",
        bio_kk="Арғын руынан; қазақ әдебиеті мен философиясындағы іргелі тұлға.",
    ),
    GenealogyPersonDef(
        "shokan_walihanov", "alban", "Шоқан Уәлиханов", 20,
        birth_year=1835, death_year=1865, name_lat="Shokan Walikhanov",
        role_kk="Ғалым, этнограф, саяхатшы",
        bio_kk="Албан руы; қазақ тарихы мен этнографиясын зерттеуде алғашқылардың бірі.",
    ),
    GenealogyPersonDef(
        "makhambet_otemisuly", "argyn", "Махамбет Өтемісұлы", 30,
        birth_year=1803, death_year=1846, name_lat="Makhambet Otemisuly",
        role_kk="Ақын, батыр",
        bio_kk="Арғын руы; азаттық рухындағы жырларымен танымал.",
    ),
    GenealogyPersonDef(
        "ybyray_altynsarin", "argyn", "Ыбырай Алтынсарин", 40,
        birth_year=1841, death_year=1889, name_lat="Ybyray Altynsarin",
        role_kk="Ағартушы, педагог",
        bio_kk="Арғын руы; қазақ мектептері мен сауаттылық идеяларының негізін қалаушы.",
    ),
    GenealogyPersonDef(
        "mashhur_jusip_kopeyuly", "dulat", "Мәшһүр Жүсіп Көпейұлы", 50,
        birth_year=1858, death_year=1931, name_lat="Mashhur Jusip Kopeyuly",
        role_kk="Шежіреші, ақын",
        bio_kk="Дулат тармағы; қазақ шежіре дәстүрінің классикалық авторы.",
    ),
    GenealogyPersonDef(
        "shakarim_kudaiberdiuly", "nayman", "Шәкәрім Құдайбердіұлы", 60,
        birth_year=1858, death_year=1931, name_lat="Shakarim Kudaiberdiuly",
        role_kk="Ақын, шежіреші",
        bio_kk="Найман руы; «Шежіре-тарих» авторы.",
    ),
    GenealogyPersonDef(
        "kazybek_biy", "tabyn", "Қазыбек би", 70,
        birth_year=1693, death_year=1774, name_lat="Kazybek Bi",
        role_kk="Би, заң қoyushy",
        bio_kk="Кіші жүз, Табын руы; «Жетi жарғы» дәстүрінің белгілі өкілі.",
    ),
    GenealogyPersonDef(
        "tole_biy", "tabyn", "Төле би", 80,
        birth_year=1663, death_year=1756, name_lat="Tole Bi",
        role_kk="Би",
        bio_kk="Кіші жүз билері; Табын руымен байланысты тарихи дерек.",
    ),
    GenealogyPersonDef(
        "ainash_khan", "uly_zhuz", "Айнаш хан", 90,
        birth_year=1596, death_year=1640, name_lat="Ainash Khan",
        role_kk="Ханша",
        bio_kk="Ұлы жүз тарихындағы белгілі тұлға; этнографиялық дереккөздерде аталады.",
    ),
    GenealogyPersonDef(
        "serikbol_qabyshuly", "argyn", "Серікбол Қабышұлы", 100,
        era="contemporary", birth_year=1959, name_lat="Serikbol Qabyshuly",
        role_kk="Ақын",
        bio_kk="Арғын руы; қазіргі қазақ поэзиясының өкілі.",
    ),
    GenealogyPersonDef(
        "gennady_golovkin", "argyn", "Геннадий Головкин", 110,
        era="contemporary", birth_year=1982, name_lat="Gennady Golovkin",
        role_kk="Боксшы, олимпиада чемпионы",
        bio_kk="Арғын руы; жариялаған сұхбаттарда ру тегін атайды.",
    ),
    GenealogyPersonDef(
        "dimash_kudaibergen", "nayman", "Димаш Құдайберген", 120,
        era="contemporary", birth_year=1994, name_lat="Dimash Qudaibergen",
        role_kk="Әнші",
        bio_kk="Найман руы; отбасы шежіресі мен жариялаған деректерге сүйенеміз.",
    ),
    # —— Интернет/NAS дереккөздерінен толықтырылған ——
    GenealogyPersonDef(
        "kenesary_khan", "orta_zhuz", "Кенесары Қасымұлы", 130,
        birth_year=1802, death_year=1847, name_lat="Kenesary Kasymuly",
        role_kk="Хан, ұлт-азаттық қозғалысының көшемі",
        bio_kk="Орта жүз; Абылай ханның немересі, Қазақ хандығының соңғы ханы (1841–1847).",
    ),
    GenealogyPersonDef(
        "abylai_khan", "argyn", "Абылай хан", 135,
        birth_year=1711, death_year=1781, name_lat="Ablai Khan",
        role_kk="Хан, көлбасшы",
        bio_kk="Арғын руы; Орта жүз ханы, жоңғар басқыншылығына қарсы бірлік көшемі.",
    ),
    GenealogyPersonDef(
        "raiymbek_batyr", "alban", "Райымбек батыр", 140,
        birth_year=1705, death_year=1785, name_lat="Raiymbek Batyr",
        role_kk="Батыр, көлбасшы",
        bio_kk="Албан руы (Алжан-Сырымбет); ураны Албан руына айналған, Жетісуды азат етуге басшылық жасаған.",
    ),
    GenealogyPersonDef(
        "bukhar_zhyrau", "argyn", "Бұқар жырау", 145,
        birth_year=1693, death_year=1781, name_lat="Bukhar Zhyrau",
        role_kk="Жырау, Абылай кеңешесі",
        bio_kk="Арғын руы (Қаржас тармақы); Абылай ханның ақылшысы, ел бірлігін сақтау жыршысы.",
    ),
    GenealogyPersonDef(
        "bokey_khan", "alshyn", "Бөкей хан", 150,
        birth_year=1749, death_year=1815, name_lat="Bokey Khan",
        role_kk="Хан",
        bio_kk="Кіші жүз, Алшын руы; Ішкі (Бөкей) орда ханы, Абылқайыр үрпағы.",
    ),
    GenealogyPersonDef(
        "isatai_taymanuly", "shekty", "Исатай Тайманұлы", 155,
        birth_year=1791, death_year=1838, name_lat="Isatai Taymanuly",
        role_kk="Батыр, көтеріліс көшемі",
        bio_kk="Шекте руы (Беріш тармақы); 1836–1838 Бөкей ордасындағы халық-азаттық көтерілісінің бас көшемі.",
    ),
    GenealogyPersonDef(
        "alikhan_bokeikhan", "alshyn", "Алихан Бөкейұлы", 160,
        birth_year=1866, death_year=1937, name_lat="Alikhan Bokeikhan",
        role_kk="Мемлекеттік қайраткер, Алаш көшемі",
        bio_kk="Кіші жүз, Бөкей үрпағы (төре); Алаш қозғалысының зерттеуші және көшемі.",
    ),
    GenealogyPersonDef(
        "kurmanjan_datka", "kongrat", "Құрманжан датқа", 165,
        birth_year=1811, death_year=1907, name_lat="Kurmanjan Datka",
        role_kk="Датқа, би",
        bio_kk="Қоңырат руы; Алай туықының бисі, Қыргыз жерінде датқа атанған.",
    ),
    GenealogyPersonDef(
        "bogenbay_batyr", "argyn", "Бөгенбай батыр", 170,
        birth_year=1680, death_year=1778, name_lat="Bogenbay Batyr",
        role_kk="Батыр, көлбасшы",
        bio_kk="Арғын руы (Қанжығалы); Абылай ханның көлбасшысы, Анырақай жеңісіне қатысқан.",
    ),
    GenealogyPersonDef(
        "zhambul_zhabayev", "argyn", "Жамбыл Жабаев", 175,
        birth_year=1846, death_year=1945, name_lat="Zhambul Zhabayev",
        role_kk="Ақын, жыршы",
        bio_kk="Арғын руы; қазақ елінің ақын-жыршысы, 100 жыл өмір сүргендердің бірі.",
    ),
    GenealogyPersonDef(
        "olzhas_suleimenov", "argyn", "Олжас Сүлейменов", 180,
        era="contemporary", birth_year=1936, death_year=2024, name_lat="Olzhas Suleimenov",
        role_kk="Ақын, жазушы, қоғам қайраткері",
        bio_kk="Арғын руы (Айдабол тармақы); қазақ әдебиеті мен қоғам қозғалысының белгілі өкілі.",
    ),
    GenealogyPersonDef(
        "fariza_ongarsynova", "baiuly", "Фариза Оңарсынова", 185,
        era="contemporary", birth_year=1939, death_year=2014, name_lat="Fariza Ongarsynova",
        role_kk="Ақын, қазақ әдебиеті қайраткері",
        bio_kk="Байұлы руы (Алшын); қазақ әдебиетінің үлкен ақыны.",
    ),
]

PERSON_SOURCE_REFS: list[tuple[str, str, str | None]] = [
    ("abai_kunanbayev", "nas_ethnography_kz", None),
    ("shokan_walihanov", "nas_ethnography_kz", None),
    ("makhambet_otemisuly", "nas_ethnography_kz", None),
    ("ybyray_altynsarin", "nas_ethnography_kz", None),
    ("mashhur_jusip_kopeyuly", "mashhur_jusip_shezhire", None),
    ("shakarim_kudaiberdiuly", "shakarim_shezhire", None),
    ("kazybek_biy", "nas_ethnography_kz", "Кіші жүз билері"),
    ("tole_biy", "nas_ethnography_kz", None),
    ("ainash_khan", "nas_ethnography_kz", None),
    ("serikbol_qabyshuly", "genealogy_public_figure_bio", None),
    ("gennady_golovkin", "genealogy_public_figure_bio", "Жариялаған сұхбат"),
    ("dimash_kudaibergen", "genealogy_public_figure_bio", None),
    ("kenesary_khan", "nas_ethnography_kz", "e-history.kz"),
    ("abylai_khan", "nas_ethnography_kz", None),
    ("raiymbek_batyr", "nas_ethnography_kz", "e-history.kz"),
    ("bukhar_zhyrau", "nas_ethnography_kz", "e-history.kz"),
    ("bokey_khan", "nas_ethnography_kz", "iie.kz"),
    ("isatai_taymanuly", "nas_ethnography_kz", "iie.kz"),
    ("alikhan_bokeikhan", "nas_ethnography_kz", "e-history.kz"),
    ("kurmanjan_datka", "nas_ethnography_kz", None),
    ("bogenbay_batyr", "nas_ethnography_kz", None),
    ("zhambul_zhabayev", "nas_ethnography_kz", None),
    ("olzhas_suleimenov", "genealogy_public_figure_bio", "kk.wikipedia.org"),
    ("fariza_ongarsynova", "genealogy_public_figure_bio", None),
]

PERSON_COUNT = len(GENEALOGY_PERSON_DEFS)


def upsert_genealogy_persons(conn: Any) -> int:
    from db.dialect_sql import execute, is_psycopg_connection, is_sqlite_connection

    count = 0
    for p in GENEALOGY_PERSON_DEFS:
        if is_sqlite_connection(conn):
            execute(
                conn,
                """
                INSERT INTO genealogy_persons (
                    id, clan_slug, name_kk, name_lat, birth_year, death_year,
                    era, role_kk, bio_kk, sort_order, is_published, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
                ON CONFLICT(id) DO UPDATE SET
                    clan_slug = excluded.clan_slug,
                    name_kk = excluded.name_kk,
                    name_lat = excluded.name_lat,
                    birth_year = excluded.birth_year,
                    death_year = excluded.death_year,
                    era = excluded.era,
                    role_kk = excluded.role_kk,
                    bio_kk = excluded.bio_kk,
                    sort_order = excluded.sort_order,
                    updated_at = datetime('now')
                """,
                (
                    p.id, p.clan_slug, p.name_kk, p.name_lat, p.birth_year, p.death_year,
                    p.era, p.role_kk, p.bio_kk, p.sort_order,
                ),
            )
        elif is_psycopg_connection(conn):
            execute(
                conn,
                """
                INSERT INTO genealogy_persons (
                    id, clan_slug, name_kk, name_lat, birth_year, death_year,
                    era, role_kk, bio_kk, sort_order, is_published, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    clan_slug = EXCLUDED.clan_slug,
                    name_kk = EXCLUDED.name_kk,
                    name_lat = EXCLUDED.name_lat,
                    birth_year = EXCLUDED.birth_year,
                    death_year = EXCLUDED.death_year,
                    era = EXCLUDED.era,
                    role_kk = EXCLUDED.role_kk,
                    bio_kk = EXCLUDED.bio_kk,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = NOW()
                """,
                (
                    p.id, p.clan_slug, p.name_kk, p.name_lat, p.birth_year, p.death_year,
                    p.era, p.role_kk, p.bio_kk, p.sort_order,
                ),
            )
        else:
            raise TypeError(f"Unsupported connection: {type(conn)!r}")
        count += 1
    return count


def upsert_genealogy_person_source_refs(conn: Any) -> int:
    from db.dialect_sql import execute, is_psycopg_connection, is_sqlite_connection

    count = 0
    for person_id, source_key, page in PERSON_SOURCE_REFS:
        if is_sqlite_connection(conn):
            execute(
                conn,
                """
                INSERT OR IGNORE INTO genealogy_person_source_refs (
                    person_id, source_key, page_or_section, sort_order
                ) VALUES (?, ?, ?, ?)
                """,
                (person_id, source_key, page, count),
            )
        elif is_psycopg_connection(conn):
            execute(
                conn,
                """
                INSERT INTO genealogy_person_source_refs (
                    person_id, source_key, page_or_section, sort_order
                ) VALUES (%s, %s, %s, %s)
                ON CONFLICT (person_id, source_key) DO NOTHING
                """,
                (person_id, source_key, page, count),
            )
        count += 1
    return count
