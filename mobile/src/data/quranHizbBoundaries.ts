/**
 * 60 хизбтың басталуы — Quran.com API `first_verse_id` (1..6236, сүре ретімен аяттар).
 * @see https://api.quran.com/api/v4/hizbs
 */
const HIZB_FIRST_GLOBAL_VERSE_ID: readonly number[] = [
  1, 82, 149, 210, 260, 308, 386, 464, 517, 581, 641, 696, 751, 825, 900, 955, 1042, 1125, 1201, 1269, 1328, 1390,
  1479, 1557, 1649, 1726, 1803, 1952, 2030, 2128, 2215, 2349, 2484, 2596, 2674, 2812, 2876, 3043, 3215, 3303, 3386,
  3491, 3564, 3630, 3733, 3933, 4090, 4174, 4265, 4349, 4511, 4601, 4706, 4902, 5105, 5178, 5242, 5448, 5673, 5949,
] as const;

import { TOTAL_AYAHS } from "./quranAyahCounts";
import { hafsPageFromGlobalAyahOneBased } from "./quranHafsPageFromGlobalAyah";

/** Глобалды аят нөмірі (1..6236) қай хизбте екенін қайтарады (1..60). */
export function hizbForGlobalAyahOneBased(globalOneBased: number): number {
  const g = Math.max(1, Math.min(TOTAL_AYAHS, Math.floor(globalOneBased)));
  let h = 1;
  for (let i = 0; i < HIZB_FIRST_GLOBAL_VERSE_ID.length; i++) {
    if (HIZB_FIRST_GLOBAL_VERSE_ID[i]! <= g) h = i + 1;
  }
  return h;
}

/**
 * Мадина / Quran.com үлгісіндегі Хафс 604 бет (глобалды аят 1..6236).
 * Бұрынғы сызықтық шамалау орнына Хафс 604 PageList қолданылады.
 */
export function approxMedinaPageFromGlobalAyahOneBased(globalOneBased: number): number {
  const g = Math.max(1, Math.min(TOTAL_AYAHS, Math.floor(globalOneBased)));
  return hafsPageFromGlobalAyahOneBased(g);
}
