#!/usr/bin/env python3
"""Probe muftyat.kz Hajj book (28689) structure."""
from __future__ import annotations

import re
import sys
import urllib.request
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
BOOK_ID = "28689"
url = f"https://www.muftyat.kz/kk/book/{BOOK_ID}/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; RAQAT/1.0)"})
html = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")
out = ROOT / "data" / f"muftyat-book-{BOOK_ID}.html"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding="utf-8")
print("saved", out, "len", len(html))

for pat in [
    r"https?://[^\"']+\.pdf",
    r"/media/muftyat/[^\"']+",
]:
    ms = sorted(set(re.findall(pat, html, re.I)))
    if ms:
        print("PDF/media:", ms[:10])

pages = sorted(set(re.findall(rf"/kk/book/{BOOK_ID}/(\d+)/", html)), key=int)
print("page links", len(pages), pages[:5], "...", pages[-5:] if pages else [])

toc = re.findall(rf'<a href="/kk/book/{BOOK_ID}/\d+/">([^<]+)</a>', html)
print("toc", len(toc))
for t in toc[:25]:
    print(" -", t.strip())

imgs = re.findall(r'src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"', html, re.I)
print("imgs on landing", len(imgs))
for i in imgs[:10]:
    print(" img:", i)
