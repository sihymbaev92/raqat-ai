import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_MUSHAF_DENSITY,
  normalizeMushafDensity,
  type MushafDensityId,
} from "../config/mushafConfig";
import {
  DEFAULT_QURAN_ARABIC_SCRIPT_EDITION,
  normalizeQuranArabicScriptEdition,
  type QuranArabicScriptEditionId,
} from "../config/quranArabicScriptEdition";
import {
  DEFAULT_QURAN_ARABIC_FONT_PRESET,
  normalizeArabicFontPreset,
  type QuranArabicFontPresetId,
} from "../config/quranArabicFontPresets";
import {
  DEFAULT_QURAN_RECITER_EDITION,
  normalizeReciterEdition,
} from "../config/quranReciters";
import { clampMushafTextScale } from "../quran/mushafTextScale";
import { QURAN_READER_ARABIC_ONLY } from "../quran/quranReaderModePolicy";
import {
  DEFAULT_QURAN_READING_THEME,
  normalizeQuranReadingTheme,
  type QuranReadingThemeId,
} from "../theme/quranComReadingTheme";
import { getQuranLastReadEnabled } from "./quranLastRead";

const NAV_MODE_KEY = "quran_reader_nav_mode_v1";
const ARABIC_SCRIPT_EDITION_KEY = "quran_reader_arabic_script_edition_v1";
const MUSHAF_DENSITY_KEY = "quran_reader_mushaf_density_v1";
const AYAH_MARKER_STYLE_KEY = "quran_reader_ayah_marker_style_v1";
export const QURAN_TAJWEED_COLORS_KEY = "quran_tajweed_colors_enabled_v1";
export const QURAN_READER_RECITER_KEY = "quran_reader_reciter_edition_v1";
export const QURAN_READER_ARABIC_FONT_KEY = "quran_reader_arabic_font_preset_v1";
export const QURAN_READER_ALLOW_ROTATION_KEY = "quran_reader_allow_rotation_v1";
export const QURAN_READER_MUSHAF_TEXT_SCALE_KEY = "quran_reader_mushaf_text_scale_v1";
export const QURAN_READING_THEME_KEY = "quran_reading_theme_v1";

/** Құран оқу экраны мен Баптаулар бөлімінің ортак кілттері. */
export const QURAN_READER_SHOW_ARABIC_KEY = "quran_reader_show_arabic_v1";
export const QURAN_READER_SHOW_TRANSLIT_KEY = "quran_reader_show_translit_v1";
export const QURAN_READER_SHOW_MEANING_KEY = "quran_reader_show_meaning_v1";

export type QuranReaderNavMode = "scroll" | "page";

/** Аят маркері: SVG сақина немесе классикалық View. */
export type AyahMarkerStyleId = "ring_svg" | "classic";

export const DEFAULT_AYAH_MARKER_STYLE: AyahMarkerStyleId = "ring_svg";

export type { MushafDensityId };

export function normalizeAyahMarkerStyle(raw: string | null | undefined): AyahMarkerStyleId {
  const s = (raw ?? "").trim();
  if (s === "classic") return "classic";
  return "ring_svg";
}

export async function getAyahMarkerStyle(): Promise<AyahMarkerStyleId> {
  try {
    const v = (await AsyncStorage.getItem(AYAH_MARKER_STYLE_KEY))?.trim();
    return normalizeAyahMarkerStyle(v);
  } catch {
    return DEFAULT_AYAH_MARKER_STYLE;
  }
}

export async function setAyahMarkerStyle(id: AyahMarkerStyleId): Promise<void> {
  await AsyncStorage.setItem(AYAH_MARKER_STYLE_KEY, id);
}

export async function getQuranReaderNavMode(): Promise<QuranReaderNavMode> {
  try {
    const v = (await AsyncStorage.getItem(NAV_MODE_KEY))?.trim();
    if (v === "scroll") return "scroll";
    return "page";
  } catch {
    return "page";
  }
}

export async function setQuranReaderNavMode(mode: QuranReaderNavMode): Promise<void> {
  await AsyncStorage.setItem(NAV_MODE_KEY, mode);
}

export async function getMushafDensity(): Promise<MushafDensityId> {
  try {
    const v = (await AsyncStorage.getItem(MUSHAF_DENSITY_KEY))?.trim();
    return normalizeMushafDensity(v);
  } catch {
    return DEFAULT_MUSHAF_DENSITY;
  }
}

export async function setMushafDensity(density: MushafDensityId): Promise<void> {
  await AsyncStorage.setItem(MUSHAF_DENSITY_KEY, density);
}

export async function getQuranArabicScriptEdition(): Promise<QuranArabicScriptEditionId> {
  try {
    const v = (await AsyncStorage.getItem(ARABIC_SCRIPT_EDITION_KEY))?.trim();
    return normalizeQuranArabicScriptEdition(v);
  } catch {
    return DEFAULT_QURAN_ARABIC_SCRIPT_EDITION;
  }
}

export async function setQuranArabicScriptEdition(edition: QuranArabicScriptEditionId): Promise<void> {
  await AsyncStorage.setItem(ARABIC_SCRIPT_EDITION_KEY, edition);
}

async function readBoolKey(key: string, defaultOn = true): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(key);
    if (v == null) return defaultOn;
    return v === "1";
  } catch {
    return defaultOn;
  }
}

async function writeBoolKey(key: string, on: boolean): Promise<void> {
  await AsyncStorage.setItem(key, on ? "1" : "0");
}

export async function getQuranReaderShowArabic(): Promise<boolean> {
  return readBoolKey(QURAN_READER_SHOW_ARABIC_KEY);
}

