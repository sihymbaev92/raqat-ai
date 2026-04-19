# -*- coding: utf-8 -*-
import time

from state.ai_rate_limit import check_ai_rate_limit


def test_rate_limit_blocks_rapid_calls(monkeypatch):
    monkeypatch.setattr("state.ai_rate_limit.AI_RATE_LIMIT_SECONDS", 5.0)
    uid = 999001
    ok1, _ = check_ai_rate_limit(uid)
    ok2, msg2 = check_ai_rate_limit(uid)
    assert ok1 is True
    assert ok2 is False
    assert msg2 is not None
