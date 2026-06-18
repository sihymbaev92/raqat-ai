/**
 * Ұзын аят араб мәтінінде жол қиылысуын азайту: негізгі lineHeight-ке символ ұзындығына байланысты жеңіл көбейткіш.
 * Тәжуид тегтері есепке алынбайды — ұзындық үшін `text` (қарапайым Uthmani) қолданылады.
 */
export function mushafArabicLineHeightForAyah(baseLineHeight: number, arabicPlain: string): number {
  if (!Number.isFinite(baseLineHeight) || baseLineHeight <= 0) return baseLineHeight;
  const len = (arabicPlain ?? "").replace(/\s/g, "").length;
  let mult = 1;
  if (len > 48) mult = 1.06;
  if (len > 90) mult = 1.1;
  if (len > 150) mult = 1.16;
  if (len > 220) mult = 1.22;
  if (len > 320) mult = 1.28;
  return Math.round(baseLineHeight * mult);
}
