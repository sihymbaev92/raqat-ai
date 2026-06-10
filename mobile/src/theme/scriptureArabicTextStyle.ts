import { Platform, type TextStyle } from "react-native";
import { QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";

/** Arabic scripture lines (duas, tasbih previews) — avoid Latin fallback glyphs on web. */
export function scriptureArabicTextStyle(): Pick<TextStyle, "fontFamily" | "writingDirection" | "textAlign"> {
  const face = QURAN_BOOK_FONT_FACE.amiri;
  return {
    writingDirection: "rtl",
    textAlign: "right",
    ...(Platform.OS === "web"
      ? {
          fontFamily: `"${face}", "Scheherazade New", "Noto Naskh Arabic", "Arabic Typesetting", serif`,
        }
      : { fontFamily: face }),
  };
}
