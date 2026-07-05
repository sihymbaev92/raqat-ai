import re
import sys

path = sys.argv[1]
s = open(path, encoding="utf-8").read()
texts = re.findall(r'text="([^"]*)"', s)
for t in texts:
    if t.strip():
        print(t)
print("---")
print("has WebView:", "android.webkit.WebView" in s or "RNCWebView" in s)
print("has makkahlive:", "makkahlive" in s.lower())
print("has youtube:", "youtube" in s.lower())
