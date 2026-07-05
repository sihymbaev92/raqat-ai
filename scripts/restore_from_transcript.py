"""Restore last Write snapshot per file from agent transcript."""
import json
from pathlib import Path

TRANSCRIPT = Path(
    r"C:\Users\Жасулан\.cursor\projects\d-opt-raqat-ai"
    r"\agent-transcripts\4e5c4b06-358f-45fa-a8e0-bf64c20c4c54"
    r"\4e5c4b06-358f-45fa-a8e0-bf64c20c4c54.jsonl"
)
ROOT = Path(__file__).resolve().parents[1]


def norm(path: str) -> str:
    p = path.replace("\\", "/")
    for prefix in ("d:/opt/raqat-ai/", "D:/opt/raqat-ai/"):
        if p.lower().startswith(prefix.lower()):
            p = p[len(prefix) :]
    return p.lstrip("/")


def main() -> None:
    found: dict[str, str] = {}
    with TRANSCRIPT.open(encoding="utf-8") as f:
        for line in f:
            if "Write" not in line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            for part in obj.get("message", {}).get("content", []):
                if part.get("type") != "tool_use" or part.get("name") != "Write":
                    continue
                inp = part.get("input", {})
                path = norm(inp.get("path", ""))
                contents = inp.get("contents")
                if not path or contents is None:
                    continue
                if not (path.startswith("mobile/") or path.startswith("scripts/")):
                    continue
                found[path] = contents

    for path, contents in sorted(found.items()):
        fp = ROOT / path
        fp.parent.mkdir(parents=True, exist_ok=True)
        fp.write_text(contents, encoding="utf-8")
        print(f"restored {path} ({len(contents)} chars)")
    print(f"TOTAL {len(found)} files")


if __name__ == "__main__":
    main()
