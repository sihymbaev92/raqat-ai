import { headingDegFlatMagnetometer, headingDegFromGravityMagnetic, type Vec3 } from "./qiblaSensorMath";

export type { Vec3 } from "./qiblaSensorMath";

/** Жердің тартқышы негізінен бір ось бойы (жазық ұстау, портрет). */
export function isAccelMostlyVertical(a: Vec3): boolean {
  const mag = Math.hypot(a.x, a.y, a.z);
  if (mag < 4) {
    return false;
  }
  const horiz = Math.hypot(a.x, a.y);
  return horiz < mag * 0.33;
}

/**
 * Бұрын Android үшін fused ≈ flat+180° кезінде +180° қолданылған; кей құрылғыларда
 * құбылаға кері бағыт берді. Енді тек магниттік→гео деклинациямен түзетеміз; +180 автоматты емес.
 */
export function reconcileFusedMagHeadingForPlatform(
  fused: number,
  _flat: number,
  _accel: Vec3,
  _accelReady: boolean,
  _platform: string
): number {
  return fused;
}

/**
 * Акселерометр + магнитометр (getRotationMatrix стилі); сәтсіз болса жазық atan2.
 */
export function magnetometerHeadingDeg(
  m: Vec3,
  accel: Vec3,
  accelReady: boolean,
  platform: string
): number {
  const flat = headingDegFlatMagnetometer(m);
  if (!accelReady) {
    return flat;
  }
  const fused = headingDegFromGravityMagnetic(accel, m);
  if (fused == null) {
    return flat;
  }
  return reconcileFusedMagHeadingForPlatform(fused, flat, accel, true, platform);
}
