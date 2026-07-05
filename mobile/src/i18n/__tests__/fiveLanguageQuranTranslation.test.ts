import {
  PRIMARY_QURAN_APP_LOCALES,
  PRIMARY_QURAN_TRANSLATION_LOCALES,
  QURAN_TRANSLATION_EDITION_BY_LOCALE,
  QURAN_TRANSLATION_FIELD_BY_LOCALE,
} from "../config/primaryQuranLocales";
import { getQuranSurahTranslation } from "../services/quranTranslationEditions";
import { quranAyahMeaningForLocale, quranAyahMeaningForSurah } from "../storage/quranSurahCache";
import { setCurrentLocale, type AppLocale } from "../i18n/runtime";
import { kk } from "../i18n/kk";
import { quranTranslationAttributionForLocale } from "../i18n/quranTranslationAttribution";

const FATIHA_1: Record<Exclude<AppLocale, "ar" | "tr" | "zh" | "fa" | "id" | "ms" | "hi" | "ku">, RegExp> = {
  kk: /Аса қамқор|Милостив|Al-Fatihah|бастаймын/i,
  ru: /Во имя Аллаха|Милостивого/i,
  en: /In the name of Allah/i,
  ky: /Аллахтын аты|Ырайымдуу/i,
  uz: /Меҳрибон|Аллоҳнинг номи/i,
};

describe("five-language Quran translation texts", () => {
  it("declares five primary app locales and four remote translation locales", () => {
    expect(PRIMARY_QURAN_APP_LOCALES).toEqual(["kk", "ru", "en", "ky", "uz"]);
    expect(PRIMARY_QURAN_TRANSLATION_LOCALES).toEqual(["ru", "en", "ky", "uz"]);
    expect(QURAN_TRANSLATION_EDITION_BY_LOCALE.ru).toBe("ru.kuliev");
    expect(QURAN_TRANSLATION_EDITION_BY_LOCALE.en).toBe("en.sahih");
    expect(QURAN_TRANSLATION_EDITION_BY_LOCALE.ky).toContain("hakimov");
    expect(QURAN_TRANSLATION_EDITION_BY_LOCALE.uz).toBe("uz.sodik");
    expect(QURAN_TRANSLATION_FIELD_BY_LOCALE.ru).toBe("textRu");
    expect(QURAN_TRANSLATION_FIELD_BY_LOCALE.en).toBe("textEn");
    expect(QURAN_TRANSLATION_FIELD_BY_LOCALE.ky).toBe("textKy");
    expect(QURAN_TRANSLATION_FIELD_BY_LOCALE.uz).toBe("textUz");
  });

  it.each(PRIMARY_QURAN_TRANSLATION_LOCALES)(
    "loads surah 1 offline translation for %s without network",
    async (locale) => {
      const fetchSpy = jest.spyOn(global, "fetch");
      const map = await getQuranSurahTranslation(1, locale);
      expect(map?.[1]?.trim()).toBeTruthy();
      expect(map?.[7]?.trim()).toBeTruthy();
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    }
  );

  it.each(["ru", "en", "ky", "uz"] as const)(
    "resolves Fatiha 1:1 from bundled seed for %s before ayah merge",
    (locale) => {
      const meaning = quranAyahMeaningForSurah(1, { numberInSurah: 1 }, locale);
      expect(meaning).toMatch(FATIHA_1[locale]);
      expect(meaning).not.toMatch(FATIHA_1.kk);
    }
  );

  it("uses Kazakh textKk for kk locale", () => {
    const kkText = "Аса қамқор, ерекше мейірімді Алланың атымен бастаймын.";
    expect(
      quranAyahMeaningForSurah(1, { numberInSurah: 1, textKk: kkText }, "kk")
    ).toBe(kkText);
  });

  it.each(PRIMARY_QURAN_APP_LOCALES)("locale %s exposes Quran meaning section caption", async (locale) => {
    await setCurrentLocale(locale);
    const caption = kk.quran.meaningKk.trim();
    expect(caption.length).toBeGreaterThan(2);
    if (locale === "kk") {
      expect(caption).toMatch(/Мағына|мағына/i);
    } else if (locale === "ru") {
      expect(caption).toMatch(/Значение|Maani/i);
    } else if (locale === "en") {
      expect(caption).toBe("Meaning");
    } else if (locale === "ky") {
      expect(caption).toMatch(/Мааниси/);
    } else if (locale === "uz") {
      expect(caption).toMatch(/Ma'nosi/);
    }
  });

  it.each(PRIMARY_QURAN_APP_LOCALES)("locale %s has translation attribution text", (locale) => {
    const line = quranTranslationAttributionForLocale(locale);
    expect(line.trim().length).toBeGreaterThan(20);
    if (locale === "kk") expect(line).toMatch(/Ерлан|Алимулы/i);
    if (locale === "ru") expect(line).toMatch(/Кулиев|kuliev/i);
    if (locale === "en") expect(line).toMatch(/Sahih/i);
    if (locale === "ky") expect(line).toMatch(/Hakimov|hakimov|Борубаев/i);
    if (locale === "uz") expect(line).toMatch(/Sodik|sodik|Содиқ/i);
  });

  it("keeps hatim-style ayah ref with surahNumber on bundled lookup", () => {
    expect(quranAyahMeaningForLocale({ numberInSurah: 1, surahNumber: 1 }, "ru")).toMatch(
      /Во имя Аллаха|Милостивого/
    );
  });
});
