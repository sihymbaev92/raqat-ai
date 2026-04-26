#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Find textKk rows with LLM meta / English leakage in hadith-from-db.json."""
from __future__ import annotations

import json
import re
import sys
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PATS = [
    r"The user wants",
    r"The user asked",
    r"The provided Arabic",
    r"Therefore, it does",
    r"I need to extract",
    r"rule #\d+",
    r"Revised Draft",
    r"as per rule",
    r"Let's re-evaluate",
    r"Let's combine",
    r"I should remove",
    r"I need to be careful",
    r"I need to remove",
    r"This salutation is an addition",
    r"\* additions\.",
    r"following all rules",
    r"Арабша мәтін:",
    r"^\" as per rule",
    r"usually translated",
    r"if possible, but",
    r"more culturally appropriate",
    r"may Allah be pleased",
    r"indicating who is speaking",
    r"might be more precise",
    r"The core message",
    r"No explanations, tafsir",
    r"\(This sounds more natural",
    r"\(The phrase `",
    r"\(retribution\) is the core",
    r"narrator's doubt",
]
CRE = re.compile("|".join(f"(?:{x})" for x in PATS), re.I | re.M)

_CYR = re.compile(r"[\u0400-\u04FF]")


def latin_ratio(text: str) -> float:
    if not text.strip():
        return 0.0
    lat = sum(1 for c in text if "a" <= c.lower() <= "z")
    return lat / max(len(text), 1)


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan hadith textKk for meta/English garbage.")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero if any issue is found.")
    parser.add_argument("--top", type=int, default=40)
    args = parser.parse_args()
    path = ROOT / "mobile" / "assets" / "bundled" / "hadith-from-db.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    hadiths = data.get("hadiths") or []
    meta_ids: list[str] = []
    latin_ids: list[tuple[float, str]] = []
    for h in hadiths:
        hid = str(h.get("id") or "")
        kk = str(h.get("textKk") or "")
        if CRE.search(kk):
            meta_ids.append(hid)
        if len(kk) > 55 and latin_ratio(kk) > 0.28 and len(_CYR.findall(kk)) < 40:
            latin_ids.append((latin_ratio(kk), hid))

    latin_ids.sort(key=lambda x: -x[0])
    print("pattern_meta", len(meta_ids))
    for i in meta_ids:
        print(i)
    print("---latin_weak", len(latin_ids))
    for r, i in latin_ids[: max(0, args.top)]:
        print(f"{r:.3f}", i)
    if args.strict and (meta_ids or latin_ids):
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
