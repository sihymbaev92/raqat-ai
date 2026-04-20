#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Кері үйлесімділік: `fill_hadith_text_fawaz.py --target ru` бағыттады.

Жаңа команда:
  .venv/bin/python scripts/fill_hadith_text_fawaz.py --db global_clean.db --target ru
"""
from __future__ import annotations

import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

if __name__ == "__main__":
    argv = [str(ROOT / "scripts" / "fill_hadith_text_fawaz.py"), "--target", "ru"] + sys.argv[1:]
    sys.argv = argv
    runpy.run_path(str(ROOT / "scripts" / "fill_hadith_text_fawaz.py"), run_name="__main__")