export async function setQuranReaderShowArabic(on: boolean): Promise<void> {
  await writeBoolKey(QURAN_READER_SHOW_ARABIC_KEY, on);
}

export async function getQuranReaderShowTranslit(): Promise<boolean> {
  if (QURAN_READER_ARABIC_ONLY) return false;
  return readBoolKey(QURAN_READER_SHOW_TRANSLIT_KEY);
}

export async function setQuranReaderShowTranslit(on: boolean): Promise<void> {
  await writeBoolKey(QURAN_READER_SHOW_TRANSLIT_KEY, QURAN_READER_ARABIC_ONLY ? false : on);
}

export async function getQuranReaderShowMeaning(): Promise<boolean> {
  if (QURAN_READER_ARABIC_ONLY) return false;
  return readBoolKey(QURAN_READER_SHOW_MEANING_KEY);
}

export async function setQuranReaderShowMeaning(on: boolean): Promise<void> {
  await writeBoolKey(QURAN_READER_SHOW_MEANING_KEY, QURAN_READER_ARABIC_ONLY ? false : on);
}

export async function getQuranTajweedColorsEnabled(): Promise<boolean> {
  return readBoolKey(QURAN_TAJWEED_COLORS_KEY, false);
}

export async function setQuranTajweedColorsEnabled(on: boolean): Promise<void> {
  await writeBoolKey(QURAN_TAJWEED_COLORS_KEY, on);
}

export async function getQuranReciterEdition(): Promise<string> {
  try {
    const v = (await AsyncStorage.getItem(QURAN_READER_RECITER_KEY))?.trim();
    return normalizeReciterEdition(v);
  } catch {
    return DEFAULT_QURAN_RECITER_EDITION;
  }
}

export async function setQuranReciterEdition(edition: string): Promise<void> {
  await AsyncStorage.setItem(QURAN_READER_RECITER_KEY, normalizeReciterEdition(edition));
}

export async function getQuranArabicFontPreset(): Promise<QuranArabicFontPresetId> {
  try {
    const v = (await AsyncStorage.getItem(QURAN_READER_ARABIC_FONT_KEY))?.trim();
    return normalizeArabicFontPreset(v);
  } catch {
    return DEFAULT_QURAN_ARABIC_FONT_PRESET;
  }
}

export async function setQuranArabicFontPreset(preset: QuranArabicFontPresetId): Promise<void> {
  await AsyncStorage.setItem(QURAN_READER_ARABIC_FONT_KEY, preset);
}

export async function getQuranReaderAllowRotation(): Promise<boolean> {
  /** Әдепкі: қосулы — хатым/құран оқығанда телефон бұрылса экран да бұрылады. */
  return readBoolKey(QURAN_READER_ALLOW_ROTATION_KEY, true);
}

export async function setQuranReaderAllowRotation(on: boolean): Promise<void> {
  await writeBoolKey(QURAN_READER_ALLOW_ROTATION_KEY, on);
}

export async function getQuranMushafTextScale(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(QURAN_READER_MUSHAF_TEXT_SCALE_KEY);
    if (raw == null || raw === "") return 1;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? clampMushafTextScale(n) : 1;
  } catch {
    return 1;
  }
}

export async function setQuranMushafTextScale(scale: number): Promise<void> {
  await AsyncStorage.setItem(QURAN_READER_MUSHAF_TEXT_SCALE_KEY, String(clampMushafTextScale(scale)));
}

export async function getQuranReadingTheme(): Promise<QuranReadingThemeId> {
  try {
    const v = (await AsyncStorage.getItem(QURAN_READING_THEME_KEY))?.trim();
    return normalizeQuranReadingTheme(v);
  } catch {
    return DEFAULT_QURAN_READING_THEME;
  }
}

export async function setQuranReadingTheme(theme: QuranReadingThemeId): Promise<void> {
  await AsyncStorage.setItem(QURAN_READING_THEME_KEY, theme);
}

/** Баптаулар экраны: барлық оқу prefs бір рет жүктеледі. */
export type QuranReaderPrefsSnapshot = {
  lastRead: boolean;
  showArabic: boolean;
  showTranslit: boolean;
  showMeaning: boolean;
  density: MushafDensityId;
  navMode: QuranReaderNavMode;
  marker: AyahMarkerStyleId;
  arabicScript: QuranArabicScriptEditionId;
  arabicFont: QuranArabicFontPresetId;
  reciterEdition: string;
  tajweedColors: boolean;
  allowRotation: boolean;
  mushafTextScale: number;
  readingTheme: QuranReadingThemeId;
};

export async function loadQuranReaderPrefs(): Promise<QuranReaderPrefsSnapshot> {
  const [
    lastRead,
    showArabic,
    showTranslit,
    showMeaning,
    density,
    navMode,
    marker,
    arabicScript,
    arabicFont,
    reciterEdition,
    tajweedColors,
    allowRotation,
    mushafTextScale,
    readingTheme,
  ] = await Promise.all([
    getQuranLastReadEnabled(),
    getQuranReaderShowArabic(),
    getQuranReaderShowTranslit(),
    getQuranReaderShowMeaning(),
    getMushafDensity(),
    getQuranReaderNavMode(),
    getAyahMarkerStyle(),
    getQuranArabicScriptEdition(),
    getQuranArabicFontPreset(),
    getQuranReciterEdition(),
    getQuranTajweedColorsEnabled(),
    getQuranReaderAllowRotation(),
    getQuranMushafTextScale(),
    getQuranReadingTheme(),
  ]);
  return {
    lastRead,
    showArabic,
    showTranslit,
    showMeaning,
    density,
    navMode,
    marker,
    arabicScript,
    arabicFont,
    reciterEdition,
    tajweedColors,
    allowRotation,
    mushafTextScale,
    readingTheme,
  };
}
