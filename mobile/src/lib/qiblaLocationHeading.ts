import { angleDiff } from "./qibla";

export function normHeadingDeg(deg: number): number {
  if (!Number.isFinite(deg)) {
    return 0;
  }
  return ((deg % 360) + 360) % 360;
}

export type LocationHeadingLike = {
  trueHeading?: number;
  magHeading?: number;
  accuracy?: number;
};

/**
 * expo-location компасы: magHeading — әдетте магниттік солтүстік; trueHeading — географиялық солтүстік.
 * Expo Android (LocationModule.kt): trueHeading = magHeading + GeomagneticField.declination (сол сенсор жұбы).
 * bearingToKaaba географиялық азимут болғандықтан, mag қолданғанда қолданба деклинациясы (declEastDeg) қосылады.
 */
export function headingFromLocationHeading(
  h: LocationHeadingLike,
  declEastDeg: number,
  platform: "ios" | "android" | "windows" | "macos" | "web"
): number {
  const t = h.trueHeading;
  const m = h.magHeading;
  const acc = h.accuracy;
  const tOk = typeof t === "number" && Number.isFinite(t) && t >= 0;
  const mOk = typeof m === "number" && Number.isFinite(m) && m >= 0;

  const accLooksGood = typeof acc === "number" && acc >= 2 && acc < 120;
  const magAdjusted = mOk ? normHeadingDeg(m + declEastDeg) : 0;

  const trueMagSepDeg = !mOk || !tOk ? 999 : Math.abs(angleDiff(t, m));
  /**
   * Аймақта деклинация үлкен болса, ал trueHeading магнитпен дерлік бірдей болса — true географиялық емес (OEM/қате).
   * Төменгі ендіктерде (|decl| шамалы) t≈m заңды.
   */
  const suspiciousTrueEqualsMag =
    mOk && tOk && trueMagSepDeg < 1 && Math.abs(declEastDeg) > 2.5;
  /**
   * Android-та кей OEM/Expo комбинацияларында trueHeading тұрақсыз немесе magHeading-пен
   * сәйкес келмей қалады. Қолданбада географиялық declination бар, сондықтан Android үшін
   * mag+decl бірінші таңдау: бұл Құбылада "кері/қисық" көрсетуді азайтады.
   */
  if (platform === "android" && mOk) {
    return magAdjusted;
  }

  let useTrue = false;
  if (tOk) {
    useTrue = accLooksGood && !suspiciousTrueEqualsMag;
  }
  if (useTrue && tOk) {
    return normHeadingDeg(t);
  }
  if (mOk) {
    return normHeadingDeg(m + declEastDeg);
  }
  if (tOk) {
    return normHeadingDeg(t);
  }
  return 0;
}
