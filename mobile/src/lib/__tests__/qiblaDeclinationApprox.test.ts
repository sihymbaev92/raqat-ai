import { magneticDeclinationEastDeg } from "../qiblaDeclinationApprox";

describe("magneticDeclinationEastDeg", () => {
  it("Қазақстан аймағында шығыс деклинация оң мәнге жақын", () => {
    const d = magneticDeclinationEastDeg(43.2, 76.9);
    expect(d).toBeGreaterThan(6);
    expect(d).toBeLessThan(14);
  });

  it("Нью-Йоркта батыс деклинация (теріс)", () => {
    const d = magneticDeclinationEastDeg(40.7, -74.0);
    expect(d).toBeLessThan(-5);
  });
});
