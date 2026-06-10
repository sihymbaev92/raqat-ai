/**
 * Quran.com iOS (quran/quran-ios) оқу темалары.
 * @see https://apps.apple.com/us/app/quran-by-quran-com-%D9%82%D8%B1%D8%A2%D9%86/id1118663303
 */

export type QuranReadingThemeId = "original" | "paper" | "sepia" | "dark" | "muftyat";

export const DEFAULT_QURAN_READING_THEME: QuranReadingThemeId = "original";

export type QuranReadingThemeSpec = {
  id: QuranReadingThemeId;
  labelKk: string;
  /** Quran.com: бет іші — латын сүре атауы + Part (жұптық). */
  minimalPageChrome: boolean;
  /** Мұсаф беті */
  pageFace: string;
  /** Экран фоны (desk) */
  desk: string;
  arabicInk: string;
  /** Жоғарғы/төменгі латын хром (Al-Baqarah, Part 1, Hizb). */
  chromeInk: string;
  titleInk: string;
  pageBorderVertical: boolean;
  pageBorderColor: string;
  markerRingOuter: string;
  /** Аят белгісі ішкі бет (алтын-қоңыр). */
  markerAccentFill: string;
  markerFace: string;
  markerInk: string;
  bismBorder: string;
  bismSurface: string;
  titlePaperBg: string;
  titlePaperBorder: string;
};

const ORIGINAL: QuranReadingThemeSpec = {
  id: "original",
  labelKk: "Ақ",
  minimalPageChrome: true,
  pageFace: "#FEF9F3",
  desk: "#FEF9F3",
  arabicInk: "#000000",
  chromeInk: "#B08D57",
  titleInk: "#B08D57",
  pageBorderVertical: false,
  pageBorderColor: "rgba(176,141,87,0.38)",
  markerRingOuter: "#B59A7A",
  markerAccentFill: "#FEF9F3",
  markerFace: "#FEF9F3",
  markerInk: "#000000",
  bismBorder: "transparent",
  bismSurface: "transparent",
  titlePaperBg: "#FEF9F3",
  titlePaperBorder: "rgba(176,141,87,0.32)",
};

const PAPER: QuranReadingThemeSpec = {
  id: "paper",
  labelKk: "Қағаз",
  minimalPageChrome: false,
  pageFace: "#FFFBF2",
  desk: "#F2F2F7",
  arabicInk: "#1a1a1a",
  chromeInk: "#6B5B45",
  titleInk: "#1a1a1a",
  pageBorderVertical: true,
  pageBorderColor: "rgba(0,0,0,0.08)",
  markerRingOuter: "#3a3a3a",
  markerAccentFill: "#F0E8D8",
  markerFace: "#FFFBF2",
  markerInk: "#1a1a1a",
  bismBorder: "transparent",
  bismSurface: "transparent",
  titlePaperBg: "#FFFBF2",
  titlePaperBorder: "rgba(0,0,0,0.06)",
};

const SEPIA: QuranReadingThemeSpec = {
  id: "sepia",
  labelKk: "Сепия",
  minimalPageChrome: false,
  pageFace: "#F4E4BC",
  desk: "#EBD9A8",
  arabicInk: "#3d2f1f",
  chromeInk: "#5c4a32",
  titleInk: "#3d2f1f",
  pageBorderVertical: true,
  pageBorderColor: "rgba(61,47,31,0.12)",
  markerRingOuter: "#5c4a32",
  markerAccentFill: "#E8D9B8",
  markerFace: "#F4E4BC",
  markerInk: "#3d2f1f",
  bismBorder: "transparent",
  bismSurface: "transparent",
  titlePaperBg: "#F4E4BC",
  titlePaperBorder: "rgba(61,47,31,0.10)",
};

const DARK: QuranReadingThemeSpec = {
  id: "dark",
  labelKk: "Қараңғы",
  minimalPageChrome: true,
  pageFace: "#121212",
  desk: "#000000",
  arabicInk: "#F5F5F5",
  chromeInk: "rgba(255,255,255,0.72)",
  titleInk: "#F5F5F5",
  pageBorderVertical: true,
  pageBorderColor: "rgba(255,255,255,0.10)",
  markerRingOuter: "rgba(255,255,255,0.35)",
  markerAccentFill: "#2a2a2a",
  markerFace: "#1e1e1e",
  markerInk: "#F5F5F5",
  bismBorder: "rgba(255,255,255,0.12)",
  bismSurface: "#121212",
  titlePaperBg: "#121212",
  titlePaperBorder: "rgba(255,255,255,0.12)",
};

const MUFTYAT: QuranReadingThemeSpec = {
  id: "muftyat",
  labelKk: "Жасыл сия",
  minimalPageChrome: false,
  pageFace: "#FAF7F0",
  desk: "#F2F2F7",
  arabicInk: "#1B7340",
  chromeInk: "#1B7340",
  titleInk: "#1B7340",
  pageBorderVertical: false,
  pageBorderColor: "rgba(0,0,0,0.08)",
  markerRingOuter: "#1B7340",
  markerAccentFill: "#FFFFFF",
  markerFace: "#FFFFFF",
  markerInk: "#1B7340",
  bismBorder: "transparent",
  bismSurface: "transparent",
  titlePaperBg: "#FAF7F0",
  titlePaperBorder: "rgba(27,115,64,0.15)",
};

/** Баптаулар/хатым мәзірінде көрсетілетін темалар. */
export const QURAN_READING_THEMES: QuranReadingThemeSpec[] = [ORIGINAL, DARK, MUFTYAT];

const BY_ID: Record<QuranReadingThemeId, QuranReadingThemeSpec> = {
  original: ORIGINAL,
  paper: PAPER,
  sepia: SEPIA,
  dark: DARK,
  muftyat: MUFTYAT,
};

export function normalizeQuranReadingTheme(raw: string | null | undefined): QuranReadingThemeId {
  const s = (raw ?? "").trim();
  if (s === "paper" || s === "sepia") return DEFAULT_QURAN_READING_THEME;
  if (s in BY_ID) return s as QuranReadingThemeId;
  return DEFAULT_QURAN_READING_THEME;
}

/** Мәзірдегі тізімде бар ма (UI chip таңдауы). */
export function isQuranReadingThemeInMenu(id: QuranReadingThemeId): boolean {
  return QURAN_READING_THEMES.some((t) => t.id === id);
}

export function resolveQuranReadingTheme(id: QuranReadingThemeId | string | null | undefined): QuranReadingThemeSpec {
  return BY_ID[normalizeQuranReadingTheme(typeof id === "string" ? id : id ?? undefined)];
}

export function quranReadingThemeLabelKk(id: QuranReadingThemeId): string {
  return BY_ID[id].labelKk;
}
