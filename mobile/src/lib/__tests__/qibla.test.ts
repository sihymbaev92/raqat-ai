import { bearingToKaaba } from "../qibla";

describe("bearingToKaaba", () => {
  test("Almaty ~SW toward Kaaba", () => {
    const b = bearingToKaaba(43.24, 76.95);
    expect(b).toBeGreaterThan(220);
    expect(b).toBeLessThan(270);
  });

  test("Medina roughly south", () => {
    const b = bearingToKaaba(24.47, 39.61);
    expect(b).toBeGreaterThan(150);
    expect(b).toBeLessThan(200);
  });
});
