import type { Qcf4ColrPaletteTheme } from "../config/mushafPagesBase";
import { qcf4ColrBasePaletteIndex } from "./qcf4ColrTheme";

const injectedFamilies = new Set<string>();

export function qcf4ColrWebClassName(family: string, theme: Qcf4ColrPaletteTheme): string {
  return `qcf4-colr-${theme}-${family.replace(/[^A-Za-z0-9_-]/g, "_")}`;
}

/** Inject @font-palette-values for COLRv1 (Chrome/Safari/Edge). */
export function injectQcf4ColrPaletteCss(
  family: string,
  paletteIndex: number,
  theme: Qcf4ColrPaletteTheme
): void {
  if (typeof document === "undefined") return;
  if (injectedFamilies.has(`${family}:${theme}`)) return;
  injectedFamilies.add(`${family}:${theme}`);

  const paletteName = `--QCF4V4-${theme}-${family.replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const className = qcf4ColrWebClassName(family, theme);
  const id = `qcf4-colr-palette-${className}`;
  if (document.getElementById(id)) return;

  const el = document.createElement("style");
  el.id = id;
  el.textContent = `
@font-palette-values ${paletteName} {
  font-family: "${family}";
  base-palette: ${paletteIndex};
}
.${className} {
  font-family: "${family}";
  font-palette: ${paletteName};
}
`.trim();
  document.head.appendChild(el);
}

export function clearQcf4ColrPaletteCssCache(): void {
  injectedFamilies.clear();
}
