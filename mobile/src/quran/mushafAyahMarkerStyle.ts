export const QCF4_AYAH_MARKER_BLUE = "#1D6FB8";
export const QCF4_AYAH_MARKER_FACE = "#EAF2FB";
export const QCF4_AYAH_MARKER_NUMBER_LIGHT = "#111111";
export const QCF4_AYAH_MARKER_NUMBER_DARK = "#FFFFFF";

export function qcf4AyahMarkerHeight(lineHeight: number, glyphLineHeight: number): number {
  const safeLineHeight = Number.isFinite(lineHeight) ? lineHeight : 0;
  const safeGlyphLineHeight = Number.isFinite(glyphLineHeight) ? glyphLineHeight : 0;
  const target = Math.round(safeGlyphLineHeight * 0.82);
  const max = Math.max(30, Math.floor(safeLineHeight + 2));
  return Math.max(30, Math.min(target, max));
}

export function qcf4AyahMarkerTextColor(isDark: boolean): string {
  return isDark ? QCF4_AYAH_MARKER_NUMBER_DARK : QCF4_AYAH_MARKER_NUMBER_LIGHT;
}

function hexChannel(hex: string, start: number): number {
  const n = Number.parseInt(hex.slice(start, start + 2), 16);
  return Number.isFinite(n) ? n : 255;
}

function isDarkHexColor(color: string | undefined): boolean {
  const raw = (color ?? "").trim();
  const full =
    /^#[0-9a-f]{6}$/i.test(raw)
      ? raw
      : /^#[0-9a-f]{3}$/i.test(raw)
        ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
        : "";
  if (!full) return false;
  const r = hexChannel(full, 1);
  const g = hexChannel(full, 3);
  const b = hexChannel(full, 5);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export function qcf4AyahMarkerTextColorForPage(isDark: boolean, pageFace: string | undefined): string {
  return qcf4AyahMarkerTextColor(isDark || isDarkHexColor(pageFace));
}
