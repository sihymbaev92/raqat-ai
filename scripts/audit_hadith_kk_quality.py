#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Қазақша хадис аудармасының сапасын эвристикалық тексеру.

Мақсат: Gemini «ойлау» мәтіні / ағылшынша сіңімдерін табу (латын үлесі жоғары жолдар).

Мысал:
  .venv/bin/python scripts/audit_hadith_kk_quality.py --db ../global_clean.db
  .venv/bin/python scripts/audit_hadith_kk_quality.py --db ../global_clean.db --write-ids data/hadith_kk_repair_ids.txt
"""
from __future__ import annotations

import argparse
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

META_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("the_user_wants", re.compile(r"The user wants", re.I)),
    ("the_provided_arabic", re.compile(r"The provided Arabic", re.I)),
    ("therefore_it_does", re.compile(r"Therefore, it does", re.I)),
    ("i_need_to_extract", re.compile(r"I need to extract", re.I)),
    ("lets_reevaluate", re.compile(r"Let's re-evaluate", re.I)),
    ("rule_hash", re.compile(r"rule #\d+", re.I)),
    ("revised_draft", re.compile(r"Revised Draft", re.I)),
]


def latin_ratio(text: str) -> float:
    if not text.strip():
        return 0.0
    lat = sum(1 for c in text if "a" <= c.lower() <= "z")
    return lat / max(len(text), 1)


def load_from_sqlite(db_path: Path) -> list[tuple[int, str, str]]:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute(
            """
            SELECT id, source, text_kk
            FROM hadith
            WHERE source IN ('Sahih al-Bukhari', 'Sahih Muslim')
            """
        )
        return [(int(r["id"]), str(r["source"] or ""), str(r["text_kk"] or "")) for r in cur.fetchall()]
    finally:
        conn.close()


def main() -> int:
    p = argparse.ArgumentParser(description="Audit hadith text_kk for English/meta leakage heuristics.")
    p.add_argument("--db", type=str, default=str(ROOT / "global_clean.db"))
    p.add_argument("--latin-threshold", type=float, default=0.25, help="Flag row if latin/total > this (len>50)")
    p.add_argument("--top", type=int, default=15, help="Print top N suspicious rows")
    p.add_argument(
        "--write-ids",
        type=str,
        default="",
        help="Осы файлға күдікті hadith.id тізімін жазу (бір жолда бір сан, # түсініктеме)",
    )
    args = p.parse_args()

    db_path = Path(args.db)
    if not db_path.is_file():
        print(f"DB табылмады: {db_path}", file=sys.stderr)
        return 1

    rows = load_from_sqlite(db_path)
    thr = float(args.latin_threshold)
    suspicious: list[tuple[float, int, str]] = []
    pattern_hits: dict[str, int] = {k: 0 for k, _ in META_PATTERNS}

    for hid, src, kk in rows:
        t = kk or ""
        for key, pat in META_PATTERNS:
            if pat.search(t):
                pattern_hits[key] += 1
        r = latin_ratio(t)
        if len(t) > 50 and r > thr:
            suspicious.append((r, hid, src or ""))

    suspicious.sort(key=lambda x: -x[0])

    total = len(rows)
    print(f"=== hadith text_kk audit (сахих Бұхари+Муслим) ===")
    print(f"Жолдар саны: {total}")
    print(f"Күдікті (латын > {thr*100:.0f}% және ұзындығы >50): {len(suspicious)}")
    print("Мета үлгілері:", {k: v for k, v in pattern_hits.items() if v})
    print()

    top = max(0, int(args.top))
    for r, hid, src in suspicious[:top]:
        print(f"ratio={r:.3f} id={hid} source={src[:40]}")

    if args.write_ids:
        out_path = Path(args.write_ids)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        lines = [
            "# hadith.id — audit_hadith_kk_quality.py (latin ratio + meta patterns)",
            *[str(x[1]) for x in suspicious],
        ]
        out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print(f"\nЖазылды: {out_path} ({len(suspicious)} id)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
