#!/usr/bin/env python3
import csv
import importlib.util
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
products = json.loads((ROOT / "supermarket-site/data/products.json").read_text(encoding="utf-8"))["products"]
halal = set()
with (ROOT / "data/halal_products_seed_kz.csv").open(encoding="utf-8") as f:
    for row in csv.DictReader(f):
        g = re.sub(r"\D", "", row.get("gtin") or "")
        if g:
            halal.add(g)


def norm(b):
    return re.sub(r"\D", "", str(b or ""))


bc = Counter()
for p in products:
    code = norm(p.get("barcode"))
    if code in halal:
        bc["exact"] += 1
    elif any(code.endswith(h) or h.endswith(code) for h in halal if len(code) >= 8):
        bc["partial"] += 1
print("exact gtin match:", bc["exact"])
print("partial:", bc["partial"])

brands = set()
titles = []
with (ROOT / "data/halal_products_seed_kz.csv").open(encoding="utf-8") as f:
    for row in csv.DictReader(f):
        b = (row.get("brand") or "").strip().lower()
        if len(b) >= 4:
            brands.add(b)
        t = (row.get("title_kk") or "").strip().lower()
        if len(t) >= 6:
            titles.append(t)

title_hits = 0
for p in products:
    t = (p.get("title") or "").lower()
    if any(b in t for b in brands):
        title_hits += 1
print("title contains halal brand:", title_hits, "brands", len(brands))

EXTRA = [
    ("sweets", ("orbit", "орбит", "mentos", "ментос", "alpengold", "альпен", "резинк", "жев", "драже", "карамель", "жвачк")),
    ("meat", ("сервелат", "докторск", "колбас", "ветчин", "сосиск", "salami", "ham ")),
    ("milk", ("творож", "простоквашино", "активиа", "данон", "danone", "danissimo", "даниссимо", "danonino", "данонино")),
    ("drinks", ("напиток", "сок ", "вода", "компот", "лимонад", "schweppes", "pepsi")),
    ("household", ("крем ", "краска", "бальзам", "зубн", "дезодор", "освеж", "порошок", "моющ")),
    ("grocery", ("соус", "кетчуп", "mayo", "майонез", "томатн", "пюре")),
]
spec = importlib.util.spec_from_file_location("b", ROOT / "scripts/build_timur_supermarket_products.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
changed = 0
for p in products:
    if p.get("category") != "other":
        continue
    hay = f"{p.get('title', '')} {(p.get('tags') or [''])[-1]}".lower()
    for cat, kws in EXTRA:
        if any(k in hay for k in kws):
            changed += 1
            break
print("would recategorize from other with new rules:", changed)
