#!/usr/bin/env python3
"""Download Tajweed alphabet letter-name MP3s from arabic-online.ru.

Source: https://arabic-online.ru/arabskie-bukvy/arabskiy-alfavit
Each letter page embeds harfNameSound as data:audio/mpeg;base64 in __NEXT_DATA__.

Regenerate: python scripts/generate-tajweed-letter-audio.py
"""
from __future__ import annotations

import base64
import json
import re
import time
import urllib.request
from pathlib import Path

# (our slug, site code) — 28 alphabet letters
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

OUT = Path(__file__).resolve().parents[1] / "assets" / "tajweed" / "letters"
UA = "Mozilla/5.0 (compatible; RAQAT-TajweedAudio/1.0; educational)"
NEXT_DATA_RE = re.compile(
    r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',
    re.DOTALL,
)


def fetch_harf_name_sound(site_code: str) -> bytes:
    url = f"https://arabic-online.ru/arabskie-bukvy/{site_code}"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    m = NEXT_DATA_RE.search(html)
    if not m:
        raise RuntimeError(f"no __NEXT_DATA__ on {url}")
    data = json.loads(m.group(1))
    detail = data["props"]["pageProps"]["detail"]
    raw = (detail.get("harfNameSound") or "").strip()
    if not raw.startswith("data:audio"):
        raise RuntimeError(f"missing harfNameSound for {site_code}")
    # data:audio/mpeg;base64,....
    b64 = raw.split(",", 1)[1]
    return base64.b64decode(b64)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, site_code in LETTERS:
        out = OUT / f"{slug}.mp3"
        audio = fetch_harf_name_sound(site_code)
        out.write_bytes(audio)
        print(f"OK {slug} ← {site_code} ({len(audio)} B)")
        time.sleep(0.4)
    print(f"wrote {len(LETTERS)} files → {OUT}")
    print("source: https://arabic-online.ru/arabskie-bukvy/arabskiy-alfavit")


if __name__ == "__main__":
    main()
