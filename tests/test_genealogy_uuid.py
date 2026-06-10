# -*- coding: utf-8 -*-
import uuid

import pytest

from db.genealogy_uuid import generate_uuidv7, uuidv7_from_timestamp_ms


def test_uuidv7_version_and_variant():
    u = generate_uuidv7()
    assert u.version == 7
    assert u.variant == uuid.RFC_4122


def test_uuidv7_time_ordering():
    a = uuidv7_from_timestamp_ms(1_700_000_000_000, rand_a=0, rand_b=1)
    b = uuidv7_from_timestamp_ms(1_700_000_000_001, rand_a=0, rand_b=1)
    assert a.int < b.int


def test_uuidv7_unique_batch():
    seen = {generate_uuidv7() for _ in range(200)}
    assert len(seen) == 200
