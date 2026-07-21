import {
  resolveScreenFitMetrics,
  screenFitExplicitEdgeStyle,
  screenFitScrollContentStyle,
} from "../screenFit";

describe("screenFit", () => {
  it("reduces padding and scale on compact phones", () => {
    const m = resolveScreenFitMetrics(320, 568);
    expect(m.isCompactPhone).toBe(true);
    expect(m.horizontalPadding).toBe(8);
    expect(m.fontScale).toBeLessThan(1);
    expect(m.layoutScale).toBeLessThan(1);
    expect(m.contentWidth).toBe(304);
  });

  it("uses full phone width without desktop max content clamp", () => {
    const m = resolveScreenFitMetrics(430, 932);
    expect(m.isWide).toBe(false);
    expect(m.maxContentWidth).toBe(430);
    expect(m.horizontalPadding).toBe(14);
  });

  it("centers wide layouts with a readable content width", () => {
    const m = resolveScreenFitMetrics(1024, 768);
    const style = screenFitScrollContentStyle(m, { top: 12, bottom: 24 });
    expect(m.isWide).toBe(true);
    expect(m.maxContentWidth).toBe(720);
    expect(style.maxWidth).toBe(720);
    expect(style.alignSelf).toBe("center");
    expect(style.paddingHorizontal).toBe(24);
  });

  it("builds explicit edge overrides for screen-fit scroll views", () => {
    expect(screenFitExplicitEdgeStyle({ bottom: 32 })).toEqual({ paddingBottom: 32 });
    expect(screenFitExplicitEdgeStyle({ top: 10, bottom: 28 })).toEqual({ paddingTop: 10, paddingBottom: 28 });
    expect(screenFitExplicitEdgeStyle()).toBeNull();
  });
});

