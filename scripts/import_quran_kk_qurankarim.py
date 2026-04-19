# -*- coding: utf-8 -*-
"""
qurankarim.kz ресми API арқылы қазақша мағынаны (`qazaq_text`) sqlite `quran.text_kk` бағанына жазады.

API: GET https://qurankarim.kz/api/v1/sura/number/{1..114}

Ескерту: сайттың HTML meta сипаттамасы бойынша аударма — **Халифа Алтай** нұсқасы;
Ерлан Алимулы бұл API-да көрсетілмейді. (Пайдаланушы «Рэми» деп qurankarim.kz мәнін айтқан болуы мүмкін.)

Орындау:
  .venv/bin/python3 scripts/import_quran_kk_qurankarim.py --db global_clean.db
  .venv/bin/python3 scripts/import_quran_kk_qurankarim.py --dry-run
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

from config.settings import DB_PATH  # noqa: E402
from db.migrations import run_schema_migrations  # noqa: E402

BASE = "https://qurankarim.kz/api/v1/sura/number"
ATTRIBUTION_KK = "Халифа Алтай"
SOURCE_DETAIL = ""


def fetch_sura(sura: int) -> dict:
    url = f"{BASE}/{sura}"
    req = urllib.request.Request(url, headers={"User-Agent": "RAQAT/1.0 (quran import)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def build_kk_by_db_ayah(sura: int, ayats_list: list) -> dict[int, str]:
    """
    API: кей сүрелерде ayat_number=0 — бисмиллә; жергілікті DB 1-аятқа біріктірілген.
    Қайтару: db_ayah -> текст.
    """
    by_num = {int(a["ayat_number"]): (a.get("qazaq_text") or "").strip() for a in ayats_list}
    out: dict[int, str] = {}

    if sura == 1:
        for n in range(1, 8):
            if n in by_num:
                out[n] = by_num[n]
        return out

    if 0 in by_num and 1 in by_num:
        out[1] = f"{by_num[0]} {by_num[1]}".strip()
        for n in range(2, max(by_num.keys()) + 1):
            if n in by_num:
                out[n] = by_num[n]
        return out

    for n, t in by_num.items():
        if n >= 1:
            out[n] = t
    return out


def parse_args():
    p = argparse.ArgumentParser(description="Import Kazakh meanings from qurankarim.kz API.")
    p.add_argument("--db", default=DB_PATH)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--sleep", type=float, default=0.35, help="Delay between surah requests")
    p.add_argument("--from-sura", type=int, default=1)
    p.add_argument("--to-sura", type=int, default=114)
    return p.parse_args()


def main() -> int:
    args = parse_args()
    run_schema_migrations(args.db)

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row

    existing = {
        (int(r["surah"]), int(r["ayah"]))
        for r in conn.execute("SELECT surah, ayah FROM quran")
    }

    updates: list[tuple[str, int, int]] = []
    skipped = 0

    for sura in range(args.from_sura, args.to_sura + 1):
        try:
            data = fetch_sura(sura)
        except (urllib.error.URLError, json.JSONDecodeError, KeyError) as e:
            print(f"Surah {sura} fetch failed: {e}", file=sys.stderr)
            return 1
        ayats = data.get("ayats_list") or []
        kk_map = build_kk_by_db_ayah(sura, ayats)

        for ayah, text in sorted(kk_map.items()):
            if not text:
                continue
            if (sura, ayah) not in existing:
                skipped += 1
                continue
            updates.append((text, sura, ayah))

        time.sleep(args.sleep)

    print(f"Prepared {len(updates)} updates; skipped (no row in DB): {skipped}")

    if args.dry_run:
        conn.close()
        return 0

    try:
        conn.execute("BEGIN")
        conn.executemany(
            "UPDATE quran SET text_kk = ?, updated_at = datetime('now') WHERE surah = ? AND ayah = ?",
            updates,
        )
        conn.execute("DELETE FROM quran_kk_provenance WHERE id = 1")
        conn.execute(
            """
            INSERT INTO quran_kk_provenance (id, attribution_kk, source_detail, updated_at)
            VALUES (1, ?, ?, datetime('now'))
            """,
            (ATTRIBUTION_KK, SOURCE_DETAIL or None),
        )
        conn.commit()
        print("OK: committed.")
    except Exception as e:
        conn.rollback()
        print(f"Rolled back: {e}", file=sys.stderr)
        conn.close()
        return 1
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
