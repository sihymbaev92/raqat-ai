#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Single entrypoint for hadith KK quality gate."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PY = ROOT / ".venv" / "Scripts" / "python.exe"


def run_step(cmd: list[str]) -> int:
    print(">", " ".join(cmd))
    env = {**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"}
    r = subprocess.run(cmd, cwd=str(ROOT), env=env)
    return int(r.returncode or 0)


def main() -> int:
    python = str(PY) if PY.is_file() else sys.executable
    steps = [
        [python, "scripts/hadith_translation_check.py", "--strict", "--max-weak-ratio", "0.02"],
        [python, "scripts/scan_hadith_kk_garbage.py", "--strict"],
        [python, "scripts/validate_hadith_kk_glossary.py", "--strict"],
    ]
    for step in steps:
        code = run_step(step)
        if code != 0:
            print(f"FAILED: exit={code}")
            return code
    print("Hadith quality gate: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
