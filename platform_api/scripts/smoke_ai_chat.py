"""POST /api/v1/ai/chat — құпия міндетті емес; бар болса X-Raqat-Ai-Secret .env-тан."""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path


def load_dotenv_simple(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, _, v = s.partition("=")
        key = k.strip()
        val = v.strip().strip("'").strip('"')
        out[key] = val
    return out


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    env = load_dotenv_simple(root / ".env")
    sec = (env.get("RAQAT_AI_PROXY_SECRET") or os.environ.get("RAQAT_AI_PROXY_SECRET") or "").strip()
    base = os.environ.get("RAQAT_SMOKE_API_BASE", "http://127.0.0.1:8787").rstrip("/")
    body = json.dumps(
        {"prompt": "Сәлем, бір сөзбен жауап бер.", "detail_level": "quick"}
    ).encode("utf-8")
    headers: dict[str, str] = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if sec:
        headers["X-Raqat-Ai-Secret"] = sec
    req = urllib.request.Request(
        f"{base}/api/v1/ai/chat",
        data=body,
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            d = json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print("ERR", type(e).__name__, str(e)[:400])
        return 1
    text = (d.get("text") or "").strip()
    print("ok=", d.get("ok"), "text_chars=", len(text))
    if text:
        preview = text.replace("\n", " ")[:240]
        print("preview_ascii:", preview.encode("ascii", errors="replace").decode("ascii"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
