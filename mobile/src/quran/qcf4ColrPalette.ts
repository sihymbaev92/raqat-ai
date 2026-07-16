import type { Qcf4ColrPaletteTheme } from "./qcf4ColrTheme";

export function qcf4ColrWebClassName(_family: string, _theme: Qcf4ColrPaletteTheme): string {
  return "";
}

export function injectQcf4ColrPaletteCss(
  _family: string,
  _paletteIndex: number,
  _theme: Qcf4ColrPaletteTheme
): void {
  /* native: OT-SVG fonts bake colors */
}

export function clearQcf4ColrPaletteCssCache(): void {}
