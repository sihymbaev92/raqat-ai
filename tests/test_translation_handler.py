# -*- coding: utf-8 -*-
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from handlers.translation import translation_text_router
from state.memory import USER_STATE


class TranslationHandlerTests(unittest.IsolatedAsyncioTestCase):
    async def test_translation_text_router_switches_content_language(self):
        uid = 801
        message = SimpleNamespace(
            from_user=SimpleNamespace(id=uid),
            text="аударманы орысша қыл",
            answer=AsyncMock(),
        )

        try:
            with patch("handlers.translation.get_user_lang", return_value="kk"), patch(
                "handlers.translation.set_user_content_lang",
            ) as set_content_lang, patch(
                "handlers.translation.get_language_name",
                return_value="Русский",
            ):
                await translation_text_router(message)

            set_content_lang.assert_called_once_with(uid, "ru")
            message.answer.assert_awaited_once()
            self.assertIsNone(USER_STATE.get(uid))
        finally:
            USER_STATE[uid] = None

    async def test_translation_text_router_reprompts_in_translation_mode(self):
        uid = 802
        USER_STATE[uid] = "translation_select"
        message = SimpleNamespace(
            from_user=SimpleNamespace(id=uid),
            text="түсінбедім",
            answer=AsyncMock(),
        )

        try:
            with patch("handlers.translation.get_user_lang", return_value="kk"), patch(
                "handlers.translation.translation_menu",
                return_value="menu",
            ):
                await translation_text_router(message)

            message.answer.assert_awaited_once()
            self.assertEqual(USER_STATE.get(uid), "translation_select")
        finally:
            USER_STATE[uid] = None


if __name__ == "__main__":
    unittest.main()
