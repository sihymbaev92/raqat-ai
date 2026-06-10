import {
  getQuranSurahTranslation,
  isQuranTranslationLocale,
  mergeTranslationIntoMushafPages,
  QURAN_TRANSLATION_LOCALES,
  quranTranslationFieldForLocale,
} from "../quranTranslationEditions";
import type { MushafBookPageSlice } from "../../quran/mushafBookTypes";

describe("quranTranslationEditions", () => {
  it("recognizes remote Quran translation locales", () => {
    expect(isQuranTranslationLocale("ru")).toBe(true);
    expect(isQuranTranslationLocale("en")).toBe(true);
    expect(isQuranTranslationLocale("tr")).toBe(true);
    expect(isQuranTranslationLocale("uz")).toBe(true);
    expect(isQuranTranslationLocale("ky")).toBe(true);
    expect(isQuranTranslationLocale("zh")).toBe(true);
    expect(isQuranTranslationLocale("fa")).toBe(true);
    expect(isQuranTranslationLocale("id")).toBe(true);
    expect(isQuranTranslationLocale("ms")).toBe(true);
    expect(isQuranTranslationLocale("hi")).toBe(true);
    expect(isQuranTranslationLocale("ku")).toBe(true);
    expect(isQuranTranslationLocale("kk")).toBe(false);
    expect(isQuranTranslationLocale("ar")).toBe(false);
  });

  it("maps locales to CachedAyah translation fields", () => {
    expect(quranTranslationFieldForLocale("ru")).toBe("textRu");
    expect(quranTranslationFieldForLocale("en")).toBe("textEn");
    expect(quranTranslationFieldForLocale("tr")).toBe("textTr");
    expect(quranTranslationFieldForLocale("uz")).toBe("textUz");
    expect(quranTranslationFieldForLocale("ky")).toBe("textKy");
    expect(quranTranslationFieldForLocale("zh")).toBe("textZh");
    expect(quranTranslationFieldForLocale("fa")).toBe("textFa");
    expect(quranTranslationFieldForLocale("id")).toBe("textId");
    expect(quranTranslationFieldForLocale("ms")).toBe("textMs");
    expect(quranTranslationFieldForLocale("hi")).toBe("textHi");
    expect(quranTranslationFieldForLocale("ku")).toBe("textKu");
  });

  it("loads Quran translations from the offline bundle before network", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");

    await expect(getQuranSurahTranslation(1, "en")).resolves.toMatchObject({
      1: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    });
    await expect(getQuranSurahTranslation(1, "zh")).resolves.toMatchObject({
      1: "奉至仁至慈的真主之名",
    });
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("has offline Quran translations for every supported translation locale", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");

    for (const locale of QURAN_TRANSLATION_LOCALES) {
      const map = await getQuranSurahTranslation(1, locale);
      expect(map?.[1]?.trim()).toBeTruthy();
      expect(map?.[7]?.trim()).toBeTruthy();
    }
    await expect(getQuranSurahTranslation(108, "ku")).resolves.toMatchObject({
      3: "بێگومان ھەر ناحەزت دوا بڕاوە (ئەی موحەممەد ﷺ)",
    });
    await expect(getQuranSurahTranslation(1, "ky")).resolves.toMatchObject({
      2: "Ааламдардын Раббиси – Аллахка алкыш-мактоолор болсун![1]",
    });
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("merges a surah translation into Hatim mushaf pages", () => {
    const pages: MushafBookPageSlice[] = [
      {
        key: "p1",
        mushafPageNumber: 1,
        ayahs: [
          { surahNumber: 1, numberInSurah: 1, text: "a" },
          { surahNumber: 2, numberInSurah: 1, text: "b" },
        ],
      },
    ];

    const next = mergeTranslationIntoMushafPages(pages, "en", 1, {
      1: "In the name of Allah",
    });

    expect(next).not.toBe(pages);
    expect(next[0]!.ayahs[0]!.textEn).toBe("In the name of Allah");
    expect(next[0]!.ayahs[1]!.textEn).toBeUndefined();
  });
});
