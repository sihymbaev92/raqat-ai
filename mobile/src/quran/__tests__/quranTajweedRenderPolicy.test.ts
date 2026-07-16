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

  it("hatim web falls back to unicode when COLR stack unavailable", () => {
    expect(
      tajweedRenderNoticeKind({
        showTajweed: true,
        arabicScriptEdition: "madinah",
        surface: "hatim",
        mushafBackend: "qcf4",
        platformOS: "web",
        colrPageReady: false,
      })
    ).toBe("hatim_colr_fallback");
  });

  it("hatim native with COLR page ready shows no banner", () => {
    expect(
      tajweedRenderNoticeKind({
        showTajweed: true,
        arabicScriptEdition: "madinah",
        surface: "hatim",
        mushafBackend: "qcf4",
        platformOS: "android",
        colrPageReady: true,
      })
    ).toBe("none");
  });

  it("hatim image backend uses unicode fallback notice kind", () => {
    expect(
      tajweedRenderNoticeKind({
        showTajweed: true,
        arabicScriptEdition: "madinah",
        surface: "hatim",
        mushafBackend: "webp",
        platformOS: "android",
      })
    ).toBe("hatim_unicode_fallback");
  });

  it("hides hatim fallback banners (expected baseline)", () => {
    expect(tajweedRenderNoticeVisible("hatim_unicode_fallback")).toBe(false);
    expect(tajweedRenderNoticeVisible("hatim_colr_fallback")).toBe(false);
  });
});
