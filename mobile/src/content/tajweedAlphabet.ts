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
   * TTS үшін фатхалы қысқа дыбыс (жүйелік араб дауысы бір әріпті жиі дұрыс оқымайды).
   * Әдетте: әріп+фатха + сол әріп+сукун (بَبْ).
   */
  speechAr: string;
};

/** Әр жол — 7 ұя, 4 жол = 28 әріп; экранда row-reverse — ا оң жақта. */
export const TAJWEED_ALPHABET_ROWS: TajweedGridCell[][] = [
  [
    { ar: "ا", nameKk: "алиф", heavy: false, example: "أَب", speechAr: "أَ" },
    { ar: "ب", nameKk: "бә", heavy: false, example: "بَب", speechAr: "بَبْ" },
    { ar: "ت", nameKk: "тә", heavy: false, example: "تَب", speechAr: "تَتْ" },
    { ar: "ث", nameKk: "сә", heavy: false, example: "ثَلَاث", speechAr: "ثَثْ" },
    { ar: "ج", nameKk: "жим", heavy: false, example: "جَمَل", speechAr: "جَجْ" },
    { ar: "ح", nameKk: "хә", heavy: false, example: "حَجّ", speechAr: "حَحْ" },
    { ar: "خ", nameKk: "хо", heavy: true, example: "خَبَر", speechAr: "خَخْ" },
  ],
  [
    { ar: "د", nameKk: "дәл", heavy: false, example: "دِين", speechAr: "دَدْ" },
    { ar: "ذ", nameKk: "зәл", heavy: false, example: "ذَكَر", speechAr: "ذَذْ" },
    { ar: "ر", nameKk: "ро", heavy: false, example: "رَبّ", speechAr: "رَرْ" },
    { ar: "ز", nameKk: "зә", heavy: false, example: "زَكَاة", speechAr: "زَزْ" },
    { ar: "س", nameKk: "син", heavy: false, example: "سَلَام", speechAr: "سَسْ" },
    { ar: "ش", nameKk: "шин", heavy: false, example: "شَيْء", speechAr: "شَشْ" },
    { ar: "ص", nameKk: "сод", heavy: true, example: "صَلَاة", speechAr: "صَصْ" },
  ],
  [
    { ar: "ض", nameKk: "дод", heavy: true, example: "ضَرَب", speechAr: "ضَضْ" },
    { ar: "ط", nameKk: "то", heavy: true, example: "طَيِّب", speechAr: "طَطْ" },
    { ar: "ظ", nameKk: "зо", heavy: true, example: "ظُلْم", speechAr: "ظَظْ" },
    { ar: "ع", nameKk: "'айн", heavy: false, example: "عَلِمَ", speechAr: "عَعْ" },
    { ar: "غ", nameKk: "ғойн", heavy: true, example: "غَفَار", speechAr: "غَغْ" },
    { ar: "ف", nameKk: "фә", heavy: false, example: "فَضْل", speechAr: "فَفْ" },
    { ar: "ق", nameKk: "қоф", heavy: true, example: "قُرْآن", speechAr: "قَقْ" },
  ],
  [
    { ar: "ك", nameKk: "кәф", heavy: false, example: "كَرِيم", speechAr: "كَكْ" },
    { ar: "ل", nameKk: "ләм", heavy: false, example: "لَا", speechAr: "لَلْ" },
    { ar: "م", nameKk: "мим", heavy: false, example: "مُحَمَّد", speechAr: "مَمْ" },
    { ar: "ن", nameKk: "нун", heavy: false, example: "نُور", speechAr: "نَنْ" },
    { ar: "و", nameKk: "уау", heavy: false, example: "وَقْت", speechAr: "وَوْ" },
    { ar: "ه", nameKk: "һә", heavy: false, example: "هُدًى", speechAr: "هَهْ" },
    { ar: "ي", nameKk: "йә", heavy: false, example: "يَوْم", speechAr: "يَيْ" },
  ],
];

const SPEECH_BY_LETTER = new Map(
  TAJWEED_ALPHABET_ROWS.flat().map((cell) => [cell.ar, cell.speechAr] as const)
);

/** Әріп карточкасы үшін TTS мәтіні (кестеден). */
export function tajweedLetterSpeechAr(ar: string): string | undefined {
  return SPEECH_BY_LETTER.get((ar ?? "").trim());
}
