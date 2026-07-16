import { hatimAutoMushafTextScaleForWidth, hatimRs } from "../hatimResponsiveScale";

describe("hatimResponsiveScale", () => {
  it("scales from 375px base width", () => {
    expect(hatimRs(26, 375)).toBe(26);
    expect(hatimRs(26, 750)).toBeLessThanOrEqual(Math.round(26 * 1.35));
  });

  it("auto mushaf text scale grows on wide phones within locked scale policy", () => {
    const narrow = hatimAutoMushafTextScaleForWidth(320);
    const wide = hatimAutoMushafTextScaleForWidth(430);
    expect(wide).toBeGreaterThan(narrow);
    expect(wide).toBeLessThanOrEqual(0.95 * 1.35);
  });
});
