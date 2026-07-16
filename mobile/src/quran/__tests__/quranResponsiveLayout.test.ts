import {
  HATIM_AYAH_AUTO_FIT_BASE_FONT_SIZE,
  HATIM_AYAH_AUTO_FIT_MIN_FONT_SCALE,
  QURAN_AYAH_MIN_HORIZONTAL_PADDING,
  QURAN_SCREEN_HORIZONTAL_PADDING,
  hatimAyahAutoFitTextProps,
  hatimAyahAutoFitTextStyle,
  responsiveQuranFontSize,
  responsiveQuranLineHeight,
} from "../quranResponsiveLayout";

describe("quranResponsiveLayout", () => {
  it("keeps minimum 20px horizontal padding constant", () => {
    expect(QURAN_SCREEN_HORIZONTAL_PADDING).toBeGreaterThanOrEqual(QURAN_AYAH_MIN_HORIZONTAL_PADDING);
    expect(QURAN_SCREEN_HORIZONTAL_PADDING).toBeGreaterThanOrEqual(16);
  });

  it("scales font down on narrow screens and up slightly on wide phones", () => {
    const base = 24;
    expect(responsiveQuranFontSize(320, base)).toBeLessThan(base);
    expect(responsiveQuranFontSize(430, base)).toBeGreaterThanOrEqual(base);
  });

  it("never goes below 16px font even with low fitScale", () => {
    expect(responsiveQuranFontSize(240, 14, { fitScale: 0.88 })).toBeGreaterThanOrEqual(16);
  });

  it("does not shrink below 88% fit scale floor", () => {
    const base = 22;
    const full = responsiveQuranFontSize(360, base, { fitScale: 1 });
    const floored = responsiveQuranFontSize(360, base, { fitScale: 0.5 });
    expect(floored).toBeGreaterThanOrEqual(Math.round(full * 0.88));
  });

  it("uses generous line height for harakat (1.8×)", () => {
    expect(responsiveQuranLineHeight(22)).toBeGreaterThanOrEqual(39);
    expect(responsiveQuranLineHeight(26)).toBe(47);
  });

  it("exposes hatim ayah auto-fit text props", () => {
    const props = hatimAyahAutoFitTextProps();
    expect(props.numberOfLines).toBe(1);
    expect(props.adjustsFontSizeToFit).toBe(true);
    expect(props.minimumFontScale).toBe(HATIM_AYAH_AUTO_FIT_MIN_FONT_SCALE);
    const style = hatimAyahAutoFitTextStyle();
    expect(style.fontSize).toBe(HATIM_AYAH_AUTO_FIT_BASE_FONT_SIZE);
    expect(style.width).toBe("100%");
  });
});
