#!/usr/bin/env python3
import re
import sys
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

UA = {"User-Agent": "Mozilla/5.0"}

for bid in ["28682", "28698", "28695", "28705"]:
    url = f"https://www.muftyat.kz/kk/book/{bid}/"
    html = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25).read().decode()
    title = re.search(r"<title>([^<]+)</title>", html)
    pdf = re.findall(r'/media/muftyat/[^"\']+\.pdf', html)
    cover = re.findall(r'/media/muftyat/[^"\']+\.(?:png|jpg|jpeg)', html)
    print(f"\n{bid}: {title.group(1).split('-')[0].strip() if title else '?'}")
    print(" pdf:", pdf[:2])
    print(" cover:", cover[:2])
