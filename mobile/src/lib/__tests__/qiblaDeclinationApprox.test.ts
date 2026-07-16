import { magneticDeclinationEastDeg } from "../qiblaDeclinationApprox";

describe("magneticDeclinationEastDeg", () => {
  it("Қазақстан аймағында шығыс деклинация ~5° (WMM2025)", () => {
    const d = magneticDeclinationEastDeg(43.2, 76.9);
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(8);
  });

  it("Нью-Йоркта батыс деклинация (теріс)", () => {
    const d = magneticDeclinationEastDeg(40.7, -74.0);
    expect(d).toBeLessThan(-5);
  });
});
