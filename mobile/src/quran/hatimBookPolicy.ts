import { Platform } from "react-native";
import type { MushafDensityId } from "../config/mushafConfig";
import { DEFAULT_MUSHAF_DENSITY } from "../config/mushafConfig";
import type { QuranArabicFontPresetId } from "../config/quranArabicFontPresets";
import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";
import type { QuranReadingThemeId } from "../theme/quranComReadingTheme";
import { ensureBundledQuranReaderLoaded } from "../services/bundledQuranReader";
import { loadQuranBookFonts } from "../fonts/quranBookFonts";
import { buildMushafPagesGlobal } from "./buildMushafPagesGlobal";
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
export const HATIM_BOOK_DENSITY: MushafDensityId = DEFAULT_MUSHAF_DENSITY;

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

/** APK: QCF4/CDN жоқ — bundled Unicode text-hafs + expo-fonts. */
export function hatimBookUsesBundledTextHafsOffline(): boolean {
  return Platform.OS !== "web";
}

let preloadPromise: Promise<void> | null = null;
let preloadDone = false;

/** Хатым тізімі/604 — мәтін APK-дан; желі/CDN қажет емес. */
export async function preloadHatimOfflineAssets(): Promise<void> {
  if (preloadDone) return;
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    await Promise.all([loadQuranBookFonts().catch(() => {}), ensureBundledQuranReaderLoaded()]);
    buildMushafPagesGlobal();
    preloadDone = true;
  })().finally(() => {
    preloadPromise = null;
  });
  return preloadPromise;
}

/** Тесттер үшін preload кэшін тазалау. */
export function resetHatimOfflinePreloadCache(): void {
  preloadDone = false;
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
