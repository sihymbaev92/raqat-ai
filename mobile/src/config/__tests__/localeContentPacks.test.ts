import { BASELINE_QURAN_CONTENT_PACK_IDS, localeContentPackIds } from "../localeContentPacks";

describe("localeContentPackIds", () => {
  it("always includes kk + ru translations + translit baseline", () => {
    expect(BASELINE_QURAN_CONTENT_PACK_IDS).toEqual([
      "quran-kk",
      "quran-translations",
      "quran-translit",
    ]);
    expect(localeContentPackIds("kk")).toEqual([
      "quran-kk",
      "quran-translations",
      "quran-translit",
    ]);
    expect(localeContentPackIds("ru")).toEqual([
      "quran-kk",
      "quran-translations",
      "quran-translit",
      "i18n-offline",
    ]);
  });

  it("non-kk UI locales add i18n-offline", () => {
    expect(localeContentPackIds("ar")).toEqual([
      "quran-kk",
      "quran-translations",
      "quran-translit",
      "i18n-offline",
    ]);
  });
});
