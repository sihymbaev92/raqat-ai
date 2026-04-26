# -*- coding: utf-8 -*-
import unittest

from db.hadith_repo import resolve_hadith_text_choice
from db.quran_repo import resolve_quran_text_choice
from keyboards.menu import main_menu
from services.language_service import (
    get_supported_language_codes,
    menu_label,
    menu_text_matches,
)


def _button_texts(markup) -> list[str]:
    return [button.text for row in markup.keyboard for button in row]


class LanguageServiceTests(unittest.TestCase):
    def test_supports_exactly_15_languages_with_chinese_and_kurmanji(self):
        codes = get_supported_language_codes()
        self.assertEqual(len(codes), 15)
        self.assertIn("zh", codes)
        self.assertIn("ku", codes)

    def test_menu_text_matches_localized_quran_label(self):
        self.assertTrue(menu_text_matches(menu_label("quran", "zh"), "quran"))
        self.assertTrue(menu_text_matches(menu_label("language", "ku"), "language"))

    def test_menu_text_matches_unified_body(self):
        self.assertTrue(menu_text_matches(menu_label("unified", "kk"), "unified"))
        self.assertTrue(menu_text_matches(menu_label("unified", "en"), "unified"))

    def test_main_menu_includes_language_button(self):
        texts = _button_texts(main_menu(lang="en"))
        self.assertIn("🌐 LANGUAGE", texts)
        self.assertIn("💬 FEEDBACK", texts)
        self.assertIn("📖 QURAN", texts)
        self.assertNotIn("💧 WUDU", texts)

    def test_hadith_falls_back_to_english_for_chinese(self):
        choice = resolve_hadith_text_choice("zh")
        self.assertEqual(choice["actual"], "text_ar")

    def test_quran_marks_chinese_translation_as_missing_in_current_db(self):
        choice = resolve_quran_text_choice("zh")
        self.assertEqual(choice["actual"], "text_en")


if __name__ == "__main__":
    unittest.main()
