import { Platform, type TextStyle } from "react-native";
import { QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";

const TALBIYAH_ARABIC_FACE = QURAN_BOOK_FONT_FACE.scheherazade;

/** Тәлбия арабша — Scheherazade (мұсаф нақышы, диакритикалар анық). */
export function talbiyahArabicTextStyle(compact?: boolean): TextStyle {
  const base: TextStyle = {
    writingDirection: "rtl",
    textAlign: "right",
    color: "#FAF3E0",
    fontSize: compact ? 21 : 26,
    lineHeight: compact ? 34 : 42,
    letterSpacing: 0.2,
    ...(Platform.OS === "web"
      ? {
          fontFamily: `"${TALBIYAH_ARABIC_FACE}", "Scheherazade New", "Amiri", "Noto Naskh Arabic", serif`,
        }
      : { fontFamily: TALBIYAH_ARABIC_FACE }),
  };
  return base;
}
