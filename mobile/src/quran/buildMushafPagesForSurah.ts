import { surahAyahToGlobalOneBased } from "../data/quranAyahCounts";
import { mushafDisplayPageFromGlobalAyahOneBased } from "../data/quranMushafPageByGlobalAyah";
import type { CachedAyah } from "../storage/quranSurahCache";

export type MushafSurahPageSlice = {
  key: string;
  ayahs: CachedAyah[];
  /** Бірінші бетте ғана сүре тақырыбы мен бисмиллә */
  includeHeader: boolean;
  /** Хафс 604 бет нөмірі (басылым стилі) */
  mushafPageNumber: number;
};

/** Сүре аяттарын нақты мұсхаф бет шекаралары бойынша бөледі (4 аят емес). */
export function buildMushafPagesForSurah(surahNumber: number, ayahs: CachedAyah[]): MushafSurahPageSlice[] {
  if (!ayahs.length) return [];
  const out: MushafSurahPageSlice[] = [];
  let bucket: CachedAyah[] = [];
  let currentPrintPage: number | null = null;
  let sliceIdx = 0;

  const flush = () => {
    if (!bucket.length || currentPrintPage == null) return;
    out.push({
      key: `mp-${currentPrintPage}-${sliceIdx}`,
      ayahs: bucket,
      includeHeader: sliceIdx === 0,
      mushafPageNumber: currentPrintPage,
    });
    bucket = [];
    sliceIdx += 1;
  };

  for (const a of ayahs) {
    const g = surahAyahToGlobalOneBased(surahNumber, a.numberInSurah);
    const printPage = mushafDisplayPageFromGlobalAyahOneBased(g);
    if (currentPrintPage !== null && printPage !== currentPrintPage) {
      flush();
    }
    currentPrintPage = printPage;
    bucket.push(a);
  }
  flush();
  return out;
}

export function findMushafPageIndexForAyah(pages: MushafSurahPageSlice[], ayahInSurah: number): number {
  const ix = pages.findIndex((p) => p.ayahs.some((a) => a.numberInSurah === ayahInSurah));
  return ix >= 0 ? ix : 0;
}
