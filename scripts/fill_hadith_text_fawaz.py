#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Хадис `text_en` / `text_ru` толтыру — fawazahmed0/hadith-api (jsDelivr / GitHub raw).

Дереккөз: https://github.com/fawazahmed0/hadith-api (көп тіл нұсқалары).
Сәйкестіру: әр жинақта `ORDER BY id` бойынша реттік нөмір = API `hadithnumber`.

Қазақша (text_kk): бұл APIда жоқ — `translate_hadith_kk_batch.py` / `run_sahih_hadith_kk.sh`
(Gemini) немесе қолмен редакция; docs/HADITH_DATA_PROVENANCE.md.

Қолдану:
  .venv/bin/python scripts/fill_hadith_text_fawaz.py --db global_clean.db --target en
  .venv/bin/python scripts/fill_hadith_text_fawaz.py --db global_clean.db --target ru
  .venv/bin/python scripts/fill_hadith_text_fawaz.py --db global_clean.db --target all   # en содан ru

  --force-all  — бар мәнді қайта жазу
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.text_cleanup import clean_text_content  # noqa: E402

API_BASES = (
    "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions",
    "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions",
)

# (source_db, fawaz_edition, max_hadith_number_or_None)
BOOKS: list[tuple[str, str, int | None]] = [
    ("Sahih al-Bukhari", "bukhari", None),
    ("Sahih Muslim", "muslim", None),
    ("Sunan Abi Dawud", "abudawud", 5274),
]

TARGETS: dict[str, tuple[str, str]] = {
    "en": ("text_en", "eng"),
    "ru": ("text_ru", "rus"),
}


def edition_name(prefix: str, book_key: str) -> str:
    return f"{prefix}-{book_key}"


def fetch_text(edition: str, hadith_no: int) -> tuple[str | None, str]:
    last_err = "fetch_error"
    for base in API_BASES:
        url = f"{base}/{edition}/{hadith_no}.min.json"
        req = urllib.request.Request(url, headers={"User-Agent": "RAQAT-fill_hadith_text_fawaz/1"})
        for attempt in range(6):
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    raw = r.read().decode("utf-8")
                data = json.loads(raw)
                hadiths = data.get("hadiths")
                if not isinstance(hadiths, list) or not hadiths:
                    return None, "bad_json"
                t = hadiths[0].get("text")
                if not isinstance(t, str) or not t.strip():
                    return None, "empty_api"
                return clean_text_content(t), "ok"
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError):
                time.sleep(0.5 * (attempt + 1))
                last_err = "fetch_error"
    return None, last_err


def run_target(
    conn: sqlite3.Connection,
    *,
    column: str,
    lang_prefix: str,
    force_all: bool,
    workers: int,
    chunk: int,
    pause: float,
    limit: int,
) -> dict[str, int]:
    stats = {
        "updated": 0,
        "skip_cap": 0,
        "fetch_fail": 0,
        "empty_api": 0,
        "bad_json": 0,
        "skip_filled": 0,
    }
    for source, book_key, cap in BOOKS:
        edition = edition_name(lang_prefix, book_key)
        rows = conn.execute(
            f"SELECT id, {column} FROM hadith WHERE source = ? ORDER BY id",
            (source,),
        ).fetchall()
        if limit > 0:
            rows = rows[:limit]

        tasks: list[tuple[int, int]] = []
        for idx, row in enumerate(rows):
            n = idx + 1
            if cap is not None and n > cap:
                stats["skip_cap"] += 1
                continue
            tr = row[column]
            if not force_all and tr and str(tr).strip():
                stats["skip_filled"] += 1
                continue
            tasks.append((int(row["id"]), n))

        print(f"{source} ({edition}): {len(tasks)} қалпына келтіру…", flush=True)

        def job(item: tuple[int, int]) -> tuple[int, str | None, str]:
            hid, num = item
            text, reason = fetch_text(edition, num)
            return hid, text, reason

        book_done = 0
        for start in range(0, len(tasks), chunk):
            chunk_rows = tasks[start : start + chunk]
            with ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
                results = list(ex.map(job, chunk_rows))
            batch: list[tuple[str, int]] = []
            for hid, text, reason in results:
                if text is None:
                    if reason == "empty_api":
                        stats["empty_api"] += 1
                    elif reason == "bad_json":
                        stats["bad_json"] += 1
                    else:
                        stats["fetch_fail"] += 1
                    continue
                batch.append((text, hid))
            if batch:
                conn.executemany(
                    f"UPDATE hadith SET {column} = ?, updated_at = datetime('now') WHERE id = ?",
                    batch,
                )
                conn.commit()
            book_done += len(batch)
            stats["updated"] += len(batch)
            print(f"  … +{len(batch)} ({book_done}/{len(tasks)}) fail_chunk={len(chunk_rows)-len(batch)}", flush=True)
            time.sleep(pause)

    return stats


def main() -> int:
    ap = argparse.ArgumentParser(description="Fill text_en / text_ru from fawazahmed0/hadith-api CDN")
    ap.add_argument("--db", default=str(ROOT / "global_clean.db"))
    ap.add_argument(
        "--target",
        choices=("en", "ru", "all"),
        default="en",
        help="en=text_en (Sahih International style), ru=Russian, all=both",
    )
    ap.add_argument("--force-all", action="store_true")
    ap.add_argument("--workers", type=int, default=5)
    ap.add_argument("--chunk", type=int, default=40)
    ap.add_argument("--pause", type=float, default=0.35)
    ap.add_argument("--limit", type=int, default=0, help="0 = no limit per book")
    args = ap.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    cols = {row[1] for row in conn.execute("PRAGMA table_info(hadith)").fetchall()}

    targets: list[tuple[str, str]] = []
    if args.target == "all":
        targets = [TARGETS["en"], TARGETS["ru"]]
    else:
        targets = [TARGETS[args.target]]

    try:
        for column, prefix in targets:
            if column not in cols:
                print(f"Кестеде {column} бағаны жоқ — миграция қосыңыз.", file=sys.stderr)
                return 1
            print(f"=== {column} ({prefix}-*) ===", flush=True)
            stats = run_target(
                conn,
                column=column,
                lang_prefix=prefix,
                force_all=args.force_all,
                workers=args.workers,
                chunk=args.chunk,
                pause=args.pause,
                limit=args.limit,
            )
            print(
                f"Дайын [{column}]: updated={stats['updated']} skip_filled={stats['skip_filled']} "
                f"skip_cap={stats['skip_cap']} fetch_fail={stats['fetch_fail']} "
                f"empty_api={stats['empty_api']} bad_json={stats['bad_json']}",
                flush=True,
            )
    finally:
        conn.close()

    if args.target == "all":
        print(
            "\nҚазақша (text_kk): fawaz APIда қазақша жоқ. Толтыру: "
            "bash scripts/run_sahih_hadith_kk.sh немесе .venv/bin/python scripts/translate_hadith_kk_batch.py "
            "(GEMINI_API_KEY). См. docs/HADITH_DATA_PROVENANCE.md",
            flush=True,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
