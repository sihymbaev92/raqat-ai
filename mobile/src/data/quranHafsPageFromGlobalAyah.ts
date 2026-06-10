/**
 * Хафс 604 бет: глобалды аят (1..6236) → бет (1..604).
 * Көз: `quranHafsPageStarts.generated.json` — quran-center/quran-meta `PageList`
 * (қолданбадағы `quran-uthmani-full.json` `page` өрісімен сәйкес).
 */
import Hafs_PAGE_STARTS from "./quranHafsPageStarts.generated.json";

const S = Hafs_PAGE_STARTS as readonly number[];

/** Соңғы нақты бет (604); `S.length - 1` — 6237 сентинелі. */
export const HAFS_MUSHAF_PAGE_COUNT = S.length - 2;
const LAST_PAGE = HAFS_MUSHAF_PAGE_COUNT;

/** Бет басталғандағы глобалды аят (1..6236). */
export function globalAyahAtMushafPageStart(page: number): number {
  const p = Math.max(1, Math.min(LAST_PAGE, Math.floor(page)));
  return S[p] ?? 1;
}

export function hafsPageFromGlobalAyahOneBased(globalOneBased: number): number {
  const g = Math.max(1, Math.min(6236, Math.floor(globalOneBased)));
  let lo = 1;
  let hi = LAST_PAGE;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (S[mid]! <= g) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
