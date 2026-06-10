/**
 * Компас бұрышы: Android SensorManager.getRotationMatrix + getOrientation (3×3)
 * портынан — телефон тік ұсталғанда да жақсырақ, тек atan2(my,mx) тек жатық қалпқа жақын.
 */

export type Vec3 = { x: number; y: number; z: number };

/** Портрет, жазық: телефон үсті солтүстікке (0°) — Expo XY-де дұрыс азимут atan2(-x, y). */
export function headingDegFlatMagnetometer(m: Vec3): number {
  let deg = Math.atan2(-m.x, m.y) * (180 / Math.PI);
  if (!Number.isFinite(deg)) {
    return 0;
  }
  return (deg + 360) % 360;
}

/**
 * getRotationMatrix(gravity, geomagnetic) → 3×3 R, содан getOrientation(R)[0] — азимут (рад).
 * Қайтару: градус [0,360) немесе null (еркен түсу / шу).
 */
export function rotationMatrix9FromGravityMagnetic(
  gravity: Vec3,
  geomagnetic: Vec3
): Float32Array | null {
  const Ax = gravity.x;
  const Ay = gravity.y;
  const Az = gravity.z;
  const normsqA = Ax * Ax + Ay * Ay + Az * Az;
  const g = 9.81;
  if (normsqA < 0.01 * g * g) {
    return null;
  }
  const Ex = geomagnetic.x;
  const Ey = geomagnetic.y;
  const Ez = geomagnetic.z;
  let Hx = Ey * Az - Ez * Ay;
  let Hy = Ez * Ax - Ex * Az;
  let Hz = Ex * Ay - Ey * Ax;
  const normH = Math.hypot(Hx, Hy, Hz);
  if (normH < 0.1) {
    return null;
  }
  const invH = 1 / normH;
  Hx *= invH;
  Hy *= invH;
  Hz *= invH;
  const invA = 1 / Math.sqrt(normsqA);
  const ax = Ax * invA;
  const ay = Ay * invA;
  const az = Az * invA;
  const Mx = ay * Hz - az * Hy;
  const My = az * Hx - ax * Hz;
  const Mz = ax * Hy - ay * Hx;
  return new Float32Array([Hx, Hy, Hz, Mx, My, Mz, ax, ay, az]);
}

/** getOrientation(R) values[0] — азимут, радиан (-π..π]. */
export function azimuthRadFromRotationMatrix9(R: ArrayLike<number>): number {
  return Math.atan2(R[1], R[4]);
}

export function headingDegFromGravityMagnetic(
  gravity: Vec3,
  geomagnetic: Vec3
): number | null {
  const R = rotationMatrix9FromGravityMagnetic(gravity, geomagnetic);
  if (!R) {
    return null;
  }
  const rad = azimuthRadFromRotationMatrix9(R);
  let deg = (rad * 180) / Math.PI;
  if (!Number.isFinite(deg)) {
    return null;
  }
  deg = (deg + 360) % 360;
  return deg;
}
