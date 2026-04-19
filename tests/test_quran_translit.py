# -*- coding: utf-8 -*-
import unittest

from services.quran_translit import transliterate_arabic_to_kazakh


class QuranTranslitTests(unittest.TestCase):
    def test_basmala_is_smoothed_for_readable_transliteration(self):
        self.assertEqual(
            transliterate_arabic_to_kazakh("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"),
            "бисмилләһир-рахманир-рахим",
        )

    def test_sajdah_mark_is_not_in_output(self):
        """۩ сәжде белгісі қазақ транскрипциясына енбейді."""
        t = transliterate_arabic_to_kazakh("سُجْدَةٌ ۩")
        self.assertNotIn("\u06e9", t)
        self.assertNotIn("۩", t)

    def test_triple_letter_collapse(self):
        """Артық қайталанған әріптер (ллл т.б.) қысқарады."""
        t = transliterate_arabic_to_kazakh("اللَّهُ")
        self.assertNotIn("ллл", t)
        self.assertIn("аллаһ", t)

    def test_wa_min_and_al_fa(self):
        """Сүре 113: وَмِنْ → үә мин; الْفَلَق → әл-фалақ."""
        t1 = transliterate_arabic_to_kazakh("وَمِنْ شَرِّ غَاسِقٍ")
        self.assertIn("үә мин", t1)
        self.assertNotIn("уамин", t1)
        t2 = transliterate_arabic_to_kazakh("بِرَبِّ الْفَلَقِ")
        self.assertIn("әл-фалақ", t2)

    def test_moon_letters_article_hyphen(self):
        """Күн әріптерінен кейінгі ال → әл-қ / әл-х / би әл-…"""
        self.assertIn("әл-қуран", transliterate_arabic_to_kazakh("الْقُرْآنُ"))
        self.assertIn("әл-хамду", transliterate_arabic_to_kazakh("الْحَمْدُ"))
        self.assertIn("би әл-қ", transliterate_arabic_to_kazakh("بِالْقُرْآنِ"))

    def test_grammar_particles_and_li_bi_ka(self):
        """بِاللَّهِ / لِلَّهِ / وَإِذَا / لِلْمُ… / كَالَّذِي — бөлшектер анық бөлінеді."""
        self.assertIn("би аллаһ", transliterate_arabic_to_kazakh("بِاللَّهِ"))
        self.assertIn("ли аллаһ", transliterate_arabic_to_kazakh("لِلَّهِ"))
        self.assertIn("үә иза", transliterate_arabic_to_kazakh("وَإِذَا"))
        self.assertIn("ли әл-м", transliterate_arabic_to_kazakh("لِلْمُتَّقِينَ"))
        self.assertIn("ка аллаз", transliterate_arabic_to_kazakh("كَالَّذِي"))
        self.assertIn("фа ла", transliterate_arabic_to_kazakh("فَلَا تَقْنَطُوا"))
        self.assertIn("а би алл", transliterate_arabic_to_kazakh("أَبِاللَّهِ"))

    def test_wa_bi_allah_compound(self):
        """وَبِاللَّذِي — уа би алл…"""
        t = transliterate_arabic_to_kazakh("وَبِاللَّذِي")
        self.assertIn("уа би алл", t)

    def test_sukun_suppresses_vowel(self):
        """ْ бар әріпте қысқа дауыс шығарылмайды."""
        t = transliterate_arabic_to_kazakh("مِنْ")
        self.assertEqual(t, "мин")

    def test_wa_mina_and_fi_uthmani(self):
        """وَمِنَ / فِى ٱلْ… — паузадан кейін де үә мин, фи әл-."""
        self.assertIn("үә мин", transliterate_arabic_to_kazakh("وَمِنَ النَّاسِ"))
        self.assertNotIn("уамин ", transliterate_arabic_to_kazakh("وَمِنَ النَّاسِ"))
        self.assertIn("фи әл-", transliterate_arabic_to_kazakh("فِى ٱلْعُقَدِ"))

    def test_pausal_fatiha_endings(self):
        """Фатиха: иъраб соңы жеңілдетілген (әл-'аламин, ар-рахман, иһдин, сират)."""
        t = transliterate_arabic_to_kazakh(
            "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ"
        )
        self.assertIn("әл-'аламин", t)
        self.assertNotIn("аламина", t)
        t2 = transliterate_arabic_to_kazakh("اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ")
        self.assertIn("иһдин", t2)
        self.assertIn("ас-сират", t2)

    def test_pedagogical_fatiha_preset_matches_user_exemplar(self):
        """1-сүре 1–7: пайдаланушы үлгісімен сәйкес тұрақты жол."""
        self.assertEqual(
            transliterate_arabic_to_kazakh(
                "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                surah=1,
                ayah=1,
                style="pedagogical",
            ),
            "бисмил ляяһир рахмаанир рахииим",
        )
        self.assertEqual(
            transliterate_arabic_to_kazakh(
                "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
                surah=1,
                ayah=7,
                style="pedagogical",
            ),
            "сыраатал лязиина ан'амта 'алаииһим гаиириль магдууби 'алаииһим ва ляд даааллииин",
        )

    def test_pedagogical_non_fatiha_hyphens_to_spaces(self):
        """Басқа аят: әдепкі + тире → бос орын."""
        t = transliterate_arabic_to_kazakh(
            "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
            surah=2,
            ayah=1,
            style="pedagogical",
        )
        self.assertNotIn("-", t)
        self.assertIn(" ", t)


if __name__ == "__main__":
    unittest.main()
