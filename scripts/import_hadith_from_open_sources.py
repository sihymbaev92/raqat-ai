#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Хадистерді ашық, сенімді дереккөзден SQLite `hadith` кестесіне импорттау.

Дереккөз: https://github.com/fawazahmed0/hadith-api (MIT; CDN: jsDelivr / GitHub raw).
Әр жинақ үшін `editions/{ara|eng|rus}-{slug}.min.json` — араб, ағылшынша (Sahih International
стилі), орысша бір JSON ішінде реттелген.

Ескерту — орыс жинақта (әсіресе Бұхари) `hadithnumber` кілті бойынша біріктіреміз:
`rus-bukhari` жол саны `eng`/`ara`-дан өзгеше болуы мүмкін (қосымша 1716.2 т.б.), сондықтан
орыс мәтіні `hadithnumber` бойынша алынады.

Қолдану (бос кесте немесе алдымен --replace):
  .venv/bin/python scripts/import_hadith_from_open_sources.py --db global_clean.db --replace --i-understand

Тек Сахих Бұхари + Муслим (әдепкі):
  .venv/bin/python scripts/import_hadith_from_open_sources.py --db global_clean.db --replace --i-understand \\
    --books bukhari,muslim

Сунан Әбу Дәуд қосу:
  --books bukhari,muslim,abudawud

Кейін: `text_kk` толтыру — translate_hadith_kk_batch.py; FTS — create_hadith_fts.py (қажет болса).
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.text_cleanup import clean_text_content  # noqa: E402

API_BASES = (
    "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions",
    "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions",
)

# slug -> DB source (hadith_corpus_sync.SOURCE_SLUG-пен дәл сәйкес)
BOOK_SOURCE: dict[str, str] = {
    "bukhari": "Sahih al-Bukhari",
    "muslim": "Sahih Muslim",
    "abudawud": "Sunan Abi Dawud",
}


def fetch_json(name: str) -> dict:
    """name мысалы: eng-bukhari.min.json"""
    last_err: Exception | None = None
    for base in API_BASES:
        url = f"{base}/{name}"
        req = urllib.request.Request(url, headers={"User-Agent": "RAQAT-import_hadith_open/1"})
        for attempt in range(5):
            try:
                with urllib.request.urlopen(req, timeout=120) as r:
                    return json.loads(r.read().decode("utf-8"))
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as e:
                last_err = e
                time.sleep(0.4 * (attempt + 1))
    raise RuntimeError(f"Жүктелмеді {name}: {last_err}")


def rus_map_from_hadiths(hadiths: list[dict]) -> dict[float | int, str]:
    """hadithnumber -> text (1716.2 сияқты float болуы мүмкін)."""
    out: dict[float | int, str] = {}
    for h in hadiths:
        n = h.get("hadithnumber")
        t = h.get("text")
        if isinstance(n, (int, float)) and isinstance(t, str) and t.strip():
            out[n] = clean_text_content(t)
    return out


def import_book(conn: sqlite3.Connection, slug: str, *, dry_run: bool) -> int:
    source = BOOK_SOURCE[slug]
    eng = fetch_json(f"eng-{slug}.min.json")
    ara = fetch_json(f"ara-{slug}.min.json")
    rus = fetch_json(f"rus-{slug}.min.json")
    he = eng["hadiths"]
    ha = ara["hadiths"]
    hr = rus["hadiths"]
    if len(he) != len(ha):
        raise RuntimeError(f"{slug}: eng len {len(he)} != ara len {len(ha)}")
    rus_by_num = rus_map_from_hadiths(hr)

    batch: list[tuple[str, str, str, str, str]] = []
    for i, eh in enumerate(he):
        num = eh["hadithnumber"]
        if ha[i]["hadithnumber"] != num:
            raise RuntimeError(f"{slug}: position {i} hadithnumber mismatch eng={num} ara={ha[i]['hadithnumber']}")
        text_en = clean_text_content(eh.get("text") or "")
        text_ar = clean_text_content(ha[i].get("text") or "")
        text_ru = ""
        if isinstance(num, (int, float)):
            text_ru = rus_by_num.get(num, "")
        if not text_ar and not text_en and not text_ru:
            continue
        batch.append(
            (
                source,
                text_ar,
                "",  # text_kk — кейін бөлек толтырылады
                text_ru,
                text_en,
            )
        )

    if dry_run:
        print(f"[dry-run] {source}: {len(batch)} жол дайын (импорт жоқ).")
        return len(batch)

    conn.executemany(
        """
        INSERT INTO hadith (source, text_ar, text_kk, text_ru, text_en, grade, updated_at)
        VALUES (?, ?, ?, ?, ?, NULL, datetime('now'))
        """,
        batch,
    )
    return len(batch)


