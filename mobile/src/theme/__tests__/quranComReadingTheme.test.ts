import {
  DEFAULT_QURAN_READING_THEME,
  QURAN_READING_THEMES,
  normalizeQuranReadingTheme,
  resolveQuranReadingTheme,
} from "../quranComReadingTheme";

describe("quranComReadingTheme", () => {
  it("original — Quran.com әдепкі (крем бет, қоңыр хром)", () => {
    const t = resolveQuranReadingTheme("original");
    expect(t.pageFace).toBe("#FEF9F3");
    expect(t.arabicInk).toBe("#000000");
    expect(t.chromeInk).toBe("#B08D57");
    expect(t.minimalPageChrome).toBe(true);
    expect(t.pageBorderVertical).toBe(false);
    expect(t.markerRingOuter).toBe("#B59A7A");
    expect(t.markerAccentFill).toBe("#FEF9F3");
  });

  it("мәзірде 3 тема: түпнұсқа, қараңғы, муфтият", () => {
    expect(QURAN_READING_THEMES).toHaveLength(3);
    expect(QURAN_READING_THEMES.map((t) => t.id)).toEqual(["original", "dark", "muftyat"]);
    expect(QURAN_READING_THEMES.map((t) => t.labelKk)).toEqual([
      "Ақ",
      "Қараңғы",
      "Жасыл сия",
    ]);
  });

  it("normalize бос мәнде original; қағаз/сепия — original", () => {
    expect(normalizeQuranReadingTheme(null)).toBe(DEFAULT_QURAN_READING_THEME);
    expect(normalizeQuranReadingTheme("")).toBe("original");
    expect(normalizeQuranReadingTheme("paper")).toBe("original");
    expect(normalizeQuranReadingTheme("sepia")).toBe("original");
  });
});
