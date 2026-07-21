/**
 * Global zero-Kazakh audit for every non-kk app locale.
 * Inside/outside are the same rule: no Kazakh-specific letters on screen.
 * Kyrgyz may keep ө/ү/ң; only әғқұһ are treated as Kazakh bleed for ky.
 */
import {
  ensureOfflineAutoTranslationsLoaded,
  seedApkOfflineTranslationsSync,
} from "../../services/offlineAutoTranslations";
import type { AutoTranslateTarget } from "../../services/autoTranslate";
import { kk } from "../kk";
import { setCurrentLocale, type AppLocale } from "../runtime";
import {
  collectKkFunctionReturnLeaks,
  findKkLocaleLeaks,
  findKyLocaleLeaks,
} from "../localeLeakScan";
import { resolveKkAutoTranslationText } from "../../quran/useKkAutoTranslator";
import { resolveQuranTranslitForDisplay } from "../../utils/quranTranslitDisplay";
import { formatKkGregorianDate, formatKkHijriUmmAlQura } from "../../utils/formatKkDate";
import { halalCertLabelKk } from "../../utils/halalCertDisplay";
import { quranAyahMeaningForLocale } from "../../storage/quranSurahCache";
import { quranKkTextProvenanceForLocale } from "../../config/quranKkTranslation";
import { defaultQuranTranslitScriptForUi } from "../../quran/quranTranslitScript";
import { ZAKAT_GUIDE_SECTIONS } from "../../content/zakatCalculatorContent";
import { NAMAZ_WUDU_LEARNING_MODULES } from "../../content/namazLearningContent";

const KK = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;
const KK_ONLY_NOT_KY = /[әғқұһӘҒҚҰҺ]/;
const NON_KK: AppLocale[] = ["ru", "en", "ky", "uz", "tr", "ar"];

function assertNoKk(label: string, value: string, locale: AppLocale) {
  const re = locale === "ky" ? KK_ONLY_NOT_KY : KK;
  if (re.test(value) && value !== "…" && !value.includes("ҚМДБ")) {
    throw new Error(`${label}: still has Kazakh letters: ${JSON.stringify(value).slice(0, 120)}`);
  }
}

describe("global 7-locale zero Kazakh", () => {
  beforeAll(() => {
    seedApkOfflineTranslationsSync();
  });

  afterEach(async () => {
    await setCurrentLocale("kk");
  });

  it.each(NON_KK)("chrome kk tree has no Kazakh letter leaks under %s", async (locale) => {
    await ensureOfflineAutoTranslationsLoaded(locale as AutoTranslateTarget);
    await setCurrentLocale(locale);
    if (locale === "ky") {
      expect(findKyLocaleLeaks(kk)).toEqual([]);
    } else {
      expect(findKkLocaleLeaks(kk)).toEqual([]);
    }
  });

  it.each(NON_KK)("formatter functions do not return Kazakh under %s", async (locale) => {
    await ensureOfflineAutoTranslationsLoaded(locale as AutoTranslateTarget);
    await setCurrentLocale(locale);
    const leaks = collectKkFunctionReturnLeaks(kk).filter((l) => {
      if (l.value === "…" || l.value.includes("ҚМДБ")) return false;
      if (locale === "ky") return KK_ONLY_NOT_KY.test(l.value);
      return KK.test(l.value);
    });
    expect(leaks).toEqual([]);
  });

  it.each(NON_KK)("language picker label for Kazakh has no Kazakh letters under %s", async (locale) => {
    await setCurrentLocale(locale);
    assertNoKk("languageKk", kk.settings.languageKk, locale);
  });

  it.each(NON_KK)("Quran meaning never falls back to Kazakh under %s", async (locale) => {
    await setCurrentLocale(locale);
    const m = quranAyahMeaningForLocale(
      { numberInSurah: 1, surahNumber: 999, textKk: "Аса қамқор мейірімді" },
      locale as "ru"
    );
    assertNoKk("ayahMeaning", m, locale);
    expect(m).not.toContain("қамқор");
  });

  it.each(NON_KK)("Quran translit display is latin (no Kazakh letters) under %s", async (locale) => {
    await setCurrentLocale(locale);
    expect(defaultQuranTranslitScriptForUi(locale)).toBe("latin");
    const line = resolveQuranTranslitForDisplay("Бисмилләһир рахманир рахим", "بِسْمِ");
    assertNoKk("translit", line, locale);
  });

  it.each(NON_KK)("dates and halal cert labels have no Kazakh letters under %s", async (locale) => {
    await setCurrentLocale(locale);
    const d = new Date(2026, 0, 15);
    assertNoKk("gregorian", formatKkGregorianDate(d, locale), locale);
    assertNoKk("hijri", formatKkHijriUmmAlQura(d, locale), locale);
    assertNoKk("halal-active", halalCertLabelKk("active"), locale);
    assertNoKk("halal-expired", halalCertLabelKk("expired"), locale);
  });

  it.each(NON_KK)("Hatim provenance has no Kazakh letters under %s", async (locale) => {
    assertNoKk("provenance", quranKkTextProvenanceForLocale(locale), locale);
  });

  it.each(NON_KK)("zakat + namaz sample strings scrub under %s", async (locale) => {
    await ensureOfflineAutoTranslationsLoaded(locale as AutoTranslateTarget);
    await setCurrentLocale(locale);
    for (const sec of ZAKAT_GUIDE_SECTIONS.slice(0, 3)) {
      assertNoKk("zakat-title", resolveKkAutoTranslationText(sec.title, locale, {}), locale);
      assertNoKk("zakat-body", resolveKkAutoTranslationText(sec.body, locale, {}), locale);
    }
    const mod = NAMAZ_WUDU_LEARNING_MODULES[0];
    const step = mod?.steps[0];
    const block = step?.recitations[0];
    if (block) {
      assertNoKk("namaz-label", resolveKkAutoTranslationText(block.label, locale, {}), locale);
      assertNoKk("namaz-mean", resolveKkAutoTranslationText(block.meaningKk, locale, {}), locale);
      assertNoKk("namaz-tr", resolveKkAutoTranslationText(block.transliterationKk, locale, {}), locale);
    }
  });
});
