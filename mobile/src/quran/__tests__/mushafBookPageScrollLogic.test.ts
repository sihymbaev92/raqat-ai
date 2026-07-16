import {
  groupAyahsBySurah,
  pageArabicGlyphCount,
  shouldShowBismillah,
} from "../mushafBookPageScrollLogic";
import type { MushafBookPageSlice } from "../mushafBookTypes";

describe("shouldShowBismillah", () => {
  it("shows for surah 2 ayah 1", () => {
    expect(shouldShowBismillah(2, 1)).toBe(true);
  });

  it("hides for surah 1 and 9", () => {
    expect(shouldShowBismillah(1, 1)).toBe(false);
    expect(shouldShowBismillah(9, 1)).toBe(false);
  });

  it("hides when first ayah is not 1", () => {
    expect(shouldShowBismillah(2, 2)).toBe(false);
  });
});

describe("groupAyahsBySurah", () => {
  it("groups consecutive ayahs by surah number", () => {
    const ayahs = [
      { surahNumber: 2, numberInSurah: 1, text: "a" },
      { surahNumber: 2, numberInSurah: 2, text: "b" },
      { surahNumber: 3, numberInSurah: 1, text: "c" },
    ];
    expect(groupAyahsBySurah(ayahs)).toEqual([
      { surah: 2, ayahs: [ayahs[0], ayahs[1]] },
      { surah: 3, ayahs: [ayahs[2]] },
    ]);
  });
});

describe("pageArabicGlyphCount", () => {
  it("counts glyphs without whitespace", () => {
    const page: MushafBookPageSlice = {
      key: "p-1",
      mushafPageNumber: 1,
      ayahs: [
        {
          surahNumber: 1,
          numberInSurah: 1,
          text: "بِسْمِ ٱللَّهِ",
        },
      ],
    };
    expect(pageArabicGlyphCount(page, "madinah")).toBeGreaterThan(5);
  });
});
