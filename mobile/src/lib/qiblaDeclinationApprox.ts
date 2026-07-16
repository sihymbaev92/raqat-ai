/**
 * Магниттік деклинация (Шығыс оң): магниттік солтүстік → географиялық солтүстік бұрышы.
 * bearingToKaaba географиялық азимут; Expo Location magHeading / магнитометр — әдетте магниттік.
 *
 * Толық WMM орнына IDW (inverse distance) интерполяциясы: торап мәндері WMM ~2025.
 * Android-та нақты GeomagneticField (WMM) қолданылады; бұл — fallback.
 */
const ANCHORS: readonly [lat: number, lng: number, declEastDeg: number][] = [
  [43.2, 76.9, 5.2],
  [51.1, 71.4, 7.5],
  [48.0, 66.9, 6.8],
  [40.4, 49.9, 6.0],
  [41.3, 69.3, 5.5],
  [48.0, 37.8, 8.5],
  [55.8, 37.6, 12.0],
  [59.9, 30.3, 11.5],
  [50.1, 8.7, 3.5],
  [51.5, -0.12, 0.5],
  [40.7, -74.0, -12.5],
  [34.0, -118.2, 11.5],
  [25.2, 55.3, 2.2],
  [21.4, 39.8, 3.5],
  [19.0, 72.8, -0.3],
  [28.6, 77.2, 1.0],
  [13.7, 100.5, -0.5],
  [1.3, 103.8, -0.2],
  [35.7, 139.7, -7.5],
  [-33.9, 151.2, 12.8],
  [-23.5, -46.6, -21.5],
  [40.0, 116.4, -7.5],
  [31.2, 121.5, -5.8],
  [-1.3, 36.8, 0.5],
  [50.0, -100.0, 5.0],
  [65.0, -150.0, 17.0],
  [70.0, 25.0, 12.0],
  [35.0, 32.0, 5.0],
  [15.0, 45.0, 2.5],
  [-10.0, -60.0, -17.0],
];

export function magneticDeclinationEastDeg(latDeg: number, lngDeg: number): number {
  if (!Number.isFinite(latDeg) || !Number.isFinite(lngDeg)) {
    return 0;
  }
  const cosLat = Math.cos((latDeg * Math.PI) / 180);
  let sumW = 0;
  let sumWd = 0;
  for (const [la, lo, d] of ANCHORS) {
    const dlat = latDeg - la;
    const dlng = (lngDeg - lo) * (Math.abs(cosLat) < 0.02 ? 0.02 : cosLat);
    const dist2 = dlat * dlat + dlng * dlng + 4;
    const w = 1 / dist2;
    sumW += w;
    sumWd += w * d;
  }
  if (sumW <= 0) {
    return 0;
  }
  const v = sumWd / sumW;
  return Math.max(-30, Math.min(30, v));
}
