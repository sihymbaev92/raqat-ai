/**
 * Әр сүредегі аят саны (Hafs, 6236 аят). Көз: bundled surah-list-api.json
 */
export const AYAH_COUNTS_PER_SURAH: readonly number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
  78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59,
  37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52,
  52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
] as const;

export const TOTAL_AYAHS = 6236;

/** Глобалды аят нөмірі 1..6236 → сүре + аят */
export function globalAyahToRef(globalOneBased: number): { surah: number; ayah: number } {
  let n = Math.max(1, Math.min(TOTAL_AYAHS, globalOneBased)) - 1;
  for (let s = 0; s < AYAH_COUNTS_PER_SURAH.length; s++) {
    const c = AYAH_COUNTS_PER_SURAH[s];
    if (n < c) return { surah: s + 1, ayah: n + 1 };
    n -= c;
  }
  return { surah: 1, ayah: 1 };
}

/** Күнге байланысты тұрақты глобалды аят (UTC күн санағы) */
export function getDailyGlobalAyahOneBased(now = new Date()): number {
  const day = Math.floor(now.getTime() / 86400000);
  return (day % TOTAL_AYAHS) + 1;
}

export function getDailyAyahRef(now = new Date()): { surah: number; ayah: number } {
  return globalAyahToRef(getDailyGlobalAyahOneBased(now));
}
