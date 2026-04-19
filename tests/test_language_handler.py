# -*- coding: utf-8 -*-
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from handlers.language import language_text_router
from state.memory import USER_STATE


class LanguageHandlerTests(unittest.IsolatedAsyncioTestCase):
    async def test_language_text_router_switches_language_from_phrase(self):
        uid = 701
        message = SimpleNamespace(
            from_user=SimpleNamespace(id=uid),
            text="орысшаға ауыс",
            answer=AsyncMock(),
        )

        try:
            with patch("handlers.language.set_user_lang", return_value="ru") as set_lang, patch(
                "handlers.language.get_language_name",
                return_value="Русский",
            ), patch("handlers.language.main_menu", return_value="menu"), patch(
                "handlers.language.send_onboarding_message",
                new=AsyncMock(),
            ):
                await language_text_router(message)

            set_lang.assert_called_once_with(uid, "ru")
            self.assertEqual(message.answer.await_count, 2)
            self.assertIsNone(USER_STATE.get(uid))
        finally:
            USER_STATE[uid] = None

    async def test_language_text_router_reprompts_in_language_mode_when_not_recognized(self):
        uid = 702
        USER_STATE[uid] = "language_select"
        message = SimpleNamespace(
            from_user=SimpleNamespace(id=uid),
            text="түсінбедім",
            answer=AsyncMock(),
        )

        try:
            with patch("handlers.language.get_user_lang", return_value="kk"), patch(
                "handlers.language.language_menu",
                return_value="menu",
            ):
                await language_text_router(message)

            message.answer.assert_awaited_once()
            self.assertEqual(USER_STATE.get(uid), "language_select")
        finally:
            USER_STATE[uid] = None


if __name__ == "__main__":
    unittest.main()
