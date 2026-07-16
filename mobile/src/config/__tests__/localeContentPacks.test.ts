import { localeContentPackIds } from "../localeContentPacks";

describe("localeContentPackIds", () => {
  it("kk locale loads Kazakh meaning + translit only", () => {
    expect(localeContentPackIds("kk")).toEqual(["quran-kk", "quran-translit"]);
  });

  it("ru and en locales load translations + translit + offline UI strings", () => {
    expect(localeContentPackIds("ru")).toEqual([
      "i18n-offline",
      "quran-translations",
      "quran-translit",
    ]);
    expect(localeContentPackIds("en")).toEqual([
      "i18n-offline",
      "quran-translations",
      "quran-translit",
    ]);
  });

  it("ar locale loads offline UI strings + translit", () => {
    expect(localeContentPackIds("ar")).toEqual(["i18n-offline", "quran-translit"]);
  });
});
