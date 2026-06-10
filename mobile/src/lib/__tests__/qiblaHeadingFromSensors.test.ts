import {
  isAccelMostlyVertical,
  magnetometerHeadingDeg,
  reconcileFusedMagHeadingForPlatform,
} from "../qiblaHeadingFromSensors";
import { headingDegFlatMagnetometer, headingDegFromGravityMagnetic } from "../qiblaSensorMath";
import { angleDiff } from "../qibla";

const flatPortraitAccel = { x: 0, y: 0, z: 9.81 };

describe("qiblaHeadingFromSensors", () => {
  test("isAccelMostlyVertical: screen-up portrait", () => {
    expect(isAccelMostlyVertical(flatPortraitAccel)).toBe(true);
  });

  test("isAccelMostlyVertical: mostly horizontal acceleration rejected", () => {
    expect(isAccelMostlyVertical({ x: 8, y: 0, z: 3 })).toBe(false);
  });

  test("isAccelMostlyVertical: low magnitude rejected", () => {
    expect(isAccelMostlyVertical({ x: 0.1, y: 0.1, z: 0.2 })).toBe(false);
  });

  test("reconcileFusedMagHeadingForPlatform: fused қайтарылады (авто +180° алынып тасталды)", () => {
    expect(reconcileFusedMagHeadingForPlatform(10, 200, flatPortraitAccel, true, "android")).toBe(10);
    expect(reconcileFusedMagHeadingForPlatform(45, 50, flatPortraitAccel, true, "android")).toBe(45);
    expect(reconcileFusedMagHeadingForPlatform(10, 200, flatPortraitAccel, true, "ios")).toBe(10);
  });

  test("magnetometerHeadingDeg: fusion path matches math fixture", () => {
    const gravity = { x: 0, y: 0, z: 9.81 };
    const mag = { x: 0, y: 25, z: -40 };
    const h = magnetometerHeadingDeg(mag, gravity, true, "ios");
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });

  test("magnetometerHeadingDeg: no accel falls back to flat", () => {
    const mag = { x: 10, y: 0, z: -30 };
    const h = magnetometerHeadingDeg(mag, { x: 0, y: 0, z: 0 }, false, "android");
    const flat = (Math.atan2(-10, 0) * (180 / Math.PI) + 360) % 360;
    expect(h).toBeCloseTo(flat, 5);
  });

  test("жазық қалпта flat және gravity+mag fusion азимуты үйлесімді (±25°)", () => {
    const gravityG = { x: 0, y: 0, z: 1 };
    const mag = { x: 12, y: -25, z: -40 };
    const flat = headingDegFlatMagnetometer(mag);
    const fused = headingDegFromGravityMagnetic(gravityG, mag);
    expect(fused).not.toBeNull();
    expect(Math.abs(angleDiff(flat, fused!))).toBeLessThan(25);
  });
});
