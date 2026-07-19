import {

  DEFAULT_QURAN_READING_THEME,

  QURAN_READING_CREAM,

  QURAN_READING_THEMES,

  normalizeQuranReadingTheme,

  resolveQuranReadingTheme,

} from "../quranComReadingTheme";



describe("quranComReadingTheme", () => {

  it("original — Ayah-style soft cream page, minimal chrome", () => {

    const t = resolveQuranReadingTheme("original");

    expect(t.pageFace).toBe(QURAN_READING_CREAM);

    expect(t.pageFace).toBe("#FDFBF7");

    expect(t.arabicInk).toBe("#0E0C0A");

    expect(t.minimalPageChrome).toBe(true);

    expect(t.pageBorderVertical).toBe(false);

    expect(t.markerAccentFill).toBe(QURAN_READING_CREAM);

  });



  it("мәзірде original және dark ғана", () => {

    expect(QURAN_READING_THEMES).toHaveLength(2);

    expect(QURAN_READING_THEMES.some((t) => t.id === "original")).toBe(true);

    expect(QURAN_READING_THEMES.some((t) => t.id === "dark")).toBe(true);

    expect(QURAN_READING_THEMES.some((t) => t.id === "muftyat")).toBe(false);

    expect(QURAN_READING_THEMES.find((t) => t.id === "original")?.labelKk).toBe("Ақ");
    expect(QURAN_READING_THEMES.find((t) => t.id === "dark")?.labelKk).toBe("Қара");

  });



  it("normalize бос мәнде original; қағаз/сепия — original", () => {

    expect(normalizeQuranReadingTheme(null)).toBe(DEFAULT_QURAN_READING_THEME);

    expect(normalizeQuranReadingTheme("")).toBe("original");

    expect(normalizeQuranReadingTheme("paper")).toBe("original");

    expect(normalizeQuranReadingTheme("sepia")).toBe("original");

    expect(normalizeQuranReadingTheme("muftyat")).toBe("original");

    expect(normalizeQuranReadingTheme("dark")).toBe("dark");

  });

});

