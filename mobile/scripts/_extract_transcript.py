import json
import sys

path = sys.argv[1]
needle = sys.argv[2] if len(sys.argv) > 2 else "KmdbHubScreen.tsx"

with open(path, encoding="utf-8") as f:
    for line in f:
        if needle not in line or '"Write"' not in line:
            continue
        obj = json.loads(line)
        for part in obj.get("message", {}).get("content", []):
            if part.get("type") != "tool_use" or part.get("name") != "Write":
                continue
            inp = part.get("input", {})
            if needle in inp.get("path", ""):
                print(inp.get("contents", ""))
                sys.exit(0)

print("NOT FOUND", file=sys.stderr)
sys.exit(1)
