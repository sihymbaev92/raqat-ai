# -*- coding: utf-8 -*-
import unittest

from services.voice_service import (
    extract_tasbih_action,
    extract_hadith_search_query,
    extract_language_choice,
    extract_quran_search_query,
    extract_voice_mode_toggle,
    is_feedback_request,
    is_guide_request,
    is_halal_section_request,
    is_language_switch_command,
    is_next_ayah_command,
    is_prev_ayah_command,
    is_repeat_last_command,
    is_translation_menu_request,
    is_translation_switch_command,
    is_voice_help_request,
    match_prayer_section_command,
    wants_translation_follow_ui,
)


class VoiceServiceTests(unittest.TestCase):
    def test_extracts_language_choice_from_short_command(self):
        self.assertEqual(extract_language_choice("орысша"), "ru")
        self.assertEqual(extract_language_choice("english"), "en")

    def test_detects_natural_language_switch_commands(self):
        self.assertTrue(is_language_switch_command("орысшаға ауыс"))
        self.assertTrue(is_language_switch_command("switch to english"))
        self.assertTrue(is_translation_switch_command("аударманы орысша қыл"))

    def test_translation_phrases_are_not_ui_language_switches(self):
        self.assertFalse(is_language_switch_command("перевод на русский"))
        self.assertFalse(is_language_switch_command("аударма қазақша"))
        self.assertFalse(is_language_switch_command("translation english"))

    def test_extracts_voice_mode_toggle(self):
        self.assertTrue(extract_voice_mode_toggle("дауыспен жауап бер"))
        self.assertTrue(extract_voice_mode_toggle("дауысты қос"))
        self.assertFalse(extract_voice_mode_toggle("voice off"))

    def test_detects_contextual_audio_commands(self):
        self.assertTrue(is_next_ayah_command("келесі аят"))
        self.assertTrue(is_prev_ayah_command("previous ayah"))
        self.assertTrue(is_repeat_last_command("повтори"))

    def test_detects_voice_help_request(self):
        self.assertTrue(is_voice_help_request("дауыспен басқару"))
        self.assertTrue(is_voice_help_request("voice help"))
        self.assertTrue(is_voice_help_request("дауыспен басқару қалай жұмыс істейді"))
        self.assertTrue(is_voice_help_request("айтшы дауыспен басқару туралы"))

    def test_detects_halal_section_request(self):
        self.assertTrue(is_halal_section_request("халал"))
        self.assertTrue(is_halal_section_request("галал тексеру"))
        self.assertTrue(is_halal_section_request("halal check өнім"))
        self.assertFalse(is_halal_section_request("намаз уақыты"))

    def test_extracts_scoped_search_queries(self):
        self.assertEqual(extract_quran_search_query("Құраннан сабыр ізде"), "сабыр")
        self.assertEqual(extract_hadith_search_query("найди в хадисах намаз"), "намаз")

    def test_extracts_more_voice_control_commands(self):
        self.assertEqual(extract_tasbih_action("тәспі 99"), "tasbih_goal_99")
        self.assertEqual(match_prayer_section_command("жұма намазы"), "jumuah")
        self.assertTrue(is_translation_menu_request("аударма"))
        self.assertTrue(wants_translation_follow_ui("перевод как интерфейс"))
        self.assertTrue(is_feedback_request("пікір"))
        self.assertTrue(is_guide_request("көмек"))


if __name__ == "__main__":
    unittest.main()
