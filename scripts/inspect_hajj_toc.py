#!/usr/bin/env python3
"""Extract TOC from muftyat Hajj PDF."""
from __future__ import annotations

import re
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
PDF_LOCAL = ROOT / "data" / "muftyat-hajj.pdf"


def main() -> None:
    import fitz

    doc = fitz.open(str(PDF_LOCAL))
    for i in range(doc.page_count):
        text = doc[i].get_text("text")
        low = text.lower()
        if "мазмұн" in low or "содержание" in low:
            print(f"=== TOC candidate page {i+1} ===")
            print(text[:3000])
    # find talbiyah pages
    for i in range(doc.page_count):
        text = doc[i].get_text("text")
        if re.search(r"тәлбия|talbiyah|ләббәйк", text, re.I):
            t = re.sub(r"\s+", " ", text.strip())[:100]
            print(f"talbiyah page {i+1}: {t}")
    doc.close()


if __name__ == "__main__":
    main()
