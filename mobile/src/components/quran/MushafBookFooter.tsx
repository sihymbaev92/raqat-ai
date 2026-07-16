import React, { useMemo } from "react";
import { useAppLocale } from "../../i18n/runtime";
import { StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { resolveQuranReadingTheme } from "../../theme/quranComReadingTheme";
type Props = {
  page?: number;
  pageA11y?: string;
  colors: ThemeColors;
  isDark: boolean;
  bookMushaf?: boolean;
  hizb?: number;
  /** Беттің бірінші аяты сүре №1 — Hizb pill (оң төмен). */
  surahStartsOnPage?: boolean;
  readingThemeId?: import("../../theme/quranComReadingTheme").QuranReadingThemeId | null;
};

/** Мұсаф бетінің төменгі жолы — хизб (сүре басы) және бет нөмірі. */
export function MushafBookFooter({
  page,
  pageA11y,
  colors,
  isDark,
  bookMushaf,
  hizb,
  surahStartsOnPage = false,
  readingThemeId,
}: Props) {
  useAppLocale();
  const theme = resolveQuranReadingTheme(readingThemeId);
  const qcom = Boolean(bookMushaf && theme.minimalPageChrome);
  const styles = useMemo(
    () => makeStyles(theme, qcom, surahStartsOnPage),
    [theme, qcom, surahStartsOnPage]
  );
  const showHizbRow = qcom && surahStartsOnPage && hizb != null && hizb > 0;
  const showPageRow = qcom && page != null && page > 0;

  if (!showHizbRow && !showPageRow) return null;

  return (
    <View style={styles.root} accessibilityRole="text" accessibilityLabel={pageA11y}>
      <View style={styles.pillRow}>
        {showHizbRow ? (
          <View style={styles.pillSingle}>
            <Text style={styles.pillHizb}>{kk.quran.mushafFooterHizbQcom(hizb)}</Text>
          </View>
        ) : null}
        {showPageRow ? (
          <View style={styles.pillSingle}>
            <Text style={styles.pillPage}>{kk.quran.mushafChromePage(page!)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(
  theme: ReturnType<typeof resolveQuranReadingTheme>,
  qcom: boolean,
  surahStartsOnPage: boolean
) {
  const surahFooter = qcom && surahStartsOnPage;
  return StyleSheet.create({
    root: {
      alignSelf: "stretch",
      alignItems: surahFooter ? "flex-end" : "center",
      paddingTop: qcom ? 10 : 16,
      paddingBottom: qcom ? 8 : 10,
      paddingHorizontal: qcom ? 14 : 0,
      backgroundColor: theme.pageFace,
    },
    pillRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pillSingle: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.pageBorderColor,
      backgroundColor: theme.titlePaperBg,
      paddingVertical: 5,
      paddingHorizontal: 11,
    },
    pillHizb: {
      fontSize: 11,
      fontWeight: "500",
      color: theme.titleInk,
      fontFamily: QCOM_LATIN_SERIF,
    },
    pillPage: {
      fontSize: 10.5,
      fontWeight: "600",
      color: theme.titleInk,
      fontVariant: ["tabular-nums"],
      minWidth: 18,
      textAlign: "center",
      fontFamily: QCOM_LATIN_SERIF,
    },
    pagePlain: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.chromeInk,
      fontVariant: ["tabular-nums"],
    },
  });
}

const QCOM_LATIN_SERIF = "Georgia, 'Times New Roman', serif";
