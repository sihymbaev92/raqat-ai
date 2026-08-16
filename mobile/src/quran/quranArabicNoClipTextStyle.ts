import { Platform, type TextStyle } from "react-native";

const MIN_ARABIC_LINE_HEIGHT_FACTOR = Platform.OS === "web" ? 1.82 : 1.88;
const COMPACT_ARABIC_LINE_HEIGHT_FACTOR = Platform.OS === "web" ? 1.68 : 1.74;

function numeric(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function addPadding(base: unknown, extra: number): number {
  const n = numeric(base);
  return Math.max(n ?? 0, extra);
}

/**
 * Quran Arabic glyphs carry tall harakat and low descenders. Keep extra font
 * padding and vertical breathing room so ayah text is never clipped on Android
 * or web, even when a preset has an aggressive lineHeight.
 */
export function quranArabicNoClipTextStyle(
  style: TextStyle,
  opts: {
    compact?: boolean;
    extraBottomPadding?: number;
    turkishPrintHatim?: boolean;
    /** Түрік Unicode viewport: lineHeight сәл кеңейеді, descender padding. */
    turkishMedinaParity?: boolean;
    turkishQfFixedSize?: boolean;
    /** Сүре scroll тізімі — asti descender кесілмеуі. */
    ayahScrollStyle?: boolean;
  } = {}
): TextStyle {
  const fontSize = numeric(style.fontSize);
  const lineHeight = numeric(style.lineHeight);
  if (opts.turkishQfFixedSize) {
    return {
      ...style,
      flexShrink: 0,
      includeFontPadding: true,
      ...(Platform.OS !== "web" ? { textAlignVertical: "center" as const } : null),
    };
  }
  if (opts.turkishMedinaParity) {
    const scroll = opts.ayahScrollStyle === true;
    const verticalPad = scroll
      ? fontSize != null
        ? Math.max(5, Math.ceil(fontSize * 0.12))
        : 5
      : fontSize != null
        ? Math.max(3, Math.ceil(fontSize * 0.08))
        : 3;
    const minLineHeight =
      fontSize != null
        ? Math.max(
            lineHeight ?? 0,
            fontSize + (scroll ? 14 : 12),
            Math.ceil(fontSize * (scroll ? 1.28 : 1.32))
          )
        : lineHeight;
    return {
      ...style,
      flexShrink: 0,
      ...(minLineHeight != null ? { lineHeight: minLineHeight } : null),
      includeFontPadding: true,
      paddingTop: addPadding(style.paddingTop, scroll ? Math.max(2, Math.floor(verticalPad * 0.4)) : 1),
      paddingBottom: addPadding(style.paddingBottom, verticalPad + (opts.extraBottomPadding ?? 0) + (scroll ? 0 : 2)),
      ...(Platform.OS !== "web"
        ? { textAlignVertical: (scroll ? "center" : "top") as const }
        : null),
    };
  }
  if (opts.turkishPrintHatim) {
    const verticalPad = fontSize != null ? Math.max(1, Math.ceil(fontSize * 0.03)) : 1;
    const minLineHeight =
      fontSize != null
        ? Math.max(lineHeight ?? 0, fontSize + 4, Math.ceil(fontSize * 1.08))
        : lineHeight;
    return {
      ...style,
      flexShrink: 0,
      ...(minLineHeight != null ? { lineHeight: minLineHeight } : null),
      includeFontPadding: true,
      paddingTop: addPadding(style.paddingTop, Math.max(1, Math.floor(verticalPad * 0.35))),
      paddingBottom: addPadding(style.paddingBottom, verticalPad + (opts.extraBottomPadding ?? 0)),
      ...(Platform.OS !== "web" ? { textAlignVertical: "center" as const } : null),
    };
  }
  const factor = opts.compact ? COMPACT_ARABIC_LINE_HEIGHT_FACTOR : MIN_ARABIC_LINE_HEIGHT_FACTOR;
  const minLineHeight = fontSize != null ? Math.ceil(fontSize * factor) : null;
  const safeLineHeight =
    minLineHeight != null ? Math.max(lineHeight ?? minLineHeight, minLineHeight) : lineHeight;
  const verticalPad = fontSize != null ? Math.max(4, Math.ceil(fontSize * 0.12)) : 4;
  const nativeExtraBottom = Platform.OS === "web" ? 0 : Math.max(2, Math.ceil(verticalPad * 0.35));
  const bottomPad = verticalPad + nativeExtraBottom + (opts.extraBottomPadding ?? 0);
  return {
    ...style,
    ...(safeLineHeight != null ? { lineHeight: safeLineHeight } : null),
    includeFontPadding: true,
    paddingTop: addPadding(style.paddingTop, Math.max(3, Math.floor(verticalPad * 0.65))),
    paddingBottom: addPadding(style.paddingBottom, bottomPad),
    ...(Platform.OS !== "web" ? { textAlignVertical: "center" as const } : null),
  };
}
