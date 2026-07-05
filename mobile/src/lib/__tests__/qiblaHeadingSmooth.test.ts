import { smoothBearing, smoothHeading } from "../qiblaHeadingSmooth";

describe("qiblaHeadingSmooth", () => {
  describe("smoothHeading balanced", () => {
    it("ignores sub-degree jitter inside dead zone", () => {
      expect(smoothHeading("balanced", 90, 90.4)).toBe(90);
      expect(smoothHeading("balanced", 90, 89.6)).toBe(90);
    });

    it("moves slowly for larger steps", () => {
      const out = smoothHeading("balanced", 0, 10);
      expect(out).toBeGreaterThan(0);
      expect(out).toBeLessThan(3);
    });

    it("handles wrap-around without jumping backwards", () => {
      const out = smoothHeading("balanced", 359, 1);
      expect(out).toBeGreaterThan(359);
      expect(out).toBeLessThanOrEqual(360);
    });
  });

  describe("smoothBearing", () => {
    it("returns first sample as-is", () => {
      expect(smoothBearing(null, 245.3)).toBeCloseTo(245.3, 5);
    });

    it("ignores tiny GPS noise", () => {
      expect(smoothBearing(245.0, 245.08)).toBe(245.0);
    });

    it("eases toward new bearing", () => {
      const out = smoothBearing(240, 250);
      expect(out).toBeGreaterThan(240);
      expect(out).toBeLessThan(250);
    });
  });
});
