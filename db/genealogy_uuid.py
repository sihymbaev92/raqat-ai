# -*- coding: utf-8 -*-
"""RFC 9562 UUIDv7 — time-ordered IDs for genealogy graph nodes."""
from __future__ import annotations

import os
import time
import uuid


def generate_uuidv7() -> uuid.UUID:
    """Pure-Python UUIDv7 (no extra deps)."""
    timestamp_ms = int(time.time() * 1000) & ((1 << 48) - 1)
    rand_a = int.from_bytes(os.urandom(2), "big") & 0x0FFF
    rand_b = int.from_bytes(os.urandom(8), "big") & ((1 << 62) - 1)
    uuid_int = (timestamp_ms << 80) | (0x7 << 76) | (rand_a << 64) | (0b10 << 62) | rand_b
    return uuid.UUID(int=uuid_int)


def uuidv7_from_timestamp_ms(timestamp_ms: int, *, rand_a: int = 0, rand_b: int = 0) -> uuid.UUID:
    """Test helper — deterministic UUIDv7 from timestamp."""
    ts = int(timestamp_ms) & ((1 << 48) - 1)
    ra = int(rand_a) & 0x0FFF
    rb = int(rand_b) & ((1 << 62) - 1)
    uuid_int = (ts << 80) | (0x7 << 76) | (ra << 64) | (0b10 << 62) | rb
    return uuid.UUID(int=uuid_int)
