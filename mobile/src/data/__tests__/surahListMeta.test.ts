import {
  mushafStartPageForSurah,
  surahListMetaSubtitle,
  surahListNumberedTitle,
  juzAtSurahStart,
} from "../surahListMeta";

describe("surahListMeta", () => {
  it("formats numbered kk title", () => {
    expect(surahListNumberedTitle(1, "")).toBe("1. Әл-Фатиха");
    expect(surahListNumberedTitle(4, "")).toBe("4. Ән-Ниса");
  });

  it("maps mushaf start pages (Hafs 604)", () => {
    expect(mushafStartPageForSurah(1)).toBe(1);
    expect(mushafStartPageForSurah(2)).toBe(2);
    expect(mushafStartPageForSurah(4)).toBe(77);
  });

  it("builds meta subtitle with revelation place", () => {
    expect(surahListMetaSubtitle(1, 7)).toContain("Мекке");
    expect(surahListMetaSubtitle(1, 7)).toContain("7 аят");
    expect(surahListMetaSubtitle(2, 286)).toContain("Мәдина");
  });

  it("resolves juz at surah start", () => {
    expect(juzAtSurahStart(1)).toBe(1);
    expect(juzAtSurahStart(4)).toBe(4);
  });
});
