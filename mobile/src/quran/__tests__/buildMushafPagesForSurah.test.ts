import { buildMushafPagesForSurah, findMushafPageIndexForAyah } from "../buildMushafPagesForSurah";
import type { CachedAyah } from "../../storage/quranSurahCache";

function ay(n: number): CachedAyah {
  return { numberInSurah: n, text: `ayah-${n}` };
}

describe("buildMushafPagesForSurah", () => {
  it("groups ayahs by Hafs print page (Al-Fatiha fits one page)", () => {
    const pages = buildMushafPagesForSurah(1, [1, 2, 3, 4, 5, 6, 7].map(ay));
    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages[0]?.includeHeader).toBe(true);
    expect(pages[0]?.ayahs).toHaveLength(7);
    expect(pages[0]?.mushafPageNumber).toBeGreaterThanOrEqual(1);
  });

  it("splits Al-Baqarah across multiple print pages", () => {
    const pages = buildMushafPagesForSurah(2, [1, 2, 3, 4, 5, 25, 50, 100, 150].map(ay));
    expect(pages.length).toBeGreaterThan(1);
    const pageNums = pages.map((p) => p.mushafPageNumber);
    for (let i = 1; i < pageNums.length; i++) {
      expect(pageNums[i]).toBeGreaterThanOrEqual(pageNums[i - 1]!);
    }
  });

  it("findMushafPageIndexForAyah locates the slice", () => {
    const pages = buildMushafPagesForSurah(2, [1, 2, 3, 4, 5, 25, 50, 100, 150].map(ay));
    const ix = findMushafPageIndexForAyah(pages, 100);
    expect(pages[ix]?.ayahs.some((a) => a.numberInSurah === 100)).toBe(true);
  });
});
