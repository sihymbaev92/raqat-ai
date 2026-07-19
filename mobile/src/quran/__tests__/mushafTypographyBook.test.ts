import { computeMushafTypography } from "../mushafTypography";

import {

  MUSHAF_BOOK_PAGE_FACE_LIGHT,

  illuminatedManuscriptPalette,

} from "../../theme/illuminatedMushafManuscript";

import { QURAN_BOOK_FONT_FACE } from "../../fonts/quranBookFonts";

import { quranArabicAyahTextMetrics } from "../../config/quranArabicFontPresets";

import { QURAN_READING_CREAM } from "../../theme/quranComReadingTheme";



describe("computeMushafTypography (mushaf book reader)", () => {

  it("uses Uthmanic Lateef for quran_com mushaf preset", () => {

    const metrics = quranArabicAyahTextMetrics("quran_com");

    expect(metrics.fontFamily).toBe(QURAN_BOOK_FONT_FACE.uthmanic);

    expect(metrics.lineHeight).toBeGreaterThanOrEqual(Math.round((metrics.fontSize ?? 26) * 1.8) - 1);

  });



  it("uses original ink when muftyat theme is normalized for book mushaf", () => {

    const lightBook = computeMushafTypography("book_muftyat", 1, false, "medium", {

      bookMushaf: true,

      readingThemeId: "muftyat",

    });

    expect(lightBook.mushafPageInk).toBe("#0E0C0A");

  });



  it("uses soft ink for original Ayah-style theme", () => {

    const light = computeMushafTypography("quran_com", 1, false, "medium", {

      bookMushaf: true,

      readingThemeId: "original",

    });

    expect(light.mushafPageInk).toBe("#0E0C0A");

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



  it("uses cream Ayah-style page face for original theme", () => {

    const light = illuminatedManuscriptPalette(false, "original");

    expect(MUSHAF_BOOK_PAGE_FACE_LIGHT).toBe(QURAN_READING_CREAM);

    expect(light.pageFace).toBe("#FDFBF7");

    expect(light.pageBorderVertical).toBe(false);

  });

});

