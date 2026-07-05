import {
  isPrimaryQuranAppLocale,
  isPrimaryQuranTranslationLocale,
  PRIMARY_QURAN_APP_LOCALES,
  PRIMARY_QURAN_TRANSLATION_LOCALES,
  QURAN_TRANSLATION_EDITION_BY_LOCALE,
  QURAN_TRANSLATION_FIELD_BY_LOCALE,
} from "../primaryQuranLocales";
import { QURAN_TRANSLATION_LOCALES } from "../../services/quranTranslationEditions";

describe("primaryQuranLocales", () => {
  it("keeps five app locales and four translation locales in sync", () => {
    expect(PRIMARY_QURAN_APP_LOCALES).toEqual(["kk", "ru", "en", "ky", "uz"]);
    expect(PRIMARY_QURAN_TRANSLATION_LOCALES).toEqual(["ru", "en", "ky", "uz"]);
    for (const locale of PRIMARY_QURAN_TRANSLATION_LOCALES) {
      expect(QURAN_TRANSLATION_LOCALES).toContain(locale);
      expect(QURAN_TRANSLATION_FIELD_BY_LOCALE[locale]).toMatch(/^text/);
      expect(QURAN_TRANSLATION_EDITION_BY_LOCALE[locale].length).toBeGreaterThan(3);
    }
  });

  it("recognizes primary locales and rejects unrelated codes", () => {
    for (const locale of PRIMARY_QURAN_APP_LOCALES) {
      expect(isPrimaryQuranAppLocale(locale)).toBe(true);
    }
    expect(isPrimaryQuranAppLocale("tr")).toBe(false);
    expect(isPrimaryQuranAppLocale("ar")).toBe(false);

    for (const locale of PRIMARY_QURAN_TRANSLATION_LOCALES) {
      expect(isPrimaryQuranTranslationLocale(locale)).toBe(true);
    }
    expect(isPrimaryQuranTranslationLocale("kk")).toBe(false);
    expect(isPrimaryQuranTranslationLocale("tr")).toBe(false);
  });
});
