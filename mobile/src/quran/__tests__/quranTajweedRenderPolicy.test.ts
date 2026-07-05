import {
  tajweedRenderNoticeKind,
  tajweedRenderNoticeVisible,
} from "../quranTajweedRenderPolicy";

describe("quranTajweedRenderPolicy", () => {
  it("surah reader uses unicode tag notice", () => {
    expect(
      tajweedRenderNoticeKind({
        showTajweed: true,
        arabicScriptEdition: "madinah",
        surface: "surah",
      })
    ).toBe("surah_unicode_tags");
    expect(tajweedRenderNoticeVisible("surah_unicode_tags")).toBe(true);
  });

  it("hatim web falls back to unicode", () => {
    expect(
      tajweedRenderNoticeKind({
        showTajweed: true,
        arabicScriptEdition: "madinah",
        surface: "hatim",
        mushafBackend: "qcf4",
        platformOS: "web",
      })
    ).toBe("hatim_unicode_fallback");
  });

  it("hatim native qcf4 without colr uses word fallback notice", () => {
    expect(
      tajweedRenderNoticeKind({
        showTajweed: true,
        arabicScriptEdition: "madinah",
        surface: "hatim",
        mushafBackend: "qcf4",
        platformOS: "android",
        colrActive: false,
      })
    ).toBe("hatim_colr_word_fallback");
  });

  it("hatim native colr active hides notice", () => {
    expect(
      tajweedRenderNoticeKind({
        showTajweed: true,
        arabicScriptEdition: "madinah",
        surface: "hatim",
        mushafBackend: "qcf4",
        platformOS: "android",
        colrActive: true,
      })
    ).toBe("none");
  });
});
