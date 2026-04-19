#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hadith.id тізімі бойынша SQLite-дан жолдарды JSON + CSV экспорттау (жөндеу/талдау үшін).

Мысал:
  .venv/bin/python scripts/export_hadith_ids_snapshot.py \\
    --db global_clean.db --ids-file data/hadith_kk_repair_ids.txt
"""
from __future__ import annotations

import argparse
import csv
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load_ids(path: Path) -> list[int]:
    out: list[int] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        out.append(int(s))
    return out


def main() -> int:
    p = argparse.ArgumentParser(description="Export hadith rows by id list to JSON + CSV.")
    p.add_argument("--db", type=str, default=str(ROOT / "global_clean.db"))
    p.add_argument("--ids-file", type=str, default=str(ROOT / "data/hadith_kk_repair_ids.txt"))
    p.add_argument("--out-json", type=str, default=str(ROOT / "data/hadith_kk_repair_export.json"))
    p.add_argument("--out-csv", type=str, default=str(ROOT / "data/hadith_kk_repair_export.csv"))
    args = p.parse_args()

    db_path = Path(args.db)
    ids_path = Path(args.ids_file)
    if not db_path.is_file():
        print(f"DB табылмады: {db_path}", file=sys.stderr)
        return 1
    if not ids_path.is_file():
        print(f"ids файл табылмады: {ids_path}", file=sys.stderr)
        return 1

    ids = _load_ids(ids_path)
    if not ids:
        print("id тізімі бос.", file=sys.stderr)
        return 1

    placeholders = ",".join("?" * len(ids))
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute(
            f"""
            SELECT id, source, text_ar, text_kk, text_ru, text_en, grade, updated_at
            FROM hadith
            WHERE id IN ({placeholders})
            ORDER BY id
            """,
            ids,
        )
        rows = [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

    found_ids = {r["id"] for r in rows}
    missing = [i for i in ids if i not in found_ids]
    if missing:
        print(f"Ескерту: табылмаған id: {missing[:10]}{'...' if len(missing) > 10 else ''}", file=sys.stderr)

    out_json = Path(args.out_json)
    out_csv = Path(args.out_csv)
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_csv.parent.mkdir(parents=True, exist_ok=True)

    try:
        ids_rel = str(ids_path.relative_to(ROOT))
    except ValueError:
        ids_rel = str(ids_path)
    payload = {
        "source_ids_file": ids_rel,
        "db": str(db_path),
        "count_requested": len(ids),
        "count_exported": len(rows),
        "rows": rows,
    }
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    fieldnames = ["id", "source", "text_ar", "text_kk", "text_ru", "text_en", "grade", "updated_at"]
    with out_csv.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k) or "" for k in fieldnames})

    print(f"JSON: {out_json} ({len(rows)} жол)")
    print(f"CSV:  {out_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
