/**
 * muftyat.kz «Құран оқып-үйренейік!» оқулығының араб стилі:
 * анық Naskh қаріп, жасыл сия, крем қағаз фоны.
 */
export const MUFTYAT_QURAN_ARABIC_INK_LIGHT = "#1B7340";
export const MUFTYAT_QURAN_ARABIC_INK_DARK = "#9AE6B4";
export const MUFTYAT_QURAN_PAGE_FACE_LIGHT = "#FAF7F0";
export const MUFTYAT_QURAN_TITLE_INK_LIGHT = "#1B7340";

export function muftyatQuranArabicInk(isDark: boolean): string {
  return isDark ? MUFTYAT_QURAN_ARABIC_INK_DARK : MUFTYAT_QURAN_ARABIC_INK_LIGHT;
}
