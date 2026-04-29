/** Құбылаға «тура» деп саналу үшін макс. ауытқу (градус). 8° — 12°-қа қарағанда тар «жасыл» аймақ. */
export const QIBLA_ALIGN_THRESHOLD_DEG = 8;

export type QiblaAlignHint = "none" | "aligned" | "turn_cw" | "turn_ccw";

export function qiblaAlignHint(rotateDeg: number, bearing: number | null): QiblaAlignHint {
  if (bearing == null) return "none";
  if (Math.abs(rotateDeg) <= QIBLA_ALIGN_THRESHOLD_DEG) return "aligned";
  return rotateDeg > 0 ? "turn_cw" : "turn_ccw";
}
