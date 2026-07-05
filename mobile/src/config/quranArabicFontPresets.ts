import { Platform, type TextStyle } from "react-native";
import { QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";
import {
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../theme/quranComReadingTheme";

export type QuranArabicFontPresetId =
  | "quran_com"
  | "default"
  | "large"
  | "compact"
  | "ios_mushaf"
  | "book_muftyat"
  | "book_amiri"
  | "book_lateef"
  | "book_scheherazade";

/** Madina mushaf оқу — Lateef (хатым бисмилләсімен бірдей), қара сия. */
export const DEFAULT_QURAN_ARABIC_FONT_PRESET: QuranArabicFontPresetId = "quran_com";

export const QURAN_ARABIC_FONT_PRESETS: { id: QuranArabicFontPresetId; labelKk: string }[] = [
  { id: "quran_com", labelKk: "Uthmanic (Madina)" },
  { id: "book_muftyat", labelKk: "Muftyat (оқулық нақыші)" },
  { id: "default", labelKk: "Жүйелік (қалың)" },
  { id: "large", labelKk: "Ірі (оқуға ыңғайлы)" },
  { id: "compact", labelKk: "Ықшам" },
  { id: "ios_mushaf", labelKk: "Классикалық (Geeza Pro, iOS)" },
  { id: "book_amiri", labelKk: "Кітап: Amiri (классикалық нақыш)" },
  { id: "book_lateef", labelKk: "Кітап: Lateef (жинақы)" },
  { id: "book_scheherazade", labelKk: "Кітап: Scheherazade (мұсаф үлкені)" },
];

export function normalizeArabicFontPreset(raw: string | null | undefined): QuranArabicFontPresetId {
  const s = (raw ?? "").trim();
  if (s === "default" || s === "") return DEFAULT_QURAN_ARABIC_FONT_PRESET;
  const id = s as QuranArabicFontPresetId;
  return QURAN_ARABIC_FONT_PRESETS.some((p) => p.id === id) ? id : DEFAULT_QURAN_ARABIC_FONT_PRESET;
}

/** Мұсаф / хатым кітап оқуы: Quran.com — Scheherazade; әдепкі — Lateef. */
export function effectiveArabicPresetForMushafBook(
  preset: QuranArabicFontPresetId,
  readingThemeId?: QuranReadingThemeId
): QuranArabicFontPresetId {
  const qcom = resolveQuranReadingTheme(readingThemeId).minimalPageChrome;
  if (qcom) {
    return "book_lateef";
  }
  if (preset === "default" || preset === "large" || preset === "compact") return "quran_com";
  return preset;
}

export function isMuftyatStyleArabicPreset(preset: QuranArabicFontPresetId): boolean {
  return preset === "book_muftyat" || preset === "book_lateef";
}

export function isQuranComStyleArabicPreset(preset: QuranArabicFontPresetId): boolean {
  return preset === "quran_com" || preset === "book_scheherazade" || preset === "ios_mushaf";
}

/** Аят арабының өлшемі мен (қажет болса) fontFamily — Tajweed/қарапайым Text ортак қолданады. */
export function quranArabicAyahTextMetrics(
  preset: QuranArabicFontPresetId,
  androidSansMedium?: string
): Pick<TextStyle, "fontSize" | "lineHeight" | "fontWeight" | "fontFamily"> {
  const androidFallback = androidSansMedium ? { fontFamily: androidSansMedium } : {};
  switch (preset) {
    case "quran_com":
      return {
        fontSize: 26,
        lineHeight: 47,
        fontWeight: "400",
        fontFamily: QURAN_BOOK_FONT_FACE.uthmanic,
      };
    case "large":
      return { fontSize: 36, lineHeight: 58, fontWeight: "700", ...androidFallback };
    case "compact":
      return { fontSize: 26, lineHeight: 44, fontWeight: "700", ...androidFallback };
    case "ios_mushaf":
      if (Platform.OS === "ios") {
        return { fontSize: 30, lineHeight: 50, fontWeight: "600", fontFamily: "Geeza Pro" };
      }
      return { fontSize: 32, lineHeight: 54, fontWeight: "700", ...androidFallback };
    case "book_muftyat":
      return {
        fontSize: 32,
        lineHeight: 56,
        fontWeight: "400",
        fontFamily: QURAN_BOOK_FONT_FACE.lateef,
      };
    case "book_amiri":
      return {
        fontSize: 30,
        lineHeight: 52,
        fontWeight: "400",
        fontFamily: QURAN_BOOK_FONT_FACE.amiri,
      };
    case "book_lateef":
      return {
        fontSize: 26,
        lineHeight: 47,
        fontWeight: "400",
        fontFamily: QURAN_BOOK_FONT_FACE.uthmanic,
      };
    case "book_scheherazade":
      return {
        fontSize: 30,
        lineHeight: 56,
        fontWeight: "400",
        fontFamily: QURAN_BOOK_FONT_FACE.scheherazade,
      };
    default:
      return { fontSize: 32, lineHeight: 54, fontWeight: "700", ...androidFallback };
  }
}
