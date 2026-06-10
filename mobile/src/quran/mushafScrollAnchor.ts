/**
 * Мұсаф скролл: көрінетін аймақтың «үстінен» қай аят доминанты екенін таңдау
 * (measureLayout арқылы жиналған tops картасы бойынша).
 */
export function pickDominantAyahAboveScrollOffset(
  orderedAyahs: readonly { numberInSurah: number }[],
  tops: Readonly<Record<number, number>>,
  scrollOffsetY: number,
  leadPx: number
): number {
  if (!orderedAyahs.length) return 1;
  const y = scrollOffsetY + leadPx;
  let best = orderedAyahs[0]!.numberInSurah;
  for (const a of orderedAyahs) {
    const t = tops[a.numberInSurah];
    if (t != null && t <= y) best = a.numberInSurah;
  }
  return best;
}
