import { Platform, type TextStyle, type ViewStyle } from "react-native";
import { QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";

export type ScriptureArabicFont = "amiri" | "scheherazade" | "lateef";

export type ScriptureArabicTextStyleOpts = {
  /** Аят/сөйлем — әдепкі оң жақ; бір әріп/hero — center. */
  align?: "right" | "center";
  font?: ScriptureArabicFont;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: TextStyle["fontWeight"];
};

function resolveArabicFace(font: ScriptureArabicFont): string {
  switch (font) {
    case "scheherazade":
      return QURAN_BOOK_FONT_FACE.scheherazade;
    case "lateef":
      return QURAN_BOOK_FONT_FACE.lateef;
    default:
      return QURAN_BOOK_FONT_FACE.amiri;
  }
}

function webFontStack(face: string): string {
  return `"${face}", "Scheherazade New", "Noto Naskh Arabic", "Arabic Typesetting", serif`;
}

/**
 * Қолданба бойынша араб мәтін (дұға, тәжуид, хадис, намаз, т.б.).
 * Quran reader ішкі engine — `quranReaderViewportMetrics` / `quranResponsiveLayout`.
 */
export function scriptureArabicTextStyle(opts?: ScriptureArabicTextStyleOpts): TextStyle {
  const align = opts?.align ?? "right";
  const face = resolveArabicFace(opts?.font ?? "amiri");
  const rightAligned = align === "right";
  return {
    writingDirection: "rtl",
    textAlign: align,
    ...(rightAligned
      ? { width: "100%", alignSelf: "stretch" as const, flexShrink: 1, minWidth: 0 }
      : { flexShrink: 1 }),
    letterSpacing: 0,
    ...(opts?.color ? { color: opts.color } : null),
    ...(opts?.fontSize != null ? { fontSize: opts.fontSize } : null),
    ...(opts?.lineHeight != null ? { lineHeight: opts.lineHeight } : null),
    ...(opts?.fontWeight != null ? { fontWeight: opts.fontWeight } : null),
    ...(Platform.OS === "web"
      ? { fontFamily: webFontStack(face) }
      : { fontFamily: face }),
    ...(Platform.OS === "android"
      ? {
          includeFontPadding: true,
          textAlignVertical: "center" as const,
          textBreakStrategy: "highQuality" as const,
          ...(rightAligned ? { paddingVertical: 4 } : null),
        }
      : null),
  };
}

/** Араб `<Text>` орауышы — LTR экран, RTL мәтін (Android flip-safe). */
export function scriptureArabicContainerStyle(): ViewStyle {
  return {
    width: "100%",
    alignSelf: "stretch",
    overflow: "visible",
  };
}
