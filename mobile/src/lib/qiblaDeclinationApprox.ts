/**
 * Магниттік деклинация (Шығыс оң): магниттік солтүстік → географиялық солтүстік бұрышы.
 * bearingToKaaba географиялық азимут; Expo Location magHeading / магнитометр — әдетте магниттік.
 *
 * Толық WMM орнына IDW (inverse distance) интерполяциясы: торап мәндері WMM/IGRF шамамен 2024.
 * Қателік аймаққа ±3–5° болуы мүмкін; жақсырағы — кейін толық WMM модульін қосу.
 */
const ANCHORS: readonly [lat: number, lng: number, declEastDeg: number][] = [
  [43.2, 76.9, 10.0],
  [51.1, 71.4, 7.8],
  [48.0, 66.9, 8.8],
  [40.4, 49.9, 6.5],
  [41.3, 69.3, 9.4],
  [48.0, 37.8, 6.5],
  [55.8, 37.6, 11.2],
  [59.9, 30.3, 11.0],
  [50.1, 8.7, 0.9],
  [51.5, -0.12, -0.3],
  [40.7, -74.0, -13.0],
  [34.0, -118.2, 11.0],
  [25.2, 55.3, 2.0],
  [21.4, 39.8, 3.0],
  [19.0, 72.8, -0.5],
  [28.6, 77.2, 0.5],
  [13.7, 100.5, -0.2],
  [1.3, 103.8, -0.1],
  [35.7, 139.7, -7.0],
  [-33.9, 151.2, 12.5],
  [-23.5, -46.6, -22.0],
  [40.0, 116.4, -8.0],
  [31.2, 121.5, -5.5],
  [-1.3, 36.8, 0.8],
  [50.0, -100.0, 4.0],
  [65.0, -150.0, 18.0],
  [70.0, 25.0, 18.0],
  [35.0, 32.0, 4.5],
  [15.0, 45.0, 3.5],
  [-10.0, -60.0, -18.0],
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
