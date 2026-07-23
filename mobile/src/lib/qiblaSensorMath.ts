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

/**
 * Android SensorManager.remapCoordinateSystem(inR, AXIS_X, AXIS_Z, outR) — AOSP порты.
 * AXIS_X=1, AXIS_Z=3.
 */
export function remapRotationMatrixAxisXAxisZ(inR: ArrayLike<number>): Float32Array | null {
  if (inR.length < 9) return null;
  const X = 1;
  const Y = 3;
  let Z = X ^ Y;
  const x = (X & 0x3) - 1;
  const y = (Y & 0x3) - 1;
  const z = (Z & 0x3) - 1;
  const axisY = (z + 1) % 3;
  const axisZ = (z + 2) % 3;
  if (((x ^ axisY) | (y ^ axisZ)) !== 0) {
    Z ^= 0x80;
  }
  const sx = X >= 0x80;
  const sy = Y >= 0x80;
  const sz = Z >= 0x80;
  const out = new Float32Array(9);
  for (let j = 0; j < 3; j++) {
    const offset = j * 3;
    for (let i = 0; i < 3; i++) {
      if (x === i) out[offset + i] = sx ? -(inR[offset]! ) : inR[offset]!;
      if (y === i) out[offset + i] = sy ? -(inR[offset + 1]!) : inR[offset + 1]!;
      if (z === i) out[offset + i] = sz ? -(inR[offset + 2]!) : inR[offset + 2]!;
    }
  }
  return out;
}

/** R[8] ≈ device Z · world Up; жазыққа жақын болса remap керек емес. */
export function isRotationMatrixMostlyFlat(R: ArrayLike<number>): boolean {
  const r8 = Math.max(-1, Math.min(1, R[8] ?? 0));
  const inclinationRad = Math.acos(r8);
  return inclinationRad < (25 * Math.PI) / 180 || inclinationRad > (155 * Math.PI) / 180;
}

export function headingDegFromRotationMatrix9(R: ArrayLike<number>): number | null {
  /**
   * Компас UI: көрсеткі экранның **үстіңгі** жиегіне қарайды.
   * AXIS_X/AXIS_Z remap (камера −Z) тік ұстағанда азимутты артқы камераға байлап,
   * көрсеткі мен «тура» белгісін шатастырады — камера режимі жойылғандықтан remap жоқ.
   * Телефонды жазық ұстау — ең тұрақты нәтиже.
   */
  const rad = azimuthRadFromRotationMatrix9(R);
  let deg = (rad * 180) / Math.PI;
  if (!Number.isFinite(deg)) {
    return null;
  }
  deg = (deg + 360) % 360;
  return deg;
}

export function headingDegFromGravityMagnetic(
  gravity: Vec3,
  geomagnetic: Vec3
): number | null {
  const R = rotationMatrix9FromGravityMagnetic(gravity, geomagnetic);
  if (!R) {
    return null;
  }
  return headingDegFromRotationMatrix9(R);
}
