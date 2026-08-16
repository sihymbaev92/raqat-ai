import { Platform } from "react-native";
import {
  computeTurkishPrintQfBaselineTextMetrics,
  TURKISH_PRINT_HATIM_MEDINA_PARITY,
  TURKISH_PRINT_QF_BASE_FONT_SIZE,
  TURKISH_PRINT_QF_FIXED_SIZE,
  TURKISH_PRINT_QF_LINE_HEIGHT_FACTOR,
  TURKISH_PRINT_QF_REFERENCE_WIDTH,
  TURKISH_PRINT_HATIM_AUTO_VIEWPORT_FIT,
  TURKISH_PRINT_HATIM_LINE_HEIGHT_FACTOR,
  TURKISH_PRINT_HATIM_UNIFORM_GLYPH_SIZE,
  turkishPrintArabicAyahTextStyle,
  quranArabicAyahStyleForEdition,
  resolveEditionArabicTextStyle,
} from "../quranTurkishPrintTypography";
import { QURAN_BOOK_FONT_FACE } from "../../fonts/quranBookFonts";

describe("computeTurkishPrintQfBaselineTextMetrics", () => {
  it("uses 28px and 2.0 line-height at reference width", () => {
    const { fontSize, lineHeight } = computeTurkishPrintQfBaselineTextMetrics({
      contentWidth: TURKISH_PRINT_QF_REFERENCE_WIDTH,
      mushafTextScale: 1,
    });
    expect(fontSize).toBe(TURKISH_PRINT_QF_BASE_FONT_SIZE);
    expect(lineHeight).toBe(TURKISH_PRINT_QF_BASE_FONT_SIZE * TURKISH_PRINT_QF_LINE_HEIGHT_FACTOR);
  });
});

describe("quranTurkishPrintTypography", () => {
  it("uses Medina QCF4 parity by default", () => {
    expect(TURKISH_PRINT_HATIM_MEDINA_PARITY).toBe(true);
    expect(TURKISH_PRINT_QF_FIXED_SIZE).toBe(false);
    expect(TURKISH_PRINT_HATIM_AUTO_VIEWPORT_FIT).toBe(false);
    expect(TURKISH_PRINT_HATIM_UNIFORM_GLYPH_SIZE).toBe(false);
    expect(TURKISH_PRINT_HATIM_LINE_HEIGHT_FACTOR).toBe(1.42);
  });

  it("leaves madinah style unchanged", () => {
    const base = { fontSize: 22, color: "#111", fontFamily: "Lateef_400Regular" };
    expect(quranArabicAyahStyleForEdition(base, "madinah")).toEqual(base);
  });

  it("applies native scheherazade regular for turkish on native", () => {
    const prev = Platform.OS;
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    try {
      const out = turkishPrintArabicAyahTextStyle({ fontSize: 24, color: "#111" });
      expect(out.fontWeight).toBe("400");
      expect(out.allowFontScaling).toBe(false);
      expect(out.maxFontSizeMultiplier).toBe(1);
      expect(out.fontFamily).toBe(QURAN_BOOK_FONT_FACE.scheherazade);
    } finally {
      Object.defineProperty(Platform, "OS", { configurable: true, value: prev });
    }
  });

  it("resolveEditionArabicTextStyle strips lateef before scheherazade", () => {
    const out = resolveEditionArabicTextStyle(
      {
        fontSize: 26,
        lineHeight: 47,
        fontFamily: "Lateef_400Regular",
        fontWeight: "700",
        color: "#111",
      },
      "turkish",
      { fontsReady: true }
    );
    expect(out.fontFamily).toBe(QURAN_BOOK_FONT_FACE.scheherazade);
    expect(out.fontWeight).toBe("400");
    expect(out.fontSize).toBeUndefined();
  });

  it("falls back to lateef before fonts load", () => {
    const prev = Platform.OS;
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    try {
      const out = turkishPrintArabicAyahTextStyle(
        { fontSize: 24, color: "#111" },
        { fontsReady: false }
      );
      expect(out.fontFamily).toBe(QURAN_BOOK_FONT_FACE.lateef);
      expect(out.fontWeight).toBe("400");
    } finally {
      Object.defineProperty(Platform, "OS", { configurable: true, value: prev });
    }
  });
});
