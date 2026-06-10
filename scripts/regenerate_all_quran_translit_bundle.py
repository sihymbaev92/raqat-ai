#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
114 сүре: `quran-kk-from-db.json` ішіндегі әр аяттың `translit` =
`services.quran_translit.transliterate_arabic_to_kazakh` (Uthmani `quran-uthmani-full.json`).

`text_kk` және басқа өрістер сақталады (тек translit жаңарады).

Қолдану (репо түбінен):
  .venv/bin/python scripts/regenerate_all_quran_translit_bundle.py
  .venv/bin/python scripts/regenerate_all_quran_translit_bundle.py --dry-run

Қосымша SQLite (`text_ar` толты бар жолдар):
  .venv/bin/python scripts/regenerate_all_quran_translit_bundle.py --db global_clean.db
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UTH = ROOT / "mobile" / "assets" / "bundled" / "quran-uthmani-full.json"
BUNDLE = ROOT / "mobile" / "assets" / "bundled" / "quran-kk-from-db.json"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from db.migrations import run_schema_migrations  # noqa: E402
from services.quran_translit import transliterate_arabic_to_kazakh  # noqa: E402

SCHEMA = "raqat_quran_kk_bundle_v3_algo_translit"
TAG = "translit: full Uthmani → services/quran_translit.py (all 114 surahs)"


def load_uthmani_map() -> dict[tuple[int, int], str]:
    raw = json.loads(UTH.read_text(encoding="utf-8"))
    data = raw.get("data") or {}
    surahs = data.get("surahs") or []
    m: dict[tuple[int, int], str] = {}
    for s in surahs:
        sn = int(s["number"])
        for a in s.get("ayahs") or []:
            m[(sn, int(a["numberInSurah"]))] = (a.get("text") or "").strip()
    return m


def load_kk_map_from_bundle(bundle: dict) -> dict[tuple[int, int], str]:
    out: dict[tuple[int, int], str] = {}
    for s in bundle.get("data", {}).get("surahs") or []:
        sn = int(s["number"])
        for a in s.get("ayahs") or []:
            n = int(a["numberInSurah"])
            kk = (a.get("text_kk") or "").strip()
            if kk:
                out[(sn, n)] = kk
    return out


def rebuild_bundle(dry_run: bool) -> tuple[dict, int, int]:
    umap = load_uthmani_map()
    if not umap:
        raise SystemExit(f"No Uthmani ayahs in {UTH}")

    old = json.loads(BUNDLE.read_text(encoding="utf-8"))
    kk_map = load_kk_map_from_bundle(old)

    surahs_out: list[dict] = []
    n_changed = 0
    n_total = 0

    for sn in range(1, 115):
        pairs = sorted((a, t) for (s, a), t in umap.items() if s == sn)
        if not pairs:
            continue
        ayahs_out: list[dict] = []
        for an, ar in pairs:
            n_total += 1
            tr_new = transliterate_arabic_to_kazakh(ar) if ar else ""
            kk = kk_map.get((sn, an), "")
            old_tr = ""
            for s0 in old.get("data", {}).get("surahs") or []:
                if int(s0["number"]) != sn:
                    continue
                for row in s0.get("ayahs") or []:
                    if int(row["numberInSurah"]) == an:
                        old_tr = (row.get("translit") or "").strip()
                        break
            if old_tr != (tr_new or "").strip():
                n_changed += 1
            item: dict = {"numberInSurah": an, "text_kk": kk}
            if tr_new:
                item["translit"] = tr_new
            ayahs_out.append(item)
        surahs_out.append({"number": sn, "ayahs": ayahs_out})

    filled = sum(len(s["ayahs"]) for s in surahs_out)
    translit_filled = sum(
        1 for s in surahs_out for a in s["ayahs"] if (a.get("translit") or "").strip()
    )

    att = (old.get("attribution_kk") or "").strip() or None
    det_old = (old.get("source_detail") or "").strip()
    det = det_old
    if TAG not in det:
        det = f"{det} | {TAG}".strip(" |") if det else TAG

    out = {
        "schema": SCHEMA,
        "attribution_kk": att,
        "source_detail": det,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "filled": filled,
            "translit_filled": translit_filled,
            "total_quran_rows": filled,
        },
        "data": {"surahs": surahs_out},
    }

    if not dry_run:
        BUNDLE.write_text(
            json.dumps(out, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
            newline="\n",
        )
    return out, n_changed, n_total


def update_sqlite(db_path: Path, umap: dict[tuple[int, int], str], dry_run: bool) -> int:
    if not db_path.is_file():
        print(f"DB not found: {db_path}", file=sys.stderr)
        return 1
    run_schema_migrations(str(db_path))
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            "SELECT surah, ayah, text_ar, translit FROM quran ORDER BY surah, ayah"
        ).fetchall()
    except sqlite3.Error as e:
        print(f"quran read: {e}", file=sys.stderr)
        conn.close()
        return 1
    n_up = 0
    for r in rows:
        s, a = int(r["surah"]), int(r["ayah"])
        ar = (r["text_ar"] or "").strip() or umap.get((s, a), "")
        if not ar:
            continue
        new_t = transliterate_arabic_to_kazakh(ar)
        old_t = (r["translit"] or "").strip()
        if old_t == new_t.strip():
            continue
        n_up += 1
        if not dry_run:
            conn.execute(
                "UPDATE quran SET translit = ?, updated_at = datetime('now') WHERE surah = ? AND ayah = ?",
                (new_t, s, a),
            )
    if not dry_run:
        conn.commit()
    conn.close()
    print(f"sqlite translit rows updated: {n_up} (dry_run={dry_run})", file=sys.stderr)
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Regenerate all Quran Kazakh translit from Uthmani + algorithm.")
    p.add_argument("--dry-run", action="store_true", help="Do not write files")
    p.add_argument("--db", default="", help="Optional SQLite path to UPDATE quran.translit")
    args = p.parse_args()

    umap = load_uthmani_map()
    _, n_changed, n_total = rebuild_bundle(dry_run=bool(args.dry_run))
    print(
        f"bundle: {n_total} ayahs from Uthmani; translit lines changed vs previous: {n_changed} "
        f"(write={'no' if args.dry_run else str(BUNDLE)})",
        file=sys.stderr,
    )

    if args.db.strip():
        dbp = Path(args.db.strip())
        if not dbp.is_absolute():
            dbp = ROOT / dbp
        return update_sqlite(dbp, umap, dry_run=bool(args.dry_run))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
