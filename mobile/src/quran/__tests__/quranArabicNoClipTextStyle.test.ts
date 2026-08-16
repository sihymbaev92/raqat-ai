import { quranArabicNoClipTextStyle } from "../quranArabicNoClipTextStyle";

describe("quranArabicNoClipTextStyle", () => {
  it("keeps Arabic ayah text from using a clipping-prone lineHeight", () => {
    const style = quranArabicNoClipTextStyle({
      fontSize: 26,
      lineHeight: 34,
      includeFontPadding: false,
    });

    expect(style.includeFontPadding).toBe(true);
    expect(style.lineHeight).toBeGreaterThanOrEqual(49);
    expect(style.paddingBottom).toBeGreaterThanOrEqual(6);
    expect(style.textAlignVertical).toBe("center");
  });

  it("does not shrink already safe Arabic lineHeight", () => {
    const style = quranArabicNoClipTextStyle({
      fontSize: 30,
      lineHeight: 62,
      paddingBottom: 12,
    });

    expect(style.lineHeight).toBe(62);
    expect(style.paddingBottom).toBe(12);
  });

  it("adds descender room for turkishMedinaParity without Medina-open spacing", () => {
    const style = quranArabicNoClipTextStyle(
      { fontSize: 28, lineHeight: 34, includeFontPadding: false },
      { turkishMedinaParity: true }
    );

    expect(style.includeFontPadding).toBe(true);
    expect(style.lineHeight).toBeGreaterThanOrEqual(37);
    expect(style.paddingBottom).toBeGreaterThanOrEqual(3);
    expect(style.textAlignVertical).toBe("top");
  });

  it("adds extra descender room for turkish scroll list", () => {
    const style = quranArabicNoClipTextStyle(
      { fontSize: 23, lineHeight: 41, includeFontPadding: false },
      { turkishMedinaParity: true, ayahScrollStyle: true }
    );

    expect(style.lineHeight).toBeGreaterThanOrEqual(41);
    expect(style.paddingBottom).toBeGreaterThanOrEqual(5);
    expect(style.textAlignVertical).toBe("center");
  });
});
