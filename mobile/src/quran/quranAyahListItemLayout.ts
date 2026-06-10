/** FlashList estimatedItemSize / getItemType — классикалық QuranSurahScreen тізімі. */

export type QuranAyahListRowLayoutKind =
  | "arabic-only"
  | "translit"
  | "meaning"
  | "translit-meaning";

export type QuranAyahListLayoutOpts = {
  showReaderArabic: boolean;
  showReaderTranslit: boolean;
  showReaderMeaning: boolean;
};

const BASE_ROW = 52;
const ARABIC_BLOCK = 88;
const TRANSLIT_BLOCK = 56;
const MEANING_BLOCK = 72;
const HINT_BLOCK = 40;

/** Reader prefs бойынша row түрі (FlashList getItemType). */
export function quranAyahListRowLayoutKind(opts: QuranAyahListLayoutOpts): QuranAyahListRowLayoutKind {
  const { showReaderTranslit, showReaderMeaning } = opts;
  if (showReaderTranslit && showReaderMeaning) return "translit-meaning";
  if (showReaderTranslit) return "translit";
  if (showReaderMeaning) return "meaning";
  return "arabic-only";
}

/** FlashList estimatedItemSize (px, conservative). */
export function estimateQuranAyahRowHeight(opts: QuranAyahListLayoutOpts): number {
  const kind = quranAyahListRowLayoutKind(opts);
  switch (kind) {
    case "translit-meaning":
      return BASE_ROW + ARABIC_BLOCK + TRANSLIT_BLOCK + MEANING_BLOCK;
    case "translit":
      return BASE_ROW + ARABIC_BLOCK + TRANSLIT_BLOCK;
    case "meaning":
      return BASE_ROW + ARABIC_BLOCK + MEANING_BLOCK + HINT_BLOCK;
    default:
      return BASE_ROW + ARABIC_BLOCK;
  }
}
