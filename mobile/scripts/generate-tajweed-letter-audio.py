#!/usr/bin/env python3
"""Download letter name + harakat (fatha/kesra/damma) MP3s from arabic-online.ru.

Regenerate:
  python scripts/generate-tajweed-letter-audio.py
  node scripts/generate-tajweed-letter-asset-map.cjs
"""
from __future__ import annotations

import base64
import json
import re
import time
import urllib.request
from pathlib import Path

LETTERS: list[tuple[str, str]] = [
    ("alif", "alif"),
    ("ba", "be"),
    ("ta", "ta"),
    ("tha", "sfa"),
    ("jim", "dzhim"),
    ("ha", "khe"),
    ("kha", "kho"),
    ("dal", "del"),
    ("dhal", "zel"),
    ("ra", "ra"),
    ("zay", "za"),
    ("sin", "sin"),
    ("shin", "shin"),
    ("sad", "sod"),
    ("dad", "dod"),
    ("ta_emph", "to"),
    ("za_emph", "zo"),
    ("ayn", "gayn"),
    ("ghayn", "goyn"),
    ("fa", "fa"),
    ("qaf", "kof"),
    ("kaf", "kaf"),
    ("lam", "lyam"),
    ("mim", "mim"),
    ("nun", "nun"),
    ("ha_end", "kh"),
    ("waw", "uau"),
    ("ya", "iai"),
]

HARAKAT_FIELDS = (
    ("fatha", "harfFathaSound"),
    ("kesra", "harfKesraSound"),
    ("damma", "harfDammaSound"),
    ("saken", "harfSakenSound"),
)

MOBILE = Path(__file__).resolve().parents[1]
OUT_NAMES = MOBILE / "assets" / "tajweed" / "letters"
OUT_HARAKAT = MOBILE / "assets" / "tajweed" / "harakat"
UA = "Mozilla/5.0 (compatible; RAQAT-TajweedAudio/1.0; educational)"
NEXT_DATA_RE = re.compile(
    r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',
    re.DOTALL,
)


def fetch_detail(site_code: str) -> dict:
    url = f"https://arabic-online.ru/arabskie-bukvy/{site_code}"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    m = NEXT_DATA_RE.search(html)
    if not m:
        raise RuntimeError(f"no __NEXT_DATA__ on {url}")
    return json.loads(m.group(1))["props"]["pageProps"]["detail"]


def decode_data_audio(raw: str | None) -> bytes | None:
    if not raw or not str(raw).strip().startswith("data:audio"):
        return None
    b64 = str(raw).strip().split(",", 1)[1]
    return base64.b64decode(b64)


def main() -> None:
    OUT_NAMES.mkdir(parents=True, exist_ok=True)
    OUT_HARAKAT.mkdir(parents=True, exist_ok=True)
    harakat_count = 0
    for slug, site_code in LETTERS:
        detail = fetch_detail(site_code)
        name = decode_data_audio(detail.get("harfNameSound"))
        if name:
            (OUT_NAMES / f"{slug}.mp3").write_bytes(name)
            print(f"OK name {slug}.mp3 ({len(name)} B)")
        for kind, field in HARAKAT_FIELDS:
            audio = decode_data_audio(detail.get(field))
            if not audio:
                continue
            out = OUT_HARAKAT / f"{slug}_{kind}.mp3"
            out.write_bytes(audio)
            harakat_count += 1
            print(f"OK harakat {out.name} ({len(audio)} B)")
        time.sleep(0.35)
    print(f"wrote {len(LETTERS)} names → {OUT_NAMES}")
    print(f"wrote {harakat_count} harakat clips → {OUT_HARAKAT}")


if __name__ == "__main__":
    main()
