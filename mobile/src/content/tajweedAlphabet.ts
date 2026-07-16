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
  /**
   * TTS fallback: әріп атауы емес — фатхалы анық дыбыс (بَا).
   * Жүйелік араб TTS бір әріпті жиі бұзып оқиды; ұзын «ـَا» тұрақтырақ.
   */
  speechAr: string;
};

/** Әр жол — 7 ұя, 4 жол = 28 әріп; экранда row-reverse — ا оң жақта. */
export const TAJWEED_ALPHABET_ROWS: TajweedGridCell[][] = [
  [
    { ar: "ا", nameKk: "алиф", heavy: false, example: "أَب", speechAr: "أَا" },
    { ar: "ب", nameKk: "бә", heavy: false, example: "بَب", speechAr: "بَا" },
    { ar: "ت", nameKk: "тә", heavy: false, example: "تَب", speechAr: "تَا" },
    { ar: "ث", nameKk: "сә", heavy: false, example: "ثَلَاث", speechAr: "ثَا" },
    { ar: "ج", nameKk: "жим", heavy: false, example: "جَمَل", speechAr: "جَا" },
    { ar: "ح", nameKk: "хә", heavy: false, example: "حَجّ", speechAr: "حَا" },
    { ar: "خ", nameKk: "хо", heavy: true, example: "خَبَر", speechAr: "خَا" },
  ],
  [
    { ar: "د", nameKk: "дәл", heavy: false, example: "دِين", speechAr: "دَا" },
    { ar: "ذ", nameKk: "зәл", heavy: false, example: "ذَكَر", speechAr: "ذَا" },
    { ar: "ر", nameKk: "ро", heavy: false, example: "رَبّ", speechAr: "رَا" },
    { ar: "ز", nameKk: "зә", heavy: false, example: "زَكَاة", speechAr: "زَا" },
    { ar: "س", nameKk: "син", heavy: false, example: "سَلَام", speechAr: "سَا" },
    { ar: "ش", nameKk: "шин", heavy: false, example: "شَيْء", speechAr: "شَا" },
    { ar: "ص", nameKk: "сод", heavy: true, example: "صَلَاة", speechAr: "صَا" },
  ],
  [
    { ar: "ض", nameKk: "дод", heavy: true, example: "ضَرَب", speechAr: "ضَا" },
    { ar: "ط", nameKk: "то", heavy: true, example: "طَيِّب", speechAr: "طَا" },
    { ar: "ظ", nameKk: "зо", heavy: true, example: "ظُلْم", speechAr: "ظَا" },
    { ar: "ع", nameKk: "'айн", heavy: false, example: "عَلِمَ", speechAr: "عَا" },
    { ar: "غ", nameKk: "ғойн", heavy: true, example: "غَفَار", speechAr: "غَا" },
    { ar: "ف", nameKk: "фә", heavy: false, example: "فَضْل", speechAr: "فَا" },
    { ar: "ق", nameKk: "қоф", heavy: true, example: "قُرْآن", speechAr: "قَا" },
  ],
  [
    { ar: "ك", nameKk: "кәф", heavy: false, example: "كَرِيم", speechAr: "كَا" },
    { ar: "ل", nameKk: "ләм", heavy: false, example: "لَا", speechAr: "لَا" },
    { ar: "م", nameKk: "мим", heavy: false, example: "مُحَمَّد", speechAr: "مَا" },
    { ar: "ن", nameKk: "нун", heavy: false, example: "نُور", speechAr: "نَا" },
    { ar: "و", nameKk: "уау", heavy: false, example: "وَقْت", speechAr: "وَا" },
    { ar: "ه", nameKk: "һә", heavy: false, example: "هُدًى", speechAr: "هَا" },
    { ar: "ي", nameKk: "йә", heavy: false, example: "يَوْم", speechAr: "يَا" },
  ],
];

const SPEECH_BY_LETTER = new Map(
  TAJWEED_ALPHABET_ROWS.flat().map((cell) => [cell.ar, cell.speechAr] as const)
);

/** Әріп карточкасы үшін TTS мәтіні (кестеден). */
export function tajweedLetterSpeechAr(ar: string): string | undefined {
  return SPEECH_BY_LETTER.get((ar ?? "").trim());
}
