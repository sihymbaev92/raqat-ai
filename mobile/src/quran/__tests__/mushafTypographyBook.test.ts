import { computeMushafTypography } from "../mushafTypography";
import {
  MUSHAF_BOOK_PAGE_FACE_LIGHT,
  illuminatedManuscriptPalette,
} from "../../theme/illuminatedMushafManuscript";
import {
  MUFTYAT_QURAN_ARABIC_INK_LIGHT,
} from "../../theme/muftyatQuranStyle";
import { QURAN_BOOK_FONT_FACE } from "../../fonts/quranBookFonts";
import { quranArabicAyahTextMetrics } from "../../config/quranArabicFontPresets";

describe("computeMushafTypography (mushaf book reader)", () => {
  it("uses Scheherazade for quran_com mushaf preset (Quran.com clone)", () => {
    const metrics = quranArabicAyahTextMetrics("quran_com");
    expect(metrics.fontFamily).toBe(QURAN_BOOK_FONT_FACE.scheherazade);
  });

  it("uses muftyat green ink when muftyat theme + book_muftyat preset", () => {
    const lightBook = computeMushafTypography("book_muftyat", 1, false, "medium", {
      bookMushaf: true,
      readingThemeId: "muftyat",
    });
    expect(lightBook.mushafPageInk).toBe(MUFTYAT_QURAN_ARABIC_INK_LIGHT);
  });

  it("uses black ink for Quran.com original theme", () => {
    const light = computeMushafTypography("quran_com", 1, false, "medium", {
      bookMushaf: true,
      readingThemeId: "original",
    });
    expect(light.mushafPageInk).toBe("#000000");
  });

  it("uses white ink for dark reading theme", () => {
    const dark = computeMushafTypography("quran_com", 1, true, "medium", {
      bookMushaf: true,
      readingThemeId: "dark",
    });
    expect(dark.mushafPageInk).toBe("#F5F5F5");
  });

  it("still exposes density layout for mushaf spacing", () => {
    const m = computeMushafTypography("quran_com", 1, false, "tight", { bookMushaf: true });
    expect(m.density).toBe("tight");
    expect(m.densityLayout.mushafAyahRowMarginBottom).toBeGreaterThanOrEqual(0);
  });

  it("uses cream Quran.com page face for original theme", () => {
    const light = illuminatedManuscriptPalette(false, "original");
    expect(MUSHAF_BOOK_PAGE_FACE_LIGHT).toBe("#FEF9F3");
    expect(light.pageFace).toBe("#FEF9F3");
    expect(light.pageBorderVertical).toBe(false);
  });
});
