import { surahAyahToGlobalOneBased } from "../data/quranAyahCounts";
import { mushafDisplayPageFromGlobalAyahOneBased } from "../data/quranMushafPageByGlobalAyah";

/** Hafs 604: сүре+аят → баспа бет нөмірі. */
export function mushafPageForSurahAyah(surah: number, ayah: number): number {
  return mushafDisplayPageFromGlobalAyahOneBased(surahAyahToGlobalOneBased(surah, ayah));
}
