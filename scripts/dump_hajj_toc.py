#!/usr/bin/env python3
import sys
from pathlib import Path
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
import fitz
doc = fitz.open(str(Path(__file__).resolve().parents[1] / "data" / "muftyat-hajj.pdf"))
for p in range(211, min(215, doc.page_count)):
    print(f"=== {p+1} ===")
    print(doc[p].get_text("text"))
doc.close()
