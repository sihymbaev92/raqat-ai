import { Platform } from "react-native";
import type { ThemeColors } from "./colors";

/** iOS grouped list стилі — референс mockup (#F2F2F7 фон, ақ карточка). */
export const QURAN_LIST_BG_LIGHT = "#F2F2F7";
export const QURAN_LIST_CARD_LIGHT = "#FFFFFF";
export const QURAN_LIST_MUTED_LIGHT = "#8E8E93";
/** Сүре тізімі: оң жақ бет нөмірі, джуз тақырыбы (қоңыр емес, қара). */
export const QURAN_LIST_PAGE_NUM_LIGHT = "#000000";

export function quranSurahListColors(colors: ThemeColors, isDark: boolean) {
  return {
    screenBg: isDark ? colors.bg : QURAN_LIST_BG_LIGHT,
    cardBg: isDark ? colors.card : QURAN_LIST_CARD_LIGHT,
    title: colors.text,
    subtitle: isDark ? colors.muted : QURAN_LIST_MUTED_LIGHT,
    pageNum: isDark ? colors.text : QURAN_LIST_PAGE_NUM_LIGHT,
    juzHeader: isDark ? colors.text : QURAN_LIST_PAGE_NUM_LIGHT,
    cardBorder: isDark ? colors.border : "transparent",
  };
}

export const quranSurahListTypography = {
  numberedTitle: {
    fontSize: 17,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
  arabicInline: {
    fontSize: 22,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  metaSubtitle: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
  },
  pageIndex: {
    fontSize: Platform.select({ web: 20, default: 22 }),
    lineHeight: Platform.select({ web: 24, default: 26 }),
    fontWeight: "400" as const,
    fontVariant: ["tabular-nums"] as const,
    letterSpacing: 0.2,
  },
  juzSection: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  readerTitle: {
    fontSize: 17,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
    textAlign: "center" as const,
  },
  readerSubtitle: {
    fontSize: 13,
    fontWeight: "400" as const,
    textAlign: "center" as const,
    marginTop: 2,
  },
};
