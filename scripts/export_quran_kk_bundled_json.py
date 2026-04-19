# -*- coding: utf-8 -*-
"""
sqlite `quran.text_kk` және `quran.translit` → мобильді бандл JSON (`quran-kk-from-db.json`).

`translit` дерекқорда **бір бағана**; толтыру реті: koran.kz импорты → содан кейін
`backfill_quran_translit.py` (бос жолдарға `quran_translit.py` алгоритмі). Жоғарыдағы
ретті орындағанда әр аяттың `translit` мәні **бір ғана түпкі көзден** (схема бойынша)
қалғанымен сәйкес келеді.

Әр аят: `text_kk` (мағына) және `translit` (қазақ кирилл).
Сидинг: `bundledQuranSeed.ts` дерекқор транскрипциясын алдымен қолданады, жоқ болса
`quran-en-transliteration-full.json` (латын) қалдынады.

Орындау (репо түбінен):
  .venv/bin/python scripts/export_quran_kk_bundled_json.py --db global_clean.db
  .venv/bin/python scripts/export_quran_kk_bundled_json.py --db global_clean.db --out mobile/assets/bundled/quran-kk-from-db.json

Толық емес мағына (6224-ке дейін) үшін: --allow-partial
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config.settings import DB_PATH  # noqa: E402
from db.migrations import run_schema_migrations  # noqa: E402

SCHEMA = "raqat_quran_kk_bundle_v2"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Export quran.text_kk + translit from SQLite to mobile JSON bundle.")
    p.add_argument("--db", default=DB_PATH, help="SQLite path (default: config DB_PATH)")
    p.add_argument(
        "--out",
        default=str(ROOT / "mobile" / "assets" / "bundled" / "quran-kk-from-db.json"),
        help="Output JSON path",
    )
    p.add_argument(
        "--allow-partial",
        action="store_true",
        help="Allow export when fewer than 6224 ayahs have text_kk (warn only)",
    )
    p.add_argument(
        "--compact",
        action="store_true",
        help="Minified JSON (smaller file; default: pretty printed)",
    )
    return p.parse_args()


def _provenance(conn: sqlite3.Connection) -> tuple[str | None, str | None]:
    try:
        row = conn.execute(
            "SELECT attribution_kk, source_detail FROM quran_kk_provenance WHERE id = 1"
        ).fetchone()
    except sqlite3.OperationalError:
        return None, None
    if not row:
        return None, None
    a = (row["attribution_kk"] or "").strip() or None
    d = (row["source_detail"] or "").strip() or None
    return a, d


def main() -> int:
    args = parse_args()
    db_path = Path(args.db)
    out_path = Path(args.out)
    if not db_path.is_file():
        print(f"Database not found: {db_path}", file=sys.stderr)
        return 1

    run_schema_migrations(str(db_path))

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("SELECT 1 FROM quran LIMIT 1")
    except sqlite3.Error as e:
        print(f"quran table: {e}", file=sys.stderr)
        conn.close()
        return 1

    total_row = conn.execute("SELECT COUNT(*) AS n FROM quran").fetchone()
    total_quran_rows = int(total_row["n"]) if total_row else 0

    rows = conn.execute(
        """
        SELECT surah, ayah, text_kk, translit
        FROM quran
        WHERE TRIM(COALESCE(text_kk, '')) <> ''
        ORDER BY surah, ayah
        """
    ).fetchall()

    by_surah: dict[int, list[dict]] = defaultdict(list)
    translit_filled = 0
    for r in rows:
        s = int(r["surah"])
        a = int(r["ayah"])
        t = (r["text_kk"] or "").strip()
        if not t:
            continue
        tr = (r["translit"] or "").strip()
        item: dict = {"numberInSurah": a, "text_kk": t}
        if tr:
            item["translit"] = tr
            translit_filled += 1
        by_surah[s].append(item)

    surahs_out = [{"number": n, "ayahs": by_surah[n]} for n in sorted(by_surah.keys())]
    att, det = _provenance(conn)
    conn.close()

    filled = sum(len(s["ayahs"]) for s in surahs_out)
    expected = 6224
    if filled < expected and not args.allow_partial:
        print(
            f"Expected {expected} ayahs with text_kk, got {filled}. "
            f"Use --allow-partial to export anyway.",
            file=sys.stderr,
        )
        return 1

    if filled < expected and args.allow_partial:
        print(
            f"Warning: partial export — {filled}/{expected} ayahs with text_kk.",
            file=sys.stderr,
        )

    payload = {
        "schema": SCHEMA,
        "attribution_kk": att,
        "source_detail": det,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "filled": filled,
            "translit_filled": translit_filled,
            "total_quran_rows": total_quran_rows,
        },
        "data": {"surahs": surahs_out},
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    if args.compact:
        out_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    else:
        out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(
        f"OK: {filled} ayahs (translit={translit_filled}) → {out_path} ({out_path.stat().st_size} bytes)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
