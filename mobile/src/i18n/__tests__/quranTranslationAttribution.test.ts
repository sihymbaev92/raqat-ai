import { quranTranslationAttributionForLocale } from "../quranTranslationAttribution";

describe("quranTranslationAttributionForLocale", () => {
  it("returns locale-specific attribution strings", () => {
    expect(quranTranslationAttributionForLocale("kk")).toMatch(/Ерлан Алимулы/);
    expect(quranTranslationAttributionForLocale("ru")).toMatch(/Kuliev|Кулиев/i);
    expect(quranTranslationAttributionForLocale("en")).toMatch(/Sahih International/);
    expect(quranTranslationAttributionForLocale("ky")).toMatch(/КМДБ/);
    expect(quranTranslationAttributionForLocale("uz")).toMatch(/QMDB/);
  });
});
