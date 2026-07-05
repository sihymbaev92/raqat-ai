import type { QuranReaderNavMode } from "../storage/quranReaderPrefs";

/**
 * Хатым mushaf: бір бетке толық сию — тек араб (June 29 референс).
 * Транскрипция/аударма — сүре оқу экранында; хатымда аят мәзірі арқылы.
 */
export const HATIM_MUSHAF_ARABIC_ONLY = true as const;
export const QURAN_READER_ARABIC_ONLY = HATIM_MUSHAF_ARABIC_ONLY;

export function hatimMushafReaderLayers(): {
  showReaderArabic: true;
  showReaderTranslit: false;
  showReaderMeaning: false;
} {
  return {
    showReaderArabic: true,
    showReaderTranslit: false,
    showReaderMeaning: false,
  };
}

/** @deprecated hatimMushafReaderLayers алиасы */
export const quranReaderArabicOnlyLayers = hatimMushafReaderLayers;

export function resolveEffectiveQuranReaderNavMode(opts: {
  platformOS: string;
  mushafLayout: boolean;
  windowWidth: number;
  preferredMode: QuranReaderNavMode;
}): QuranReaderNavMode {
  if (opts.platformOS === "web" && opts.mushafLayout && opts.windowWidth < 720) {
    return "scroll";
  }
  return opts.preferredMode;
}

export function shouldRenderSingleMushafBookPageOnWeb(platformOS: string): boolean {
  return platformOS === "web";
}
