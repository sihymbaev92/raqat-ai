import {
  azimuthRadFromRotationMatrix9,
  headingDegFlatMagnetometer,
  headingDegFromGravityMagnetic,
  rotationMatrix9FromGravityMagnetic,
} from "../qiblaSensorMath";

describe("qiblaSensorMath", () => {
  test("headingDegFlatMagnetometer: north-up (field mostly +Y) reads ~0° not ~90°", () => {
    const northUp = headingDegFlatMagnetometer({ x: 0, y: 25, z: -40 });
    expect(northUp).toBeGreaterThanOrEqual(0);
    expect(northUp).toBeLessThan(45);
  });

  test("flat screen up: fusion returns stable degree", () => {
    const gravity = { x: 0, y: 0, z: 9.81 };
    const mag = { x: 0, y: 25, z: -40 };
    const fused = headingDegFromGravityMagnetic(gravity, mag);
    expect(fused).not.toBeNull();
    expect(fused).toBeGreaterThanOrEqual(0);
    expect(fused).toBeLessThan(360);
  });

  test("rotationMatrix9 matches getOrientation azimuth formula", () => {
    const g = { x: 0, y: 0, z: 9.81 };
    const m = { x: 10, y: 0, z: -30 };
    const R = rotationMatrix9FromGravityMagnetic(g, m);
    expect(R).not.toBeNull();
    const az = azimuthRadFromRotationMatrix9(R as Float32Array);
    expect(Math.abs(az)).toBeLessThan(Math.PI);
  });

  test("free-fall gravity returns null matrix", () => {
    const g = { x: 0, y: 0, z: 0 };
    const m = { x: 20, y: 10, z: -30 };
    expect(rotationMatrix9FromGravityMagnetic(g, m)).toBeNull();
    expect(headingDegFromGravityMagnetic(g, m)).toBeNull();
  });
});
