#!/usr/bin/env python3
"""Probe muftyat.kz tajweed book series."""
import json
import re
import sys
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

UA = {"User-Agent": "Mozilla/5.0 (compatible; RAQAT-probe/1.0)"}
BASE = "https://www.muftyat.kz"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", "replace")


def probe_book(book_id: str) -> dict:
    url = f"{BASE}/kk/book/{book_id}/"
    html = fetch(url)
    title_m = re.search(r"<h1[^>]*>([^<]+)</h1>", html, re.I)
    if not title_m:
        title_m = re.search(r"<title>([^<]+)</title>", html, re.I)
    title = re.sub(r"\s+", " ", title_m.group(1)).strip() if title_m else "?"
    # reader pages
    pages = sorted(set(re.findall(r'href="(/kk/book/{}/page/\d+/?)"'.format(book_id), html)))
    chapters = sorted(set(re.findall(r'href="(/kk/book/{}/chapter/\d+/?)"'.format(book_id), html)))
    imgs = re.findall(r'<img[^>]+src="([^"]+)"', html)
    desc = ""
    dm = re.search(r'class="[^"]*book-desc[^"]*"[^>]*>(.*?)</div>', html, re.S | re.I)
    if dm:
        desc = re.sub(r"<[^>]+>", " ", dm.group(1))
        desc = re.sub(r"\s+", " ", desc).strip()[:200]
    return {
        "id": book_id,
        "title": title,
        "pages": len(pages),
        "page_urls": pages[:5],
        "chapters": len(chapters),
        "chapter_urls": chapters[:5],
        "images": len(imgs),
        "sample_imgs": imgs[:3],
        "desc": desc,
    }


def probe_page(url: str) -> dict:
    html = fetch(url)
    imgs = re.findall(r'<img[^>]+src="([^"]+)"', html)
    text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.S | re.I)
    body_m = re.search(r'<div[^>]+class="[^"]*book-page[^"]*"[^>]*>(.*?)</div>\s*(?:<div|$)', text, re.S | re.I)
    if not body_m:
        body_m = re.search(r'<article[^>]*>(.*?)</article>', text, re.S | re.I)
    plain = ""
    if body_m:
        plain = re.sub(r"<[^>]+>", "\n", body_m.group(1))
        plain = re.sub(r"\n{3,}", "\n\n", plain).strip()[:500]
    return {"url": url, "images": imgs, "text_preview": plain}


def main() -> None:
    ids = [
        "36023", "28669", "28670", "28671", "28672", "28673", "28674", "28676",
        "28695", "28696", "28697", "28705", "28709", "28710", "28711", "28712",
    ]
    results = []
    for bid in ids:
        try:
            info = probe_book(bid)
            results.append(info)
            print(f"{bid}: {info['title'][:60]} | pages={info['pages']} chapters={info['chapters']} imgs={info['images']}")
        except Exception as e:
            print(f"{bid}: ERROR {e}")

    # dump json for inspection
    with open("data/muftyat-tajweed-probe.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # probe first page of tajweed-looking books
    tajweed_ids = [r for r in results if any(k in r["title"].lower() for k in ["тәжуид", "таджвид", "tajweed", "құран оқ", "arab", "әріп"])]
    if not tajweed_ids:
        tajweed_ids = [r for r in results if r["pages"] > 0][:3]
    print("\n--- sample pages ---")
    for book in tajweed_ids[:3]:
        if book["page_urls"]:
            sp = probe_page(BASE + book["page_urls"][0])
            print(json.dumps(sp, ensure_ascii=False, indent=2)[:1500])


if __name__ == "__main__":
    main()
