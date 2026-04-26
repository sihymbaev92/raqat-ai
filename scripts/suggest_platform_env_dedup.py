#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
.env ішіндегі RAQAT_PLATFORM_URL / RAQAT_PLATFORM_API_BASE қосарлануын тексереді.
Файлды өзгертпейді — тек stdout нұсқаулар (құпия басқа жолдарды шығармайды).

Пайдалану (репо түбірінен): python scripts/suggest_platform_env_dedup.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> int:
    # Windows cp1251 консолында қазақша шығару үшін (UnicodeEncodeError болдырмау).
    for _stream in (sys.stdout, sys.stderr):
        if hasattr(_stream, "reconfigure"):
            try:
                _stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass

    root = Path(__file__).resolve().parents[1]
    env_path = root / ".env"
    if not env_path.is_file():
        print(".env табылмады — түбірде жасаңыз.", file=sys.stderr)
        return 1

    text = env_path.read_text(encoding="utf-8", errors="replace")
    url_val = ""
    base_val = ""
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^(RAQAT_PLATFORM_URL|RAQAT_PLATFORM_API_BASE)\s*=\s*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip().strip('"').strip("'")
        if key == "RAQAT_PLATFORM_URL":
            url_val = val
        else:
            base_val = val

    if url_val and base_val:
        if url_val.rstrip("/") == base_val.rstrip("/"):
            print("Екеуі бірдей. Қосарланбау үшін .env-тен RAQAT_PLATFORM_API_BASE жолын жойыңыз (немесе керісінше).")
            print("Ұсыныс: тек RAQAT_PLATFORM_URL қалдырыңыз — бот енді API_BASE-тен де оқиды, бірақ бір жол таза.")
        else:
            print("Назар: RAQAT_PLATFORM_URL мен RAQAT_PLATFORM_API_BASE әртүрлі. Нақты бір URL қолданыңыз.")
    elif base_val and not url_val:
        print("RAQAT_PLATFORM_URL бос, API_BASE бар. Қосыңыз:")
        print(f"RAQAT_PLATFORM_URL={base_val}")
    elif url_val and not base_val:
        print("OK: тек RAQAT_PLATFORM_URL орнатылған.")
    else:
        print("Екеуі де бос — жергілікті API үшін мысалы: RAQAT_PLATFORM_URL=http://127.0.0.1:8787")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
