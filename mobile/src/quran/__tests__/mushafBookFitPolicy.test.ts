import {
  forcedMushafReaderLayers,
  mushafOnePageFitScale,
  shouldForceMushafOnePageFit,
} from "../mushafBookFitPolicy";

describe("mushafBookFitPolicy", () => {
  it("forces Arabic-only one-page fit for Turkish Unicode book pages", () => {
    expect(
      shouldForceMushafOnePageFit({
        arabicScriptEdition: "turkish",
        readingThemeId: "original",
        mushafLayout: true,
        bookPageLayout: true,
      })
    ).toBe(true);

    expect(forcedMushafReaderLayers(true, true, true)).toEqual({
      showReaderTranslit: false,
      showReaderMeaning: false,
    });
  });

  it("skips one-page fit when translit or meaning layers are enabled", () => {
    expect(
      shouldForceMushafOnePageFit({
        arabicScriptEdition: "madinah",
        readingThemeId: "original",
        mushafLayout: true,
        bookPageLayout: true,
        showReaderTranslit: true,
      })
    ).toBe(false);
    expect(
      shouldForceMushafOnePageFit({
        arabicScriptEdition: "madinah",
        readingThemeId: "original",
        mushafLayout: true,
        bookPageLayout: true,
        showReaderMeaning: true,
      })
    ).toBe(false);
  });

  it("forces Arabic-only one-page fit for Green Ink / Muftyat book pages", () => {
    expect(
      shouldForceMushafOnePageFit({
        arabicScriptEdition: "madinah",
        readingThemeId: "muftyat",
        mushafLayout: true,
        bookPageLayout: true,
      })
    ).toBe(true);
  });

  it("forces Arabic-only one-page fit for Quran.com original Hatim (minimalPageChrome)", () => {
    expect(
      shouldForceMushafOnePageFit({
        arabicScriptEdition: "madinah",
        readingThemeId: "original",
        mushafLayout: true,
        bookPageLayout: true,
      })
    ).toBe(true);
  });

  it("does not force one-page fit for paper/sepia scroll modes", () => {
    expect(
      shouldForceMushafOnePageFit({
        arabicScriptEdition: "madinah",
        readingThemeId: "paper",
        mushafLayout: true,
        bookPageLayout: true,
      })
    ).toBe(false);
  });

  it("does not force non-book reader modes", () => {
    expect(
      shouldForceMushafOnePageFit({
        arabicScriptEdition: "turkish",
        readingThemeId: "original",
        mushafLayout: true,
        bookPageLayout: false,
      })
    ).toBe(false);
  });

  it("applies stronger scale-down for dense pages", () => {
    expect(mushafOnePageFitScale(1400, 620, "pager")).toBeGreaterThanOrEqual(0.58);
    expect(mushafOnePageFitScale(1300, 620, "book")).toBeGreaterThanOrEqual(0.58);
    expect(mushafOnePageFitScale(500, 760, "book")).toBeCloseTo(0.86);
    expect(mushafOnePageFitScale(180, 760, "book")).toBe(1);
  });

  it("uses the same fit scale policy for all script editions", () => {
    const madinah = mushafOnePageFitScale(1100, 720, "book");
    const turkish = mushafOnePageFitScale(1100, 720, "book");
    expect(turkish).toBe(madinah);
  });
});
