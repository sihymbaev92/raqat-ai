from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

# Single canonical FastAPI application lives in platform_api/main.py.
# Keep this module as compatibility entrypoint to avoid stack drift.
from main import app  # noqa: E402,F401

