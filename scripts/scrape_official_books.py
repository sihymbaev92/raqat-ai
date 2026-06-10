#!/usr/bin/env python3
"""Scrape fatua.kz/kk/books/ and muftyat.kz/kk/books/ into bundled JSON."""
from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from html import unescape
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "mobile" / "assets" / "bundled" / "official-books-catalog.json"
UA = {"User-Agent": "Mozilla/5.0 (compatible; RAQAT/1.0; +https://rahatomir.com)"}


def fetch(url: str) -> str:
    """curl.exe — Windows/Python urllib кейінде тұрақты."""
    try:
        proc = subprocess.run(
            ["curl.exe", "-s", "-L", url, "-H", f"User-Agent: {UA['User-Agent']}"],
            capture_output=True,
            timeout=90,
            check=False,
        )
        if proc.returncode == 0 and proc.stdout:
            return proc.stdout.decode("utf-8", "replace")
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        pass
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.read().decode("utf-8", "replace")


def abs_url(origin: str, href: str) -> str:
    if href.startswith("http"):
        return href
    if not href.startswith("/"):
        href = "/" + href
    return origin + href


def clean_title(raw: str) -> str:
    t = unescape(re.sub(r"\s+", " ", raw)).strip()
    t = t.strip('"').strip()
    return t


def scrape_fatua(html: str) -> list[dict]:
    books: list[dict] = []
    seen: set[str] = set()
    for block in re.split(r'<div class="book"\s*>', html):
        if "book__title" not in block:
            continue
        href_m = re.search(r'href="(/kk/books/read/[^"]+)"', block)
        title_m = re.search(r'class="book__title"[^>]*>\s*<a[^>]*>(.*?)</a>', block, re.S | re.I)
        cat_m = re.search(r'class="book__subtitle"[^>]*>([^<]+)<', block)
        if not href_m or not title_m:
            continue
        href = href_m.group(1)
        slug = href.rstrip("/").split("/")[-1]
        if slug in seen:
            continue
        seen.add(slug)
        title = clean_title(re.sub(r"<[^>]+>", " ", title_m.group(1)))
        category = clean_title(cat_m.group(1)) if cat_m else ""
        books.append(
            {
                "id": slug,
                "title": title,
                "category": category,
                "url": abs_url("https://fatua.kz", href),
                "site": "fatua",
            }
        )
    return books


def scrape_muftyat_page(html: str) -> list[dict]:
    books: list[dict] = []
    seen: set[str] = set()
    for m in re.finditer(
        r'class="textNewsP"\s*>\s*<a href="/kk/book/(\d+)/">([^<]+)</a>',
        html,
        flags=re.I,
    ):
        bid, title = m.group(1), clean_title(m.group(2))
        if bid in seen:
            continue
        seen.add(bid)
        books.append(
            {
                "id": bid,
                "title": title,
                "category": "",
                "url": f"https://www.muftyat.kz/kk/book/{bid}/",
                "site": "muftyat",
            }
        )
    return books


def scrape_muftyat_all() -> list[dict]:
    all_books: list[dict] = []
    seen: set[str] = set()
    page = 1
    while page <= 20:
        url = f"https://www.muftyat.kz/kk/books/?page={page}&lang=all&expertise=1"
        html = fetch(url)
        page_books = scrape_muftyat_page(html)
        if not page_books:
            break
        added = 0
        for b in page_books:
            if b["id"] in seen:
                continue
            seen.add(b["id"])
            all_books.append(b)
            added += 1
        if added == 0:
            break
        max_page = 1
        for pm in re.finditer(r'href="\?page=(\d+)&lang=all&expertise=1"', html):
            max_page = max(max_page, int(pm.group(1)))
        if page >= max_page:
            break
        page += 1
    return all_books


def scrape_fatua_book_detail(page_url: str) -> dict:
    html = fetch(page_url)
    pdf_m = re.search(r'href="(/media/upload/books/[^"]+\.pdf)"', html, re.I)
    cover_m = re.search(r'book-page__image[^>]*>\s*<img src="([^"]+)"', html, re.S | re.I)
    author_m = re.search(r"<span>Автор:</span>\s*([^<]+)", html, re.I)
    year_m = re.search(r"<span>Шығарылған жылы:</span>\s*([^<]+)", html, re.I)
    about_m = re.search(
        r'book-page__aboutbook[^>]*>.*?class="typography"[^>]*>(.*?)</div>',
        html,
        re.S | re.I,
    )
    pdf_url = abs_url("https://fatua.kz", pdf_m.group(1)) if pdf_m else ""
    cover_url = abs_url("https://fatua.kz", cover_m.group(1)) if cover_m else ""
    author = clean_title(author_m.group(1)) if author_m else ""
    year = clean_title(year_m.group(1)) if year_m else ""
    if author.lower() == "none":
        author = ""
    about_raw = unescape(re.sub(r"<[^>]+>", " ", about_m.group(1))) if about_m else ""
    about = clean_title(about_raw)
    if about.lower() == "none":
        about = ""
    return {
        "pdfUrl": pdf_url,
        "coverUrl": cover_url,
        "author": author,
        "publishedYear": year,
        "about": about,
    }


def enrich_fatua_books(books: list[dict]) -> list[dict]:
    out: list[dict] = []
    for i, book in enumerate(books, 1):
        detail = scrape_fatua_book_detail(book["url"])
        merged = {**book, **detail}
        out.append(merged)
        pdf_ok = "yes" if detail.get("pdfUrl") else "no"
        print(f"  [{i}/{len(books)}] {book['title'][:48]}… pdf={pdf_ok}", file=sys.stderr)
    return out


def scrape_fatua_all() -> list[dict]:
    books = scrape_fatua(fetch("https://fatua.kz/kk/books/"))
    # Category pages share same books often; fetch categories for completeness
    html = fetch("https://fatua.kz/kk/books/")
    cat_ids = sorted(set(re.findall(r"\?category_id=(\d+)", html)))
    seen = {b["id"] for b in books}
    for cid in cat_ids:
        cat_html = fetch(f"https://fatua.kz/kk/books/?category_id={cid}")
        for b in scrape_fatua(cat_html):
            if b["id"] in seen:
                continue
            seen.add(b["id"])
            books.append(b)
    return books


def main() -> None:
    fatua = enrich_fatua_books(scrape_fatua_all())
    muftyat = scrape_muftyat_all()
    payload = {
        "syncedAt": __import__("datetime").datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "sources": {
            "fatua": {
                "label": "Fatua.kz",
                "listUrl": "https://fatua.kz/kk/books/",
                "count": len(fatua),
                "books": fatua,
            },
            "muftyat": {
                "label": "Muftyat.kz",
                "listUrl": "https://www.muftyat.kz/kk/books/",
                "count": len(muftyat),
                "books": muftyat,
            },
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}", file=sys.stderr)
    print(f"fatua={len(fatua)} muftyat={len(muftyat)}", file=sys.stderr)


if __name__ == "__main__":
    main()
