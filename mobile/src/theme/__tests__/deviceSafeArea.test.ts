import {
  deviceSafeAreaInsets,
  ZERO_EDGE_INSETS,
  zeroedSafeAreaMetrics,
  screenContentBottomPad,
} from "../deviceSafeArea";

describe("deviceSafeAreaInsets", () => {
  it("applies Android status-bar fallback when insets are zero", () => {
    const out = deviceSafeAreaInsets(ZERO_EDGE_INSETS);
    expect(out.top).toBeGreaterThanOrEqual(12);
    expect(out.bottom).toBeGreaterThanOrEqual(8);
  });

  it("preserves larger measured insets", () => {
    const out = deviceSafeAreaInsets({ top: 48, bottom: 34, left: 0, right: 0 });
    expect(out.top).toBe(48);
    expect(out.bottom).toBe(34);
  });
});

describe("screenContentBottomPad", () => {
  it("adds minimum scroll tail padding", () => {
    expect(screenContentBottomPad(24)).toBeGreaterThanOrEqual(28);
  });
});

describe("zeroedSafeAreaMetrics", () => {
  it("zeros insets for nested provider", () => {
    const m = zeroedSafeAreaMetrics(390, 844);
    expect(m.insets).toEqual(ZERO_EDGE_INSETS);
    expect(m.frame).toEqual({ x: 0, y: 0, width: 390, height: 844 });
  });
});
