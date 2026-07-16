import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";
import { displayCachedAyahArabic } from "../storage/quranSurahCache";
import { resolveMushafBookAyah } from "./buildMushafPagesGlobal";
import type { MushafBookAyah, MushafBookPageSlice } from "./mushafBookTypes";

export function shouldShowBismillah(surah: number, firstAyah: number): boolean {
  if (firstAyah !== 1) return false;
  if (surah === 9 || surah === 1) return false;
  return true;
}

export function groupAyahsBySurah(ayahs: MushafBookAyah[]): { surah: number; ayahs: MushafBookAyah[] }[] {
  const out: { surah: number; ayahs: MushafBookAyah[] }[] = [];
  for (const a of ayahs) {
    const last = out[out.length - 1];
    if (!last || last.surah !== a.surahNumber) {
      out.push({ surah: a.surahNumber, ayahs: [a] });
    } else {
      last.ayahs.push(a);
    }
  }
  return out;
}

export function pageArabicGlyphCount(
  page: MushafBookPageSlice,
  edition: QuranArabicScriptEditionId
): number {
  return page.ayahs.reduce((sum, ayah) => {
    const resolved = resolveMushafBookAyah(ayah);
    return sum + displayCachedAyahArabic(resolved, edition).replace(/\s+/g, "").length;
  }, 0);
}
