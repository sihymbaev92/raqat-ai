#!/usr/bin/env python3
"""Inspect muftyat Hajj PDF before import."""
from __future__ import annotations

import re
import sys
import urllib.request
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
PDF_URL = "https://www.muftyat.kz/media/muftyat/982258_1387348468.pdf"
PDF_LOCAL = ROOT / "data" / "muftyat-hajj.pdf"
UA = {"User-Agent": "Mozilla/5.0 (compatible; RAQAT-import/1.0)"}


def download() -> None:
    PDF_LOCAL.parent.mkdir(parents=True, exist_ok=True)
    if PDF_LOCAL.exists() and PDF_LOCAL.stat().st_size > 50_000:
        print(f"exists {PDF_LOCAL} ({PDF_LOCAL.stat().st_size} bytes)")
        return
    print("downloading", PDF_URL)
    req = urllib.request.Request(PDF_URL, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        PDF_LOCAL.write_bytes(r.read())
    print("saved", PDF_LOCAL.stat().st_size)


def main() -> None:
    download()
    import fitz

    doc = fitz.open(str(PDF_LOCAL))
    print("pages", doc.page_count)
    for i in range(min(15, doc.page_count)):
        text = doc[i].get_text("text").strip()
        preview = re.sub(r"\s+", " ", text)[:120]
        print(f"--- page {i+1} len={len(text)} ---")
        print(preview)
    # scan for TOC keywords
    for i in range(doc.page_count):
        text = doc[i].get_text("text").lower()
        if "мазмұн" in text or "talbiyah" in text or "тәлбия" in text or "talbiya" in text:
            print(f"keyword hit page {i+1}")
    doc.close()


if __name__ == "__main__":
    main()
