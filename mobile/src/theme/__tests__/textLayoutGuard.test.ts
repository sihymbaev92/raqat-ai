import {
  APP_TEXT_MAX_FONT_SIZE_MULTIPLIER,
  fitSingleLineTextProps,
  isLargeSystemFontScale,
  resolveSystemFontScale,
} from "../textLayoutGuard";

describe("textLayoutGuard", () => {
  it("caps default max font multiplier for MIUI-safe UI", () => {
    expect(APP_TEXT_MAX_FONT_SIZE_MULTIPLIER).toBeLessThanOrEqual(1.15);
  });

  it("detects large system font scale", () => {
    expect(isLargeSystemFontScale(1)).toBe(false);
    expect(isLargeSystemFontScale(1.15)).toBe(true);
  });

  it("builds single-line fit props with iOS auto shrink defaults", () => {
    const props = fitSingleLineTextProps();
    expect(props.numberOfLines).toBe(1);
    expect(props.maxFontSizeMultiplier).toBe(APP_TEXT_MAX_FONT_SIZE_MULTIPLIER);
  });

  it("resolveSystemFontScale returns a positive number", () => {
    expect(resolveSystemFontScale()).toBeGreaterThan(0);
  });
});
