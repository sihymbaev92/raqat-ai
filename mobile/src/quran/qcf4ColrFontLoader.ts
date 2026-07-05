import type { Qcf4ColrPaletteTheme } from "./qcf4ColrTheme";

/** COLR V4 fonts are optional; June 21 baseline falls back to API tag tajweed. */
export function qcf4ColrTajweedEnabledOnPlatform(): boolean {
  return false;
}

export async function ensureQcf4ColrPageFontLoaded(
  _page: number,
  _theme: Qcf4ColrPaletteTheme
): Promise<boolean> {
  return false;
}

export function qcf4ColrFontFamilyName(_page: number): string {
  return "Qcf4ColrPage";
}

export function qcf4ColrTextClassName(
  _page: number,
  _theme: Qcf4ColrPaletteTheme
): string | undefined {
  return undefined;
}
