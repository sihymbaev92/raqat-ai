#!/usr/bin/env python3
import re
import sys
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

UA = {"User-Agent": "Mozilla/5.0"}
html = urllib.request.urlopen(
    urllib.request.Request("https://www.muftyat.kz/kk/books/", headers=UA), timeout=25
).read().decode("utf-8", "replace")

# extract book cards: id + title nearby
blocks = re.split(r'<div[^>]*class="[^"]*book[^"]*"', html, flags=re.I)
books = []
for block in blocks[1:]:
    id_m = re.search(r'/kk/book/(\d+)/', block)
    title_m = re.search(r'<(?:h\d|a|span)[^>]*>([^<]{3,120})</', block)
    if id_m and title_m:
        title = re.sub(r"\s+", " ", title_m.group(1)).strip()
        books.append((id_m.group(1), title))

seen = set()
for bid, title in books:
    if bid in seen:
        continue
    seen.add(bid)
    low = title.lower()
    if any(k in low for k in ["тәжуид", "таджвид", "tajweed", "құран оқ", "arab", "әріп", "оқу"]):
        print(f"{bid}\t{title}")

print("\n--- all books (first 80) ---")
for bid, title in list(dict(books).items())[:80]:
    print(f"{bid}\t{title}")