def count_for_sources(conn: sqlite3.Connection, sources: list[str]) -> int:
    q = ",".join("?" * len(sources))
    row = conn.execute(f"SELECT COUNT(*) AS n FROM hadith WHERE source IN ({q})", sources).fetchone()
    return int(row["n"] or 0)


def delete_sources(conn: sqlite3.Connection, sources: list[str]) -> int:
    n = 0
    for s in sources:
        cur = conn.execute("DELETE FROM hadith WHERE source = ?", (s,))
        n += cur.rowcount or 0
    return n


def main() -> int:
    ap = argparse.ArgumentParser(description="Import hadith from fawazahmed0/hadith-api (open JSON)")
    ap.add_argument("--db", default=str(ROOT / "global_clean.db"))
    ap.add_argument(
        "--books",
        default="bukhari,muslim",
        help="үтірмен: bukhari, muslim, abudawud",
    )
    ap.add_argument("--replace", action="store_true", help="Таңдалған жинақтар бойынша hadith жолдарын алдымен жою")
    ap.add_argument(
        "--i-understand",
        action="store_true",
        help="--replace кезінде бар деректі жоюға келісесіз (қауіпсіздік)",
    )
    ap.add_argument("--dry-run", action="store_true", help="Тек жүктеп санау, DB жазбау")
    args = ap.parse_args()

    slugs = [s.strip().lower() for s in args.books.split(",") if s.strip()]
    for s in slugs:
        if s not in BOOK_SOURCE:
            print(f"Белгісіз slug: {s}. Рұқсат: {', '.join(BOOK_SOURCE)}", file=sys.stderr)
            return 1

    sources = [BOOK_SOURCE[s] for s in slugs]

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    try:
        existing = count_for_sources(conn, sources)
    except sqlite3.OperationalError as e:
        if "no such table" in str(e).lower():
            print(
                "Кесте `hadith` жоқ — алдымен миграция: "
                "python -c \"import os; from db.migrations import run_schema_migrations; "
                f"run_schema_migrations('{args.db}')\"",
                file=sys.stderr,
            )
            conn.close()
            return 3
        raise

    if existing > 0 and not args.replace and not args.dry_run:
        print(
            f"Кестеде осы жинақтардан {existing} жол бар. Қайта импорт үшін: "
            f"--replace --i-understand (немесе басқа DB файлын қолданыңыз).",
            file=sys.stderr,
        )
        conn.close()
        return 2

    if args.replace and not args.dry_run:
        if not args.i_understand:
            print("--replace үшін міндетті: --i-understand", file=sys.stderr)
            conn.close()
            return 1
        deleted = delete_sources(conn, sources)
        conn.commit()
        print(f"Жойылды: {deleted} жол (таңдалған source бойынша).")

    total = 0
    try:
        for slug in slugs:
            n = import_book(conn, slug, dry_run=args.dry_run)
            total += n
            if not args.dry_run:
                conn.commit()
            print(f"OK {BOOK_SOURCE[slug]}: {n} жол.")
    except Exception as e:
        conn.rollback()
        print(f"Қате: {e}", file=sys.stderr)
        conn.close()
        return 1
    finally:
        conn.close()

    print(f"Барлығы: {total} жол. Қазақша: translate_hadith_kk_batch.py. FTS: create_hadith_fts.py.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
