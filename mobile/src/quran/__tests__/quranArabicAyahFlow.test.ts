import {
  buildQuranArabicFlowMetrics,
} from "../../components/quran/QuranArabicAyahFlow";
import {
  QURAN_AYAH_MIN_HORIZONTAL_PADDING,
  responsiveQuranFontSizeAyahStyle,
  quranAyahScrollContainerStyle,
  quranContinuousFlowStyle,
  quranRtlContainerStyle,
  quranSurahAyahClusterStyle,
} from "../quranResponsiveLayout";

describe("QuranArabicAyahFlow", () => {
  it("buildQuranArabicFlowMetrics enforces readable font and RTL text styles", () => {
    const metrics = buildQuranArabicFlowMetrics({
      contentWidth: 360,
      baseFontSize: 24,
      baseTextStyle: { color: "#111" },
    });
    expect(metrics.fontSize).toBeGreaterThanOrEqual(16);
    expect(metrics.baseTextStyle.textAlign).toBe("right");
    expect(metrics.baseTextStyle.writingDirection).toBe("rtl");
    expect(metrics.inlineTextStyle.textAlign).toBe("right");
    expect(metrics.padH).toBeGreaterThanOrEqual(QURAN_AYAH_MIN_HORIZONTAL_PADDING);
  });

  it("uses tighter 1.28 line-height for turkishMedinaParity compact hatim", () => {
    const metrics = buildQuranArabicFlowMetrics({
      contentWidth: 360,
      baseFontSize: 30,
      baseLineHeight: 39,
      baseTextStyle: { color: "#111" },
      compact: true,
      fitScale: 1,
      skipWidthFactor: true,
      turkishMedinaParity: true,
    });
    expect(metrics.lineHeight).toBeGreaterThanOrEqual(39);
    expect(metrics.baseTextStyle.lineHeight).toBeGreaterThanOrEqual(39);
    expect(metrics.baseTextStyle.textAlignVertical).toBe("top");
  });

  it("skips flow root horizontal pad when parent handles inset", () => {
    const metrics = buildQuranArabicFlowMetrics({
      contentWidth: 360,
      baseFontSize: 30,
      baseLineHeight: 39,
      baseTextStyle: { color: "#111" },
      compact: true,
      turkishMedinaParity: true,
      parentHandlesHorizontalInset: true,
    });
    expect(metrics.padH).toBe(0);
    expect(metrics.padHMin).toBe(0);
    expect(quranRtlContainerStyle(metrics.padH, undefined, { minHorizontalPadding: metrics.padHMin }).paddingHorizontal).toBe(0);
  });

  it("preserves exact QF metrics when turkishQfFixedSize", () => {
    const baseline = { fontSize: 29, lineHeight: 58 };
    const metrics = buildQuranArabicFlowMetrics({
      contentWidth: 360,
      baseFontSize: baseline.fontSize,
      baseLineHeight: baseline.lineHeight,
      baseTextStyle: { color: "#111" },
      compact: true,
      fitScale: 0.5,
      turkishQfFixedSize: true,
    });
    expect(metrics.fontSize).toBe(baseline.fontSize);
    expect(metrics.lineHeight).toBe(baseline.lineHeight);
    expect(metrics.baseTextStyle.lineHeight).toBe(baseline.lineHeight);
  });

  it("scales QCF4 viewport line-height with fitScale", () => {
    const metrics = buildQuranArabicFlowMetrics({
      contentWidth: 360,
      baseFontSize: 30,
      baseTextStyle: { color: "#111" },
      compact: true,
      fitScale: 0.7,
      skipWidthFactor: true,
      baseLineHeight: 44,
    });
    expect(metrics.fontSize).toBe(21);
    expect(metrics.lineHeight).toBeLessThan(44);
    expect(metrics.lineHeight).toBeGreaterThan(metrics.fontSize);
  });

  it("compact hatim metrics never drop below 18px font", () => {
    const metrics = buildQuranArabicFlowMetrics({
      contentWidth: 280,
      baseFontSize: 22,
      baseTextStyle: { color: "#111" },
      compact: true,
      fitScale: 0.88,
    });
    expect(metrics.fontSize).toBeGreaterThanOrEqual(18);
  });

  it("ayah scroll style uses Flutter width*0.065 clamped 22-28", () => {
    expect(responsiveQuranFontSizeAyahStyle(360)).toBe(23);
    expect(responsiveQuranFontSizeAyahStyle(280)).toBe(22);
    expect(responsiveQuranFontSizeAyahStyle(500)).toBe(28);
    const metrics = buildQuranArabicFlowMetrics({
      contentWidth: 360,
      baseFontSize: 24,
      baseTextStyle: { color: "#111" },
      ayahScrollStyle: true,
    });
    expect(metrics.fontSize).toBe(23);
    expect(metrics.baseTextStyle.lineHeight).toBeGreaterThanOrEqual(metrics.fontSize + 10);
    expect(metrics.baseTextStyle.width).toBe("100%");
    expect(metrics.baseTextStyle.alignSelf).toBe("stretch");
    expect(metrics.ayahScrollStyle).toBe(true);
  });
});

describe("quranResponsiveLayout RTL containers", () => {
  it("quranRtlContainerStyle uses direction rtl and min padding", () => {
    const style = quranRtlContainerStyle();
    expect(style.direction).toBe("rtl");
    expect(style.paddingHorizontal).toBeGreaterThanOrEqual(QURAN_AYAH_MIN_HORIZONTAL_PADDING);
    expect(style.overflow).toBe("visible");
  });

  it("quranAyahScrollContainerStyle avoids direction rtl for Android text align", () => {
    const style = quranAyahScrollContainerStyle(0);
    expect(style.direction).toBeUndefined();
    expect(style.width).toBe("100%");
    expect(style.alignSelf).toBe("stretch");
  });

  it("flow and cluster styles use flexWrap wrap", () => {
    expect(quranContinuousFlowStyle().flexWrap).toBe("wrap");
    expect(quranContinuousFlowStyle().direction).toBe("rtl");
    expect(quranSurahAyahClusterStyle().flexWrap).toBe("wrap");
    expect(quranSurahAyahClusterStyle().direction).toBe("rtl");
  });
});
