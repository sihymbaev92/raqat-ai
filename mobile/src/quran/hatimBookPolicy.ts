import type { MushafDensityId } from "../config/mushafConfig";
import { DEFAULT_MUSHAF_DENSITY } from "../config/mushafConfig";
import type { QuranArabicFontPresetId } from "../config/quranArabicFontPresets";
import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";
import type { QuranReadingThemeId } from "../theme/quranComReadingTheme";
import { ensureBundledQuranReaderLoaded } from "../services/bundledQuranReader";
import { loadQuranBookFonts } from "../fonts/quranBookFonts";
import { ensureQcf4FontsLoaded } from "./qcf4FontLoader";
import { loadQcf4FontMap, loadQcf4Page, preloadAdjacentQcf4Pages } from "./loadQcf4Page";
import type { Qcf4PageJson } from "./qcf4Types";
import { mushafPageForSurahAyah } from "./mushafPageForSurahAyah";
import { mushafStartPageForSurah } from "../data/surahListMeta";

/** Бекітілген хатым баптауы (git HEAD / «кешегі күн» — өзгертпеу). */
export const HATIM_BOOK_READING_THEME: QuranReadingThemeId = "original";
export const HATIM_BOOK_ARABIC_FONT: QuranArabicFontPresetId = "quran_com";
export const HATIM_BOOK_SCRIPT: QuranArabicScriptEditionId = "madinah";
export const HATIM_BOOK_DENSITY: MushafDensityId = "tight";

/** Хатым mushaf: тәжуид түстері көрінбейді (QuranSurah prefs-тен тәуелсіз). */
export const HATIM_BOOK_TAJWEED_COLORS_ENABLED = false as const;

export function resolveHatimBookTajweedColors(
  _stored?: boolean | null
): typeof HATIM_BOOK_TAJWEED_COLORS_ENABLED {
  void _stored;
  return HATIM_BOOK_TAJWEED_COLORS_ENABLED;
}

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
let preloadDone = false;

async function preloadQcf4FontsFromPageJson(json: Qcf4PageJson): Promise<void> {
  const fontIds = new Set<string>();
  for (const line of json.lines) {
    for (const w of line.words) fontIds.add(w.font);
  }
  fontIds.add(json.font);
  await ensureQcf4FontsLoaded([...fontIds]).catch(() => {});
}

/** Хатым: қаріп + KK/uthmani карта + QCF4 бірінші беттер (CDN/FileSystem).
 * 604 бетті толық enrich мұнда жасамаймыз — экран ашылғанда lazy/жеңілден кейін. */
export async function preloadHatimOfflineAssets(): Promise<void> {
  if (preloadDone) return;
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    await Promise.all([
      loadQuranBookFonts().catch(() => {}),
      ensureBundledQuranReaderLoaded().catch(() => {}),
    ]);
    if (!hatimBookUsesBundledTextHafsOffline()) {
      await loadQcf4FontMap().catch(() => null);
      const pages = await Promise.all([
        loadQcf4Page(1).catch(() => null),
        loadQcf4Page(2).catch(() => null),
        loadQcf4Page(3).catch(() => null),
      ]);
      for (const json of pages) {
        if (json) await preloadQcf4FontsFromPageJson(json);
      }
    }
    preloadDone = true;
  })().catch(() => {
    preloadPromise = null;
  });
  return preloadPromise;
}

/** Хатым экраны: mushaf модулін bundle-дан алдын ала жүктеу (навигация лезде). */
export function prefetchQuranMushafBookScreen(): void {
  void import("../screens/QuranMushafBookScreen").catch(() => undefined);
}

/** Таңдалған сүре/аят mushaf бетін ±2 QCF4 JSON алдын ала жүктеу. */
export function prewarmHatimSurahOpen(surahNumber: number, ayah = 1): void {
  void preloadHatimOfflineAssets();
  if (hatimBookUsesBundledTextHafsOffline()) return;
  const sn = Math.max(1, Math.min(114, Math.floor(surahNumber)));
  const ay = Math.max(1, Math.floor(ayah));
  const page = ay > 1 ? mushafPageForSurahAyah(sn, ay) : mushafStartPageForSurah(sn);
  preloadAdjacentQcf4Pages(page, 2);
}

export function resetHatimOfflinePreloadCache(): void {
  preloadPromise = null;
  preloadDone = false;
}

/**
 * Хатым бекітілген тема/қаріп — ортақ сүре prefs-ке жазбаймыз.
 * resolveHatimBook* экран ішінде ғана қолданылады.
 */
export async function persistHatimBookLockedPrefs(): Promise<void> {
  /* no-op: shared AsyncStorage keys must stay for Surah/Settings */
}
