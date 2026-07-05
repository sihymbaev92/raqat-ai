import {
  buildQuranArabicFlowMetrics,
} from "../../components/quran/QuranArabicAyahFlow";
import {
  QURAN_AYAH_MIN_HORIZONTAL_PADDING,
  responsiveQuranFontSizeAyahStyle,
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
  });
});

describe("quranResponsiveLayout RTL containers", () => {
  it("quranRtlContainerStyle uses direction rtl and min padding", () => {
    const style = quranRtlContainerStyle();
    expect(style.direction).toBe("rtl");
    expect(style.paddingHorizontal).toBeGreaterThanOrEqual(QURAN_AYAH_MIN_HORIZONTAL_PADDING);
    expect(style.overflow).toBe("visible");
  });

  it("flow and cluster styles use flexWrap wrap", () => {
    expect(quranContinuousFlowStyle().flexWrap).toBe("wrap");
    expect(quranContinuousFlowStyle().direction).toBe("rtl");
    expect(quranSurahAyahClusterStyle().flexWrap).toBe("wrap");
    expect(quranSurahAyahClusterStyle().direction).toBe("rtl");
  });
});
