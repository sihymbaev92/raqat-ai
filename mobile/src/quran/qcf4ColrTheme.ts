import type { QuranReadingThemeId } from "../theme/quranComReadingTheme";
import type { Qcf4ColrPaletteTheme } from "../config/mushafPagesBase";

export type { Qcf4ColrPaletteTheme };

export function qcf4ColrPaletteForReadingTheme(
  readingThemeId?: QuranReadingThemeId | string | null,
  isDark?: boolean
): Qcf4ColrPaletteTheme {
  const id = (readingThemeId ?? "").trim();
  if (id === "dark" || isDark) return "dark";
  if (id === "sepia") return "sepia";
  return "light";
}

/** Quran Foundation COLRv1 palette slots (light/dark/sepia). */
export function qcf4ColrBasePaletteIndex(theme: Qcf4ColrPaletteTheme): number {
  if (theme === "dark") return 1;
  if (theme === "sepia") return 2;
  return 0;
}
