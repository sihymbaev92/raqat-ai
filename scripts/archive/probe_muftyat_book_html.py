#!/usr/bin/env python3
import re
import sys
import urllib.request

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

UA = {"User-Agent": "Mozilla/5.0"}
url = "https://www.muftyat.kz/kk/book/28695/"
req = urllib.request.Request(url, headers=UA)
html = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")

# save snippet
with open("data/muftyat-book-28695.html", "w", encoding="utf-8") as f:
    f.write(html)

print("len", len(html))
# all unique href patterns
hrefs = sorted(set(re.findall(r'href="([^"]+)"', html)))
for h in hrefs:
    if any(x in h for x in ["book", "page", "flip", "pdf", "read", "28695"]):
        print("href:", h)

# iframe / embed
for m in re.finditer(r'<(iframe|embed|object)[^>]+>', html, re.I):
    print("embed:", m.group(0)[:200])

# data attributes
for pat in [r'data-page[^=]*="[^"]*"', r'data-src="[^"]*"', r'flipbook[^"\']*', r'pages\s*[:=]\s*\[']:
    ms = re.findall(pat, html, re.I)
    if ms:
        print(pat, ":", ms[:5])

# js vars
for m in re.finditer(r'(var|let|const)\s+(\w+)\s*=\s*(\[[^\]]{20,500}\])', html):
    print("js array", m.group(2), m.group(3)[:120])

# img src patterns
imgs = re.findall(r'src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"', html, re.I)
print("imgs", len(imgs))
for i in imgs[:20]:
    print(" img:", i)

# script src
scripts = re.findall(r'<script[^>]+src="([^"]+)"', html, re.I)
print("scripts:", scripts)
