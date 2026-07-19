export const MUSHAF_TEXT_SCALE_MIN = 0.88;
export const MUSHAF_TEXT_SCALE_MAX = 1.15;
export const MUSHAF_TEXT_SCALE_STEP = 0.03;
/** Хатым беті: аят анық оқылуы үшін сәл үлкейтілген масштаб. */
export const HATIM_LOCKED_MUSHAF_TEXT_SCALE = 1.04;

/** Хатым: барлық беттерде бірдей араб қарпі (QCF4 glyph + unicode). */
export const HATIM_UNIFIED_ARABIC_FONT_SIZE = Math.round(26 * 1.02 * HATIM_LOCKED_MUSHAF_TEXT_SCALE);
export const HATIM_UNIFIED_ARABIC_LINE_HEIGHT = Math.round(HATIM_UNIFIED_ARABIC_FONT_SIZE * 1.8);

/** Хатым аят нөмірі эмблемасы: барлық беттерде бірдей, араб қарпінен сәл кіші. */
export const HATIM_UNIFIED_AYAH_MARKER_HEIGHT = Math.max(20, Math.round(HATIM_UNIFIED_ARABIC_FONT_SIZE * 0.88));
export const HATIM_UNIFIED_AYAH_MARKER_FONT_SIZE = Math.max(9, Math.round(HATIM_UNIFIED_ARABIC_FONT_SIZE * 0.4));

export function clampMushafTextScale(raw: number): number {
  if (!Number.isFinite(raw)) return 1;
  if (Math.abs(raw - HATIM_LOCKED_MUSHAF_TEXT_SCALE) < 0.005) {
    return HATIM_LOCKED_MUSHAF_TEXT_SCALE;
  }
  const s = Math.round(raw / MUSHAF_TEXT_SCALE_STEP) * MUSHAF_TEXT_SCALE_STEP;
  return Math.min(MUSHAF_TEXT_SCALE_MAX, Math.max(MUSHAF_TEXT_SCALE_MIN, s));
}
