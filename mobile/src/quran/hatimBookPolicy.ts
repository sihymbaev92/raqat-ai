import type { MushafDensityId } from "../config/mushafConfig";
import { DEFAULT_MUSHAF_DENSITY } from "../config/mushafConfig";
import type { QuranArabicFontPresetId } from "../config/quranArabicFontPresets";
import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";
import type { QuranReadingThemeId } from "../theme/quranComReadingTheme";
import { ensureBundledQuranReaderLoaded } from "../services/bundledQuranReader";
import { ensureBundledQuranTajweedLoaded } from "../services/bundledQuranTajweed";
import { loadQuranBookFonts } from "../fonts/quranBookFonts";
import { loadQcf4FontMap, loadQcf4Page } from "./loadQcf4Page";
import {
  setQuranArabicFontPreset,
  setQuranArabicScriptEdition,
  setQuranMushafTextScale,
  setQuranReadingTheme,
  setMushafDensity,
} from "../storage/quranReaderPrefs";
import { HATIM_LOCKED_MUSHAF_TEXT_SCALE } from "./mushafTextScale";

/** Бекітілген хатым баптауы (git HEAD / «кешегі күн» — өзгертпеу). */
export const HATIM_BOOK_READING_THEME: QuranReadingThemeId = "original";
export const HATIM_BOOK_ARABIC_FONT: QuranArabicFontPresetId = "quran_com";
export const HATIM_BOOK_SCRIPT: QuranArabicScriptEditionId = "madinah";
export const HATIM_BOOK_DENSITY: MushafDensityId = "tight";

export function resolveHatimBookReadingTheme(
  stored?: QuranReadingThemeId | string | null
): QuranReadingThemeId {
  void stored;
  return HATIM_BOOK_READING_THEME;
}

export function resolveHatimBookArabicFont(
  stored?: QuranArabicFontPresetId | string | null
): QuranArabicFontPresetId {
  void stored;
  return HATIM_BOOK_ARABIC_FONT;
}

export function resolveHatimBookScript(
  stored?: QuranArabicScriptEditionId | string | null
): QuranArabicScriptEditionId {
  void stored;
  return HATIM_BOOK_SCRIPT;
}

export function resolveHatimBookDensity(stored?: MushafDensityId | string | null): MushafDensityId {
  void stored;
  return HATIM_BOOK_DENSITY;
}

/**
 * Text-hafs fallback — тек EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS=1.
 * Әдепкі: native/web бірдей QCF4 Madinah (Ayah/Quran.com сияқты 15 жол).
 */
export function hatimBookUsesBundledTextHafsOffline(): boolean {
  return (
    typeof process !== "undefined" &&
    process.env?.EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS === "1"
  );
}

let preloadPromise: Promise<void> | null = null;

/** Хатым: қаріп + KK/uthmani карта + QCF4 бірінші беттер (CDN/FileSystem).
 * 604 бетті толық enrich мұнда жасамаймыз — экран ашылғанда lazy/жеңілден кейін. */
export async function preloadHatimOfflineAssets(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    await Promise.all([
      loadQuranBookFonts().catch(() => {}),
      ensureBundledQuranReaderLoaded().catch(() => {}),
      ensureBundledQuranTajweedLoaded().catch(() => {}),
    ]);
    if (!hatimBookUsesBundledTextHafsOffline()) {
      // Await so callers/tests don't tear down while CDN fetches still run.
      await Promise.all([
        loadQcf4FontMap().catch(() => null),
        loadQcf4Page(1).catch(() => null),
        loadQcf4Page(2).catch(() => null),
      ]);
    }
  })().finally(() => {
    preloadPromise = null;
  });
  return preloadPromise;
}

export function resetHatimOfflinePreloadCache(): void {
  preloadPromise = null;
}

/** Бекітілген prefs — сүре оқу баптаулары хатымды ауыстырmasın. */
export async function persistHatimBookLockedPrefs(): Promise<void> {
  await Promise.all([
    setQuranReadingTheme(HATIM_BOOK_READING_THEME),
    setQuranArabicFontPreset(HATIM_BOOK_ARABIC_FONT),
    setQuranArabicScriptEdition(HATIM_BOOK_SCRIPT),
    setMushafDensity(HATIM_BOOK_DENSITY),
    setQuranMushafTextScale(HATIM_LOCKED_MUSHAF_TEXT_SCALE),
  ]);
}
