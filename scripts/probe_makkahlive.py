#!/usr/bin/env python3
import re
import ssl
import urllib.request

ctx = ssl.create_default_context()
req = urllib.request.Request(
    "https://makkahlive.net/makkahlive.aspx",
    headers={"User-Agent": "Mozilla/5.0 (Linux; Android 14; Mobile) Chrome/131 RaqatProbe/1"},
)
html = urllib.request.urlopen(req, context=ctx, timeout=25).read().decode("utf-8", "replace")
print("title:", re.search(r"<title[^>]*>([^<]+)", html, re.I))
for pat in [
    r'<iframe[^>]+src="([^"]+)"',
    r'src="([^"]*(?:m3u8|youtube|embed|stream)[^"]*)"',
    r'href="([^"]*makkahlive[^"]*)"',
]:
    hits = re.findall(pat, html, re.I)
    if hits:
        print("---", pat[:30], len(hits))
        for h in hits[:8]:
            print(" ", h[:140])
