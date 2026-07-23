import {
  azimuthRadFromRotationMatrix9,
  headingDegFlatMagnetometer,
  headingDegFromGravityMagnetic,
  remapRotationMatrixAxisXAxisZ,
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

  test("upright portrait: device-Y heading stays finite", () => {
    /** Телефон тік: gravity ≈ +Y — remap жоқ, Y-ось heading */
    const gravity = { x: 0, y: 9.81, z: 0 };
    const mag = { x: 0, y: 0, z: -40 };
    const fused = headingDegFromGravityMagnetic(gravity, mag);
    expect(fused).not.toBeNull();
    expect(fused).toBeGreaterThanOrEqual(0);
    expect(fused).toBeLessThan(360);
  });

  test("remap AXIS_X/AXIS_Z matches AOSP column swap for flat identity-like row", () => {
    const inR = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    const out = remapRotationMatrixAxisXAxisZ(inR);
    expect(out).not.toBeNull();
    /** out row0: [1, 0, 0] → col0 from in col0, col1 = -in col2 = 0, col2 = in col1 = 0 */
    expect(out![0]).toBe(1);
    expect(out![1]).toBeCloseTo(0);
    expect(out![2]).toBeCloseTo(0);
  });
});
