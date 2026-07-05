import type { QuranReadingThemeId } from "../theme/quranComReadingTheme";

export type Qcf4ColrPaletteTheme = "light" | "dark" | "sepia";

export function qcf4ColrPaletteForReadingTheme(
  readingThemeId?: QuranReadingThemeId | string | null,
  isDark?: boolean
): Qcf4ColrPaletteTheme {
  const id = (readingThemeId ?? "").trim();
  if (id === "dark" || isDark) return "dark";
  if (id === "sepia") return "sepia";
  return "light";
}
