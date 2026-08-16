import {
  QURAN_READER_FONT_CONFIG,
  QURAN_READER_FONT_WIDTH_FACTOR,
  computeQuranReaderHorizontalPadding,
  computeQuranReaderViewportMetrics,
  mushafTextScaleToReaderFontMode,
  quranReaderAyahContainerStyle,
  quranReaderAyahHostStyle,
  quranReaderAyahTextLayoutStyle,
} from "../quranReaderViewportMetrics";
import { buildQuranArabicFlowMetrics } from "../../components/quran/QuranArabicAyahFlow";

describe("quranReaderViewportMetrics", () => {
  it("uses true contentWidth * 0.065 with standard mode clamp", () => {
    const m = computeQuranReaderViewportMetrics(360, "standard", 1, { screenHeight: 780 });
    const pad = computeQuranReaderHorizontalPadding(360, 780);
    const contentWidth = Math.max(244, 360 - pad * 2);
    const raw = contentWidth * QURAN_READER_FONT_WIDTH_FACTOR * QURAN_READER_FONT_CONFIG.standard.scale;
    expect(m.fontSize).toBe(Math.round(Math.max(22, Math.min(32, raw))));
    expect(m.contentWidth).toBe(contentWidth);
    expect(m.horizontalPadding).toBe(pad);
    expect(m.lineHeight).toBe(Math.round(m.fontSize * 1.9));
  });

  it("maps mushafTextScale to font modes", () => {
    expect(mushafTextScaleToReaderFontMode(0.88)).toBe("standard");
    expect(mushafTextScaleToReaderFontMode(1.04)).toBe("large");
    expect(mushafTextScaleToReaderFontMode(1.15)).toBe("extraLarge");
  });

  it("large mode increases font and line-height multiplier", () => {
    const std = computeQuranReaderViewportMetrics(390, "standard", 1, { screenHeight: 844 });
    const large = computeQuranReaderViewportMetrics(390, "large", 1, { screenHeight: 844 });
    expect(large.fontSize).toBeGreaterThanOrEqual(std.fontSize);
    expect(large.lineHeight / large.fontSize).toBeGreaterThanOrEqual(1.9);
  });

  it("landscape grows padding toward 48px and clamps font on wide screens", () => {
    const portrait = computeQuranReaderViewportMetrics(390, "standard", 1, { screenHeight: 844 });
    const landscape = computeQuranReaderViewportMetrics(844, "standard", 1, { screenHeight: 390 });
    expect(landscape.horizontalPadding).toBeGreaterThan(portrait.horizontalPadding);
    expect(landscape.fontSize).toBe(32);
    expect(landscape.contentWidth).toBe(844 - landscape.horizontalPadding * 2);
  });

  it("tablet landscape uses full width without 600 cap", () => {
    const tablet = computeQuranReaderViewportMetrics(1024, "standard", 1, { screenHeight: 768 });
    const raw =
      tablet.contentWidth * QURAN_READER_FONT_WIDTH_FACTOR * QURAN_READER_FONT_CONFIG.standard.scale;
    expect(tablet.fontSize).toBe(Math.round(Math.max(22, Math.min(32, raw))));
    expect(tablet.contentWidth).toBeGreaterThan(600);
  });

  it("turkish print uses higher line-height multiplier", () => {
    const std = computeQuranReaderViewportMetrics(390, "standard", 1, {
      turkishPrint: true,
      screenHeight: 844,
    });
    expect(std.lineHeight / std.fontSize).toBeGreaterThanOrEqual(2.0);
  });

  it("ayah container avoids fixed height and uses overflow visible", () => {
    expect(quranReaderAyahContainerStyle().overflow).toBe("visible");
    expect(quranReaderAyahContainerStyle().height).toBeUndefined();
    expect(quranReaderAyahHostStyle().overflow).toBe("visible");
  });

  it("text layout uses flexShrink 1 and android padding", () => {
    expect(quranReaderAyahTextLayoutStyle().flexShrink).toBe(1);
    expect(quranReaderAyahTextLayoutStyle().allowFontScaling).toBe(false);
  });

  it("reader engine locks viewport metrics", () => {
    const viewport = computeQuranReaderViewportMetrics(360, "standard", 1, { screenHeight: 780 });
    const metrics = buildQuranArabicFlowMetrics({
      contentWidth: viewport.contentWidth,
      baseFontSize: viewport.fontSize,
      baseLineHeight: viewport.lineHeight,
      baseTextStyle: { color: "#111" },
      ayahScrollStyle: true,
      readerEngine: true,
      parentHandlesHorizontalInset: true,
    });
    expect(metrics.fontSize).toBe(viewport.fontSize);
    expect(metrics.baseTextStyle.flexShrink).toBe(1);
  });

  it("horizontal padding portrait is 16–24px", () => {
    expect(computeQuranReaderHorizontalPadding(320, 640)).toBeGreaterThanOrEqual(16);
    expect(computeQuranReaderHorizontalPadding(600, 900)).toBeLessThanOrEqual(24);
  });
});
