# -*- coding: utf-8 -*-
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from handlers.feedback import feedback_callback, feedback_text_router
from state.memory import USER_STATE


class FeedbackHandlerTests(unittest.IsolatedAsyncioTestCase):
    async def test_feedback_callback_sets_category_state(self):
        uid = 901
        callback = SimpleNamespace(
            from_user=SimpleNamespace(id=uid),
            data="feedback:bug",
            message=SimpleNamespace(answer=AsyncMock()),
            answer=AsyncMock(),
        )

        try:
            with patch("handlers.feedback.get_user_lang", return_value="kk"):
                await feedback_callback(callback)

            self.assertEqual(USER_STATE.get(uid), "feedback:bug")
            callback.message.answer.assert_awaited_once()
            callback.answer.assert_awaited_once()
        finally:
            USER_STATE[uid] = None

    async def test_feedback_text_router_saves_feedback_and_clears_state(self):
        uid = 902
        USER_STATE[uid] = "feedback:idea"
        message = SimpleNamespace(
            from_user=SimpleNamespace(id=uid),
            text="Құранда favorites болса жақсы болар еді",
            answer=AsyncMock(),
        )

        try:
            with patch("handlers.feedback.save_feedback", return_value=55) as save_feedback, patch(
                "handlers.feedback.get_user_lang",
                return_value="kk",
            ):
                await feedback_text_router(message)

            save_feedback.assert_called_once_with(uid, "idea", message.text)
            message.answer.assert_awaited_once()
            self.assertIsNone(USER_STATE.get(uid))
        finally:
            USER_STATE[uid] = None


if __name__ == "__main__":
    unittest.main()
