#!/usr/bin/env python3
"""halaldamu.kz — өнімдер сайтта бар ма, қайда (қысқа зонд)."""
from __future__ import annotations

import json
import re
import sys
import urllib.request

UA = "Raqat-Halal-Probe/1.0 (+https://rahatomir.com)"
ORIGIN = "https://halaldamu.kz"


def fetch(url: str, timeout: float = 25.0) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return int(resp.status), resp.read().decode("utf-8", errors="replace")


def main() -> int:
    print("== halal-bot routes ==")
    _, body = fetch(f"{ORIGIN}/wp-json/halal-bot/v1")
    data = json.loads(body)
    routes = sorted(data.get("routes", {}).keys())
    print("routes:", routes)

    print("\n== products API sample ==")
    st, body = fetch(f"{ORIGIN}/wp-json/halal-bot/v1/products?per_page=3")
    print(st, body[:300])

    print("\n== company card sample (API) ==")
    st, body = fetch(f"{ORIGIN}/wp-json/halal-bot/v1/companies?per_page=1")
    d = json.loads(body)
    items = d.get("items") or []
    if items:
        c = items[0]
        print("company keys:", sorted(c.keys())[:30])
        for k in ("products", "product_count", "goods", "barcodes"):
            if k in c:
                print(k, ":", str(c[k])[:200])

    print("\n== HTML paths ==")
    for path in (
        "/",
        "/products/",
        "/product/",
        "/goods/",
        "/catalog/",
        "/kk/products/",
        "/ru/products/",
    ):
        try:
            st, html = fetch(f"{ORIGIN}{path}")
            title = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
            print(f"{path} -> {st} title={title.group(1)[:60] if title else '?'} len={len(html)}")
        except Exception as exc:
            print(f"{path} -> ERR {exc}")

    print("\n== sitemap hints ==")
    try:
        st, xml = fetch(f"{ORIGIN}/sitemap.xml")
        for tag in ("product", "goods", "barcode"):
            n = len(re.findall(tag, xml, re.I))
            if n:
                print(f"sitemap.xml contains '{tag}': {n}")
    except Exception as exc:
        print("sitemap:", exc)

    print("\n== scan companies for non-empty products ==")
    found = 0
    for page in range(1, 6):
        st, body = fetch(f"{ORIGIN}/wp-json/halal-bot/v1/companies?per_page=100&page={page}")
        d = json.loads(body)
        for c in d.get("items") or []:
            prods = c.get("products")
            if prods:
                found += 1
                print(f"id={c.get('id')} title={str(c.get('title'))[:40]} products_len={len(prods)}")
                if found >= 5:
                    break
        if found >= 5:
            break
    print("non_empty_products_in_sample:", found)

    print("\n== company HTML page ==")
    st, body = fetch(f"{ORIGIN}/wp-json/halal-bot/v1/companies?per_page=1")
    slug = (json.loads(body).get("items") or [{}])[0].get("slug")
    cid = (json.loads(body).get("items") or [{}])[0].get("id")
    for path in (f"/company/{slug}/", f"/companies/{slug}/", f"/kk/company/{slug}/"):
        try:
            st, html = fetch(f"{ORIGIN}{path}")
            for kw in ("product", "barcode", "штрих", "өнім"):
                n = len(re.findall(kw, html, re.I))
                if n:
                    print(f"{path} '{kw}' hits={n}")
        except Exception as exc:
            print(f"{path} -> {exc}")

    print("\n== homepage embedded JSON hints ==")
    st, html = fetch(f"{ORIGIN}/")
    for pat in (
        r"halal-bot/v1/products",
        r'"products"\s*:\s*\[',
        r"barcode",
        r"wp-json/halal-bot",
    ):
        m = re.search(pat, html, re.I)
        print(pat, "->", "yes" if m else "no")

    print("\n== additives API ==")
    st, body = fetch(f"{ORIGIN}/wp-json/halal-bot/v1/additives?per_page=3")
    print(st, body[:400])

    print("\n== company detail API ==")
    _, body = fetch(f"{ORIGIN}/wp-json/halal-bot/v1/companies?per_page=1")
    cid = (json.loads(body).get("items") or [{}])[0].get("id")
    st, body = fetch(f"{ORIGIN}/wp-json/halal-bot/v1/companies/{cid}")
    detail = json.loads(body)
    print("detail keys:", sorted(detail.keys())[:25])
    print("products field:", detail.get("products"))

    print("\n== wp post types (product-related) ==")
    try:
        _, body = fetch(f"{ORIGIN}/wp-json/wp/v2/types")
        types = json.loads(body)
        for name, meta in types.items():
            rest = (meta.get("rest_base") or name).lower()
            if any(x in name.lower() or x in rest for x in ("product", "good", "barcode", "company")):
                print(f"  type {name!r} rest_base={meta.get('rest_base')}")
    except Exception as exc:
        print("types:", exc)

    return 0


if __name__ == "__main__":
    sys.exit(main())
