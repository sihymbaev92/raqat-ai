# -*- coding: utf-8 -*-
"""Қазақ шежіресін (genealogy-p0.json) толық каталогтан қайта құрастыру.

Барлық деректер: db/genealogy_seed.py + db/shezhire_catalog_data.py
→ scripts/build_shezhire_bundled.py
"""
from __future__ import annotations

import os
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BUILD = os.path.join(ROOT, "scripts", "build_shezhire_bundled.py")


def main() -> int:
    return subprocess.call([sys.executable, BUILD], cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
