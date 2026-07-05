#!/usr/bin/env python3
import re
import ssl
import urllib.request

ctx = ssl.create_default_context()
req = urllib.request.Request(
    "https://halaldamu.kz/kz/",
    headers={"User-Agent": "Mozilla/5.0 Mobile RaqatProbe/1"},
)
html = urllib.request.urlopen(req, context=ctx, timeout=25).read().decode("utf-8", "replace")
secs = re.findall(r'<section[^>]+class="([^"]+)"', html)
print("sections:", secs)
for pat in ["class=\"app", "class=\"hero", "class=\"banner", "main__"]:
    idx = html.find(pat)
    if idx >= 0:
        print("---", pat)
        print(html[idx : idx + 200].replace("\n", " "))
