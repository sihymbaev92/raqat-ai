from platform_api.ai_reply_guards import GEMINI_BUSY_REPLY_KK, is_degraded_ai_reply


def test_busy_reply_is_degraded():
    assert is_degraded_ai_reply(GEMINI_BUSY_REPLY_KK)


def test_normal_reply_not_degraded():
    assert not is_degraded_ai_reply("Намаз бес уақыттан тұрады.")
