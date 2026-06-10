#!/usr/bin/env python3
"""Analyze text quality per Hajj PDF page."""
from __future__ import annotations

import re
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "data" / "muftyat-hajj.pdf"


def score_text(text: str) -> tuple[int, float]:
    t = text.strip()
    if not t:
        return 0, 0.0
    kk = len(re.findall(r"[а-яёәіңғүұқөһ]", t, re.I))
    arab = len(re.findall(r"[\u0600-\u06FF]", t))
    garbage = len(re.findall(r"[\u0180-\u024F\u0300-\u036F\u0480-\u04FF\uF000-\uF8FF]", t))
    letters = kk + arab + len(re.findall(r"[a-z]", t, re.I))
    ratio = letters / max(len(t), 1)
    return len(t), ratio - garbage / max(len(t), 1)


def main() -> None:
    import fitz

    doc = fitz.open(str(PDF))
    low_text = []
    for i in range(doc.page_count):
        text = doc[i].get_text("text")
        n, ratio = score_text(text)
        if n < 80 or ratio < 0.35:
            low_text.append(i + 1)
    print("low quality pages", len(low_text), "of", doc.page_count)
    print("sample low:", low_text[:30])
    print("sample high pages:", [p for p in range(1, 50) if p not in low_text][:20])
    doc.close()


if __name__ == "__main__":
    main()
