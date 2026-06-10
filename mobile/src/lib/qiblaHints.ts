/** Құбылаға «тура» деп саналу үшін макс. ауытқу (градус). 5° — точнее туралау. */
export const QIBLA_ALIGN_THRESHOLD_DEG = 5;

export type QiblaAlignHint = "none" | "aligned" | "turn_cw" | "turn_ccw";

export function qiblaAlignHint(
  rotateDeg: number,
  bearing: number | null,
  opts?: { headingReady?: boolean }
): QiblaAlignHint {
  if (bearing == null) return "none";
  if (opts?.headingReady === false) return "none";
  if (Math.abs(rotateDeg) <= QIBLA_ALIGN_THRESHOLD_DEG) return "aligned";
  return rotateDeg > 0 ? "turn_cw" : "turn_ccw";
}
