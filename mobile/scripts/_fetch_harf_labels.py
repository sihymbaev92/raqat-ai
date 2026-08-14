#!/usr/bin/env python3
import json
import re
import urllib.request

UA = "Mozilla/5.0"
codes = ["uau", "be", "ra", "gayn", "del", "sfa", "kof"]
for code in codes:
    url = f"https://arabic-online.ru/arabskie-bukvy/{code}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    d = json.loads(m.group(1))["props"]["pageProps"]["detail"]
    print(f"=== {code} ({d.get('harfName')}) ===")
    for key in ("harfFatha", "harfKesra", "harfDamma", "harfSaken"):
        print(f"  {key}: {d.get(key)!r}")
