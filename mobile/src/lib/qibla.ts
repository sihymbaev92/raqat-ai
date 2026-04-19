/** Қағба координаталары (әл-Харам мешіті маңы). */
export const KAABA_LAT = 21.422487;
export const KAABA_LNG = 39.826206;

/**
 * Пайдаланушы нүктесінен құбылаға бұрыш (0° = солтүстік, сағат тіліне).
 */
export function bearingToKaaba(latDeg: number, lngDeg: number): number {
  const φ1 = (latDeg * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lngDeg) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let θ = (Math.atan2(y, x) * 180) / Math.PI;
  return (θ + 360) % 360;
}

/** Екі бұрыштың айырмасы (-180..180), көрсеткі үшін. */
export function angleDiff(fromDeg: number, toDeg: number): number {
  let d = toDeg - fromDeg;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}
