/**
 * Тәжуид әріптері — 28 араб әрпі (ا … ي), оқулық инфографикасына сәйкес.
 * UI: жол `flexDirection: 'row-reverse'` — жол ішінде оқу оңнан солға (ا оң жақта бірінші).
 * Қызыл: 7 жуан (тәхфим) — خ ص ض ط ظ غ ق. Қара: 21 жіңішке (тарқиқ).
 * Һамза (ء) мен лам-әлиф (لا) кестеге кірмейді — жеке сабақта.
 */
export type TajweedGridCell = {
  ar: string;
  /** Қазақша атау (инфографикадағы транскрипцияға жақын) */
  nameKk: string;
  /** true = жуан (тәхфим) — қызыл; false = жіңішке (тарқиқ) — қара */
  heavy: boolean;
  /** Араб тыңдау үшін қысқа мысал */
  example: string;
};

/** Әр жол — 7 ұя, 4 жол = 28 әріп; экранда row-reverse — ا оң жақта. */
export const TAJWEED_ALPHABET_ROWS: TajweedGridCell[][] = [
  [
    { ar: "ا", nameKk: "алиф", heavy: false, example: "أَب" },
    { ar: "ب", nameKk: "бә", heavy: false, example: "بَب" },
    { ar: "ت", nameKk: "тә", heavy: false, example: "تَب" },
    { ar: "ث", nameKk: "сә", heavy: false, example: "ثَلَاث" },
    { ar: "ج", nameKk: "жим", heavy: false, example: "جَمَل" },
    { ar: "ح", nameKk: "хә", heavy: false, example: "حَجّ" },
    { ar: "خ", nameKk: "хо", heavy: true, example: "خَبَر" },
  ],
  [
    { ar: "د", nameKk: "дәл", heavy: false, example: "دِين" },
    { ar: "ذ", nameKk: "зәл", heavy: false, example: "ذَكَر" },
    { ar: "ر", nameKk: "ро", heavy: false, example: "رَبّ" },
    { ar: "ز", nameKk: "зә", heavy: false, example: "زَكَاة" },
    { ar: "س", nameKk: "син", heavy: false, example: "سَلَام" },
    { ar: "ش", nameKk: "шин", heavy: false, example: "شَيْء" },
    { ar: "ص", nameKk: "сод", heavy: true, example: "صَلَاة" },
  ],
  [
    { ar: "ض", nameKk: "дод", heavy: true, example: "ضَرَب" },
    { ar: "ط", nameKk: "то", heavy: true, example: "طَيِّب" },
    { ar: "ظ", nameKk: "зо", heavy: true, example: "ظُلْم" },
    { ar: "ع", nameKk: "'айн", heavy: false, example: "عَلِمَ" },
    { ar: "غ", nameKk: "ғойн", heavy: true, example: "غَفَار" },
    { ar: "ف", nameKk: "фә", heavy: false, example: "فَضْل" },
    { ar: "ق", nameKk: "қоф", heavy: true, example: "قُرْآن" },
  ],
  [
    { ar: "ك", nameKk: "кәф", heavy: false, example: "كَرِيم" },
    { ar: "ل", nameKk: "ләм", heavy: false, example: "لَا" },
    { ar: "م", nameKk: "мим", heavy: false, example: "مُحَمَّد" },
    { ar: "ن", nameKk: "нун", heavy: false, example: "نُور" },
    { ar: "و", nameKk: "уау", heavy: false, example: "وَقْت" },
    { ar: "ه", nameKk: "һә", heavy: false, example: "هُدًى" },
    { ar: "ي", nameKk: "йә", heavy: false, example: "يَوْم" },
  ],
];
