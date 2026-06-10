#!/usr/bin/env python3
"""VPS: GEMINI_API_KEY санын және Google API жауабын тексеру (кілт толық көрсетілмейді)."""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV = ROOT / ".env"


def main() -> int:
    lines = [
        ln
        for ln in ENV.read_text(encoding="utf-8", errors="ignore").splitlines()
        if ln.strip().startswith("GEMINI_API_KEY=")
    ]
    print(f"GEMINI_API_KEY lines in .env: {len(lines)}")
    for i, ln in enumerate(lines, 1):
        v = ln.split("=", 1)[1].strip().strip('"').strip("'")
        print(f"  #{i}: len={len(v)} start={v[:7]!r} end={v[-4:]!r}" if v else f"  #{i}: EMPTY")

    try:
        from dotenv import load_dotenv

        load_dotenv(ENV)
    except ImportError:
        pass

    key = (os.getenv("GEMINI_API_KEY") or os.getenv("RAQAT_GEMINI_API_KEY") or "").strip()
    if not key:
        print("loaded: EMPTY — GEMINI_API_KEY жоқ")
        return 1
    print(f"loaded: len={len(key)} start={key[:7]!r}")

    from google import genai

    keys = [
        ln.split("=", 1)[1].strip().strip('"').strip("'")
        for ln in ENV.read_text(encoding="utf-8", errors="ignore").splitlines()
        if ln.strip().startswith("GEMINI_API_KEY=")
    ]
    ok_idx = 0
    import re

    for i, raw in enumerate(keys, 1):
        if not raw:
            print(f"  key #{i}: EMPTY")
            continue
        candidates = [raw]
        m = re.search(r"AIza[0-9A-Za-z_-]{30,}", raw)
        if m and m.group(0) != raw:
            candidates.append(m.group(0))
        trial: list[tuple[str, str]] = [("raw", candidates[0])]
        if len(candidates) > 1:
            trial.append(("extracted", candidates[1]))
        for label, k in trial:
            if not k:
                continue
            try:
                client = genai.Client(api_key=k)
                r = client.models.generate_content(
                    model="gemini-2.5-flash-lite",
                    contents="Reply with exactly: OK",
                )
                text = (getattr(r, "text", "") or "").strip()
                print(f"  key #{i} ({label}): WORKS len={len(k)} text={text[:40]!r}")
                ok_idx = i
                break
            except Exception as exc:
                err = str(exc)
                print(
                    f"  key #{i} ({label}): FAIL len={len(k)} "
                    f"{type(exc).__name__}: {err[:200]}"
                )
                low = err.lower()
                if "suspended" in low:
                    print("  → себеп: кілт TOҚTATILGAN (скриншот/Git/ашық жариялау)")
                elif "has not been enabled" in low or "not enabled" in low:
                    print("  → себеп: Generative Language API қосылмаған (Cloud Console)")
                elif "billing" in low:
                    print("  → себеп: төлем/биллинг қосылмаған")

    if ok_idx:
        print(f"OK: кілт #{ok_idx} жарамды — systemctl restart raqat-platform-api")
        return 0
    print("gemini_test: барлық кілттер сәтсіз")
    print("Кеңес: жаңа Gmail + aistudio.google.com/apikey; .env скриншот ЖОҚ; ескі кілттерді Delete")
    return 2


if __name__ == "__main__":
    sys.exit(main())
