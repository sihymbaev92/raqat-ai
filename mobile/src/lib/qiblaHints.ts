/** Құбылаға тура келу үшін ауытқу шегі (градус көрсетілмейді, тек ішкі есеп). */
export const QIBLA_ALIGN_THRESHOLD_DEG = 12;

export type QiblaAlignHint = "none" | "aligned" | "turn_cw" | "turn_ccw";

export function qiblaAlignHint(rotateDeg: number, bearing: number | null): QiblaAlignHint {
  if (bearing == null) return "none";
  if (Math.abs(rotateDeg) <= QIBLA_ALIGN_THRESHOLD_DEG) return "aligned";
  return rotateDeg > 0 ? "turn_cw" : "turn_ccw";
}
