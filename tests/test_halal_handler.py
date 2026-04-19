# -*- coding: utf-8 -*-
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from handlers.halal import halal_image_filter, halal_router, halal_text_only_filter
from state.memory import USER_STATE


class HalalHandlerTests(unittest.IsolatedAsyncioTestCase):
    async def test_halal_router_ignores_photo_messages(self):
        uid = 101
        USER_STATE[uid] = "halal_check"
        message = SimpleNamespace(
            from_user=SimpleNamespace(id=uid),
            text=None,
            photo=[object()],
            document=None,
            answer=AsyncMock(),
        )
        self.assertFalse(halal_text_only_filter(message))
        self.assertTrue(halal_image_filter(message))

        try:
            await halal_router(message)
            message.answer.assert_not_awaited()
            self.assertEqual(USER_STATE[uid], "halal_check")
        finally:
            USER_STATE[uid] = None

    async def test_halal_router_blank_text_clears_state_after_prompt(self):
        uid = 102
        USER_STATE[uid] = "halal_check"
        message = SimpleNamespace(
            from_user=SimpleNamespace(id=uid),
            text="   ",
            photo=[],
            document=None,
            answer=AsyncMock(),
        )
        self.assertTrue(halal_text_only_filter(message))

        try:
            await halal_router(message)
            message.answer.assert_awaited_once()
            self.assertIsNone(USER_STATE.get(uid))
        finally:
            USER_STATE[uid] = None


if __name__ == "__main__":
    unittest.main()
