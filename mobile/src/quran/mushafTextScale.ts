export const MUSHAF_TEXT_SCALE_MIN = 0.88;
export const MUSHAF_TEXT_SCALE_MAX = 1.15;
export const MUSHAF_TEXT_SCALE_STEP = 0.03;
export const HATIM_LOCKED_MUSHAF_TEXT_SCALE = 1.1;

export function clampMushafTextScale(raw: number): number {
  if (!Number.isFinite(raw)) return 1;
  if (Math.abs(raw - HATIM_LOCKED_MUSHAF_TEXT_SCALE) < 0.005) {
    return HATIM_LOCKED_MUSHAF_TEXT_SCALE;
  }
  const s = Math.round(raw / MUSHAF_TEXT_SCALE_STEP) * MUSHAF_TEXT_SCALE_STEP;
  return Math.min(MUSHAF_TEXT_SCALE_MAX, Math.max(MUSHAF_TEXT_SCALE_MIN, s));
}
