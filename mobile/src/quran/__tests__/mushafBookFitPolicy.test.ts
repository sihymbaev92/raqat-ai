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

  it("applies denser scale for long pages and small screens", () => {
    expect(mushafOnePageFitScale(1400, 620, "pager")).toBeCloseTo(0.59);
    expect(mushafOnePageFitScale(1300, 620, "book")).toBeCloseTo(0.67);
    expect(mushafOnePageFitScale(500, 760, "book")).toBeCloseTo(0.86);
  });
});
