# -*- coding: utf-8 -*-
"""
Хадис қазақша мағынасының дәлдігі мен толықтығы — регрессия тесттері.

Дерек: mobile/assets/bundled/hadith-from-db.json (экспорт: scripts/hadith_corpus_sync.py).
Жаңа «араб иснад тек қана text_kk-те» жағдайлары кірсе, тест құлайды — DB/импортты түзету керек.
"""
import unittest
from pathlib import Path

from services.hadith_kk_quality import (
    cyrillic_to_arabic_letter_ratio,
    find_arabic_isnad_leakage_ids,
    is_text_kk_mostly_arabic_isnad,
    load_hadith_bundle,
)

ROOT = Path(__file__).resolve().parents[1]
BUNDLE_PATH = ROOT / "mobile" / "assets" / "bundled" / "hadith-from-db.json"

# Ағымдағы бандлда text_kk араб иснад болып қалған белгілі жолдар (азайтуға болады).
# Тізім бос болғанда — мұндай еш жол қалмағанын күтеміз.
KNOWN_ARABIC_ISNAD_IN_TEXT_KK: frozenset[str] = frozenset()


class HadithKkQualityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not BUNDLE_PATH.is_file():
            raise unittest.SkipTest(f"Bundled hadith JSON missing: {BUNDLE_PATH}")
        cls._bundle = load_hadith_bundle(BUNDLE_PATH)

    def test_bundle_schema_and_scale(self):
        data = self._bundle
        self.assertEqual(data.get("version"), 3)
        hadiths = data.get("hadiths")
        self.assertIsInstance(hadiths, list)
        self.assertGreaterEqual(len(hadiths), 14_000, "Сахих корпус көлемі кеміде 14k күтіледі")

    def test_every_hadith_has_arabic_and_kk_fields(self):
        for h in self._bundle["hadiths"]:
            self.assertIn("id", h)
            self.assertIn("arabic", h)
            self.assertIn("textKk", h)
            ar = (h.get("arabic") or "").strip()
            kk = (h.get("textKk") or "").strip()
            self.assertTrue(ar, msg=f"Бос arabic: {h.get('id')}")
            self.assertTrue(kk, msg=f"Бос textKk: {h.get('id')}")

    def test_golden_meanings_famous_hadiths(self):
        """Белгілі хадистердің қазақша мағынасында күтілетін сөз тіркестері."""
        by_id = {h["id"]: h for h in self._bundle["hadiths"]}

        # Ниет хадисі (әл-Бұхари, тізімдегі id)
        ni = by_id.get("bukhari-101223")
        self.assertIsNotNone(ni)
        kk = (ni["textKk"] or "").lower()
        self.assertIn("ниет", kk)

        # Муслим: иман туралы (мысалы)
        im = by_id.get("muslim-108557")
        self.assertIsNotNone(im)
        kk2 = im["textKk"] or ""
        self.assertIn("иман", kk2.lower(), msg="muslim-108557 мағынасында «иман» күтіледі")

    def test_cyrillic_dominates_translation(self):
        """Көпшілік аятта кирилл әріптері араб әріптерінен анық көп болуы керек."""
        weak = 0
        n = 0
        for h in self._bundle["hadiths"]:
            kk = h.get("textKk") or ""
            if len(kk) < 40:
                continue
            n += 1
            cy, ar = cyrillic_to_arabic_letter_ratio(kk)
            if cy < ar * 3:
                weak += 1
        self.assertEqual(n > 0, True)
        # Рұқсат: шағын үлес (дәйексөз, араб аттар)
        self.assertLessEqual(weak / n, 0.02, msg=f"Кирилл аз болатын жолдар: {weak}/{n}")

    def test_arabic_isnad_not_substituting_translation(self):
        """
        text_kk толығымен араб иснад болып қалған жолдар шектелген.
        KNOWN_ARABIC_ISNAD_IN_TEXT_KK бос болғанда ешбір осындай id болмауы керек.
        Аударманы түзетіп экспорттағаннан кейін тізімді босатыңыз.
        """
        leakage = find_arabic_isnad_leakage_ids(self._bundle["hadiths"])
        if KNOWN_ARABIC_ISNAD_IN_TEXT_KK:
            self.assertEqual(
                set(leakage),
                KNOWN_ARABIC_ISNAD_IN_TEXT_KK,
                msg=f"Күтілген: {KNOWN_ARABIC_ISNAD_IN_TEXT_KK}, алынған: {leakage}",
            )
        else:
            self.assertEqual(leakage, [], msg=f"Араб иснад text_kk-те қалған: {leakage}")

    def test_helper_flags_known_bad_rows(self):
        raw = "وَحَدَّثَنَاهُ عَبْدُ بْنُ حُمَيْدٍ، أَخْبَرَنَا " * 2
        self.assertTrue(is_text_kk_mostly_arabic_isnad(raw))
        self.assertFalse(is_text_kk_mostly_arabic_isnad("Омар айтты: Пайғамбар былай деді."))


if __name__ == "__main__":
    unittest.main()
