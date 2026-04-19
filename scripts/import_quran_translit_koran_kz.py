#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Канондық 1-кезең: koran.kz/trnc/ бетінен қазақша транскрипцияны алып, `quran.translit` жаңартады.
Бос қалған аяттарды толықтыру үшін `backfill_quran_translit.py` орындаңыз (2-кезең).

Ескерту: ұзын сүрелерде (мысалы «Бақара») сайт көбінесе араб мәтінін көрсетеді;
кирилл транскрипциясы негізінен қысқа сүрелерде толық берілген. Мұндай жағдайда
бұл скрипт тек кирилл әріптері бар аяттарды жаңартады, қалғаны қолданыстағы
мәнді сақтайды (немесе алдын ала `backfill_quran_translit.py` нәтижесі).

Дереккөз: https://koran.kz/trnc/ (Falaq жобасына сілтеме бар).

Қолдану:
  .venv/bin/python scripts/import_quran_translit_koran_kz.py --db global_clean.db --dry-run
  .venv/bin/python scripts/import_quran_translit_koran_kz.py --db global_clean.db

Бір ретте тексерілген қазақша JSON-пен: bash scripts/sync_quran_official_sources.sh
"""
from __future__ import annotations

import argparse
import re
import sqlite3
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from db.migrations import run_schema_migrations  # noqa: E402

USER_AGENT = "Mozilla/5.0 (compatible; RAQAT/1.0; +https://koran.kz/trnc/)"
BLOCK_RE = re.compile(
    r'<p>([^<]+)<div onclick="toogle\(this,\'//falaq\.ru/audio/quran/(\d{6})',
    re.IGNORECASE,
)


def fetch_trnc_page(surah: int) -> str:
    url = f"https://koran.kz/trnc/{surah}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", errors="replace")


def has_cyrillic_kk(s: str) -> bool:
    return bool(re.search(r"[а-яА-Яәғқңөүұ]", s))


def normalize_koran_kz_translit(raw: str) -> str:
    """koran.kz форматын ботта көрсетуге ыңғайлау: белгілерді жеңілдету, h → һ."""
    s = raw.strip()
    s = re.sub(r"^\d+\.\s*", "", s)
    s = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", s)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = unicodedata.normalize("NFKC", s)
    for a, b in (
        ("\u02bf", "'"),
        ("\u02be", "'"),
        ("\u02bb", "'"),
        ("ʻ", "'"),
        ("ʿ", "'"),
        ("ʾ", "'"),
        ("ʼ", "'"),
    ):
        s = s.replace(a, b)
    s = s.replace("h", "һ")
    s = s.replace("H", "һ")
    # Сайт кейде «ха» соңында латын a қалдырады
    s = s.replace("хa", "ха").replace("Хa", "Ха")
    s = re.sub(r"-+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def parse_blocks(html: str) -> list[tuple[int, int, str]]:
    """Қайтару: (surah, ayah, raw_text)."""
    out: list[tuple[int, int, str]] = []
    for raw_txt, code in BLOCK_RE.findall(html):
        if len(code) != 6:
            continue
        surah = int(code[:3])
        ayah = int(code[3:])
        out.append((surah, ayah, raw_txt))
    return out


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Import Kazakh transcriptions from koran.kz/trnc/")
    p.add_argument("--db", default=str(ROOT / "global_clean.db"))
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--sleep", type=float, default=0.4, help="Delay between HTTP requests")
    p.add_argument("--from-sura", type=int, default=1)
    p.add_argument("--to-sura", type=int, default=114)
    return p.parse_args()


def main() -> int:
    args = parse_args()
    run_schema_migrations(args.db)

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    updated = 0
    skipped_no_cyr = 0
    skipped_empty = 0
    missing_row = 0

    for sura in range(args.from_sura, args.to_sura + 1):
        try:
            html = fetch_trnc_page(sura)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as e:
            print(f"ERROR sura {sura}: {e}", file=sys.stderr)
            time.sleep(args.sleep * 2)
            continue

        blocks = parse_blocks(html)
        for bs, ba, raw in blocks:
            if bs != sura:
                continue
            if not has_cyrillic_kk(raw):
                skipped_no_cyr += 1
                continue
            norm = normalize_koran_kz_translit(raw)
            if not norm:
                skipped_empty += 1
                continue
            row = conn.execute(
                "SELECT id FROM quran WHERE surah = ? AND ayah = ? LIMIT 1",
                (bs, ba),
            ).fetchone()
            if not row:
                missing_row += 1
                continue
            if args.dry_run:
                updated += 1
                continue
            conn.execute(
                "UPDATE quran SET translit = ?, updated_at = datetime('now') WHERE surah = ? AND ayah = ?",
                (norm, bs, ba),
            )
            updated += 1

        conn.commit()
        print(f"  sura {sura}: blocks={len(blocks)}", flush=True)
        time.sleep(args.sleep)

    conn.close()

    print(
        f"Done. updated_rows={updated} skipped_no_cyrillic={skipped_no_cyr} "
        f"skipped_empty={skipped_empty} missing_db_ayah={missing_row} dry_run={args.dry_run}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
