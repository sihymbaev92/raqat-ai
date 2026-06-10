import { Platform, StyleSheet } from "react-native";
import type { ThemeColors } from "../theme/colors";
import { resolveQuranReadingTheme, type QuranReadingThemeId } from "../theme/quranComReadingTheme";
import type { MushafTypographyMetrics } from "./mushafTypography";
import { QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";
import { quranArabicNoClipTextStyle } from "./quranArabicNoClipTextStyle";

const QCOM_SURAH_TITLE_FONT = Platform.select({
  web: {
    fontFamily: `"${QURAN_BOOK_FONT_FACE.scheherazade}", "Scheherazade New", serif`,
  },
  default: { fontFamily: QURAN_BOOK_FONT_FACE.scheherazade },
});

/** Quran.com: Al-Baqarah, Part 1 — латын serif. */
const QCOM_CHROME_LATIN = Platform.select({
  web: { fontFamily: 'Georgia, "Times New Roman", serif' },
  ios: { fontFamily: "Georgia" },
  default: { fontFamily: "serif" },
});

/** 604-беттік Hafs кітап экранының типография стильдері. */
export function makeMushafBookPageStyles(
  colors: ThemeColors,
  isDark: boolean,
  metrics: MushafTypographyMetrics,
  readingThemeId: QuranReadingThemeId
) {
  const theme = resolveQuranReadingTheme(readingThemeId);
  const qcomBook = theme.minimalPageChrome;
  const uiBg = theme.desk;
  const uiText = theme.titleInk;
  const uiMuted = isDark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.45)";
  const {
    arabAyahFont,
    mushafArabSize,
    mushafArabLineHeight,
    mushafTitleFs,
    mushafTitleLh,
    mushafBismFont,
    mushafBismLh,
  } = metrics;
  const mushafPageInk = metrics.mushafPageInk;
  const qcomArabSize = qcomBook && mushafArabSize ? Math.min(mushafArabSize, 30) : mushafArabSize;
  const qcomArabLineHeight =
    qcomBook && qcomArabSize ? Math.max(48, Math.round(qcomArabSize * 1.68)) : mushafArabLineHeight;

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: uiBg },
    pagerHost: { flex: 1, minHeight: 0, backgroundColor: uiBg, direction: "ltr" },
    pageShell: { flex: 1, minHeight: 0, overflow: "hidden" },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: uiBg,
      padding: 24,
    },
    muted: { color: uiMuted, marginTop: 12 },
    pad: { flex: 1, minHeight: 0, backgroundColor: theme.pageFace },
    mushafListPad: {
      paddingHorizontal: qcomBook ? 16 : 20,
      paddingTop: qcomBook ? 0 : 6,
    },
    mushafArabicCentered: {
      alignSelf: "stretch",
      alignItems: "center",
    },
    pageChromeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      alignSelf: "stretch",
      width: "100%",
      marginBottom: qcomBook ? 12 : 10,
      paddingHorizontal: qcomBook ? 12 : 16,
      transform: [{ translateY: qcomBook ? -8 : -4 }],
    },
    pageChromeSurah: {
      flexShrink: 0,
      flexGrow: 0,
      color: mushafPageInk,
      fontSize: qcomBook ? 15 : 15,
      fontWeight: "600",
      textAlign: "left",
      letterSpacing: qcomBook ? 0.2 : 0,
      ...(qcomBook ? QCOM_CHROME_LATIN : null),
    },
    pageChromePart: {
      flexShrink: 0,
      flexGrow: 0,
      marginLeft: "auto",
      color: mushafPageInk,
      fontSize: qcomBook ? 15 : 15,
      fontWeight: "600",
      textAlign: "right",
      letterSpacing: qcomBook ? 0.2 : 0,
      ...(qcomBook ? QCOM_CHROME_LATIN : null),
    },
    mushafSurahTitleBlock: {
      marginBottom: qcomBook ? 2 : 10,
      alignItems: "center",
    },
    mushafSurahTitlePaper: {
      alignSelf: "center",
      paddingVertical: 0,
      paddingHorizontal: 0,
      marginTop: 4,
      marginBottom: 4,
    },
    mushafSurahTitleAr: {
      color: mushafPageInk,
      fontSize: qcomBook ? 19 : 24,
      lineHeight: qcomBook ? 28 : 40,
      fontWeight: "400",
      textAlign: "center",
      writingDirection: "rtl",
      ...(qcomBook
        ? QCOM_SURAH_TITLE_FONT
        : Platform.select({
            web: {
              fontFamily: `"${QURAN_BOOK_FONT_FACE.amiri}", "Scheherazade New", "Noto Naskh Arabic", serif`,
            },
            default: { fontFamily: QURAN_BOOK_FONT_FACE.amiri },
          })),
    },
    bismillahBanner: {
      alignSelf: "stretch",
      alignItems: "center",
      marginBottom: qcomBook ? 4 : 10,
      paddingVertical: qcomBook ? 2 : 6,
    },
    mushafBismillahBanner: {
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "transparent",
      backgroundColor: "transparent",
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    bismillahBannerTxt: quranArabicNoClipTextStyle({
      color: mushafPageInk,
      textAlign: "center",
      writingDirection: "rtl",
      fontSize: mushafBismFont,
      lineHeight: mushafBismLh,
    }),
    mushafBismillahBannerTxt: {
      fontWeight: "500",
    },
    mushafAyahTxt: quranArabicNoClipTextStyle({
      color: mushafPageInk,
      writingDirection: "rtl",
      textAlign: "justify",
      ...arabAyahFont,
      ...(qcomArabSize ? { fontSize: qcomArabSize } : null),
      ...(qcomArabLineHeight ? { lineHeight: qcomArabLineHeight } : null),
      letterSpacing: qcomBook ? 0 : 0.12,
      ...(qcomBook && Platform.OS === "android" ? { textAlignVertical: "center" as const } : null),
    }, { compact: qcomBook }),
    mushafAyahSectionCaption: {
      marginTop: 4,
      marginBottom: 2,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.6,
      color: uiMuted,
      textAlign: "center",
      width: "100%",
    },
    mushafAyahKiril: {
      marginTop: 0,
      color: uiText,
      fontSize: 15,
      lineHeight: 24,
      textAlign: "center",
      fontWeight: "500",
      width: "100%",
    },
    mushafAyahKk: {
      marginTop: 0,
      color: uiText,
      fontSize: 16,
      lineHeight: 27,
      textAlign: "center",
      fontWeight: "500",
      width: "100%",
    },
    mushafNoKkHint: {
      marginTop: 8,
      fontSize: 11,
      lineHeight: 17,
      fontStyle: "italic",
      color: uiMuted,
      textAlign: "center",
      width: "100%",
    },
    mushafSecondaryAyahBlock: { marginTop: 10, gap: 4 },
    mushafSecondaryAyahRibbon: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
      color: uiMuted,
      textAlign: "center",
    },
    mushafInlineAudioControl: {
      marginTop: 8,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.04)",
    },
    mushafInlineAudioText: {
      color: uiMuted,
      fontSize: 12,
      fontWeight: "800",
    },
    topBar: {
      paddingLeft: 10,
      paddingRight: 10,
      paddingBottom: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    topBarTitle: { color: uiText, fontSize: 15, fontWeight: "800", flexShrink: 0 },
    topBarMeta: { color: uiMuted, fontSize: 12, fontWeight: "700" },
    topBarRight: { flex: 1, minWidth: 0, alignItems: "flex-end" },
    topBarSurahTitle: { color: uiText, fontSize: 15, fontWeight: "800", textAlign: "right" },
    topBarSurahArabic: {
      marginTop: 1,
      color: uiMuted,
      fontSize: 14,
      textAlign: "right",
      writingDirection: "rtl",
    },
  });
}

export type MushafBookPageStyles = ReturnType<typeof makeMushafBookPageStyles>;
