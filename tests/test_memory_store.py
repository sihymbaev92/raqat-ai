# -*- coding: utf-8 -*-
import time

from state.memory import SlidingTtlStore


def test_set_get_sliding_ttl():
    s = SlidingTtlStore(ttl_seconds=2.0, max_entries=500)
    s[1] = "quran_search"
    assert s.get(1) == "quran_search"


def test_none_clears_key():
    s = SlidingTtlStore(ttl_seconds=60.0, max_entries=500)
    s[2] = "x"
    s[2] = None
    assert s.get(2) is None


def test_expires_after_ttl():
    s = SlidingTtlStore(ttl_seconds=0.08, max_entries=500)
    s[3] = "a"
    time.sleep(0.2)
    assert s.get(3) is None
