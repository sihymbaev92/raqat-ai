import { smoothBearing, smoothHeading } from "../qiblaHeadingSmooth";
import { angleDiff } from "../qibla";

describe("qiblaHeadingSmooth", () => {
  describe("smoothHeading fast", () => {
    it("snaps hard on large turns", () => {
      const out = smoothHeading("fast", 0, 45);
      expect(out).toBeCloseTo(45, 5);
    });

    it("ignores micro jitter", () => {
      expect(smoothHeading("fast", 90, 90.02)).toBe(90);
    });
  });

  describe("smoothHeading balanced", () => {
    it("ignores sub-degree jitter inside dead zone", () => {
      expect(smoothHeading("balanced", 90, 90.05)).toBe(90);
      expect(smoothHeading("balanced", 90, 89.95)).toBe(90);
    });

    it("moves quickly toward larger steps (no chase lag)", () => {
      const out = smoothHeading("balanced", 0, 10);
      expect(out).toBeGreaterThan(5);
      expect(out).toBeLessThanOrEqual(10);
    });

    it("handles wrap-around without jumping the long way", () => {
      const out = smoothHeading("balanced", 359, 1);
      expect(Math.abs(angleDiff(359, out))).toBeLessThan(2.5);
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
