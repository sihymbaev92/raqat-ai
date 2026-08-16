import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { quranSurahListTypography } from "../../theme/quranSurahListTheme";
import { surahArabicListTitle } from "../../data/surahArabicTitles";
import { scriptureArabicTextStyle, scriptureArabicContainerStyle } from "../../theme/scriptureArabicTextStyle";

function quranSurahListPalette(colors: ThemeColors, isDark: boolean) {
  return {
    screenBg: isDark ? colors.bg : "#F2F2F7",
    cardBg: isDark ? colors.card : "#FFFFFF",
    title: colors.text,
    subtitle: isDark ? colors.muted : "#8E8E93",
    pageNum: isDark ? colors.text : "#000000",
    juzHeader: isDark ? colors.text : "#000000",
    cardBorder: isDark ? colors.border : "transparent",
  };
}

export type QuranSurahListRowProps = {
  surahNumber: number;
  numberedTitle: string;
  metaSubtitle: string;
  /** Хатым тізімінде 604-бет нөмірі; Құран тізімінде көрсетілмейді. */
  mushafPage?: number;
  onPress: () => void;
  accessibilityLabel: string;
  colors: ThemeColors;
  isDark: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  inProgress?: boolean;
};

function QuranSurahListRowInner({
  surahNumber,
  numberedTitle,
  metaSubtitle,
  mushafPage,
  onPress,
  accessibilityLabel,
  colors,
  isDark,
  leading,
  trailing,
  inProgress,
}: QuranSurahListRowProps) {
  const palette = useMemo(() => quranSurahListPalette(colors, isDark), [colors, isDark]);
  const arabicTitle = useMemo(() => surahArabicListTitle(surahNumber), [surahNumber]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  /** Хатым: араб атау оң жақ бағанада (бет нөмірінің үстінде). */
  const hatimArabicTrailing = mushafPage != null;

  const arabicTitleNode = arabicTitle ? (
    <View style={hatimArabicTrailing ? styles.arabicHostTrailing : styles.arabicHost}>
      <Text
        style={[
          scriptureArabicTextStyle({ font: "lateef" }),
          hatimArabicTrailing ? styles.arabicTitleTrailing : styles.arabicTitle,
        ]}
        numberOfLines={hatimArabicTrailing ? 2 : 1}
        allowFontScaling={false}
      >
        {arabicTitle}
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.rowWrap}>
      {leading}
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <View style={styles.mainCol}>
          <Text style={styles.numberedTitle} numberOfLines={1} allowFontScaling={false}>
            {numberedTitle}
          </Text>
          {!hatimArabicTrailing ? arabicTitleNode : null}
          <Text style={styles.metaSubtitle} numberOfLines={1}>
            {metaSubtitle}
          </Text>
        </View>
        <View style={[styles.rightCol, hatimArabicTrailing && styles.rightColHatim]}>
          {hatimArabicTrailing ? (
            <>
              {arabicTitleNode}
              <View style={styles.rightColFoot}>
                {inProgress ? <Text style={styles.progressDot}>●</Text> : null}
                {trailing}
                {mushafPage != null ? (
                  <Text
                    style={styles.pageIndex}
                    importantForAccessibility="no"
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1}
                    numberOfLines={1}
                  >
                    {mushafPage}
                  </Text>
                ) : null}
              </View>
            </>
          ) : (
            <>
              {inProgress ? <Text style={styles.progressDot}>●</Text> : null}
              {trailing}
              {mushafPage != null ? (
                <Text
                  style={styles.pageIndex}
                  importantForAccessibility="no"
                  allowFontScaling={false}
                  maxFontSizeMultiplier={1}
                  numberOfLines={1}
                >
                  {mushafPage}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </Pressable>
    </View>
  );
}

export const QuranSurahListRow = React.memo(QuranSurahListRowInner);

export function QuranSurahListJuzHeader({
  juz,
  label,
  colors,
  isDark,
  compact,
}: {
  juz: number;
  label: string;
  colors: ThemeColors;
  isDark: boolean;
  compact?: boolean;
}) {
  const palette = useMemo(() => quranSurahListPalette(colors, isDark), [colors, isDark]);
  return (
    <Text
      style={{
        color: palette.juzHeader,
        fontSize: quranSurahListTypography.juzSection.fontSize,
        fontWeight: quranSurahListTypography.juzSection.fontWeight,
        letterSpacing: quranSurahListTypography.juzSection.letterSpacing,
        textTransform: quranSurahListTypography.juzSection.textTransform,
        marginTop: compact && juz === 1 ? 0 : juz === 1 ? 4 : 14,
        marginBottom: compact && juz === 1 ? 4 : 6,
        marginLeft: 4,
      }}
      accessibilityRole="header"
    >
      {label}
    </Text>
  );
}

function makeStyles(palette: ReturnType<typeof quranSurahListPalette>) {
  return StyleSheet.create({
    rowWrap: {
      flexDirection: "row",
      alignItems: "stretch",
      marginBottom: 8,
    },
    card: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: palette.cardBg,
      borderRadius: 12,
      borderWidth: palette.cardBorder === "transparent" ? 0 : 1,
      borderColor: palette.cardBorder,
      paddingVertical: 13,
      paddingHorizontal: 14,
      minHeight: 68,
    },
    cardPressed: { opacity: 0.88 },
    mainCol: { flex: 1, minWidth: 0, paddingRight: 8, alignSelf: "stretch" },
    numberedTitle: {
      ...quranSurahListTypography.numberedTitle,
      color: palette.title,
      flexShrink: 0,
      textAlign: "left",
    },
    arabicHost: {
      ...scriptureArabicContainerStyle(),
      marginTop: 2,
      alignItems: "flex-end",
    },
    arabicTitle: {
      ...quranSurahListTypography.arabicInline,
      color: palette.title,
      ...(Platform.OS === "android" ? { includeFontPadding: true } : {}),
    },
    arabicHostTrailing: {
      alignItems: "flex-end",
      alignSelf: "flex-end",
      maxWidth: 156,
      marginBottom: 2,
    },
    arabicTitleTrailing: {
      ...quranSurahListTypography.arabicInline,
      color: palette.title,
      textAlign: "right",
      ...(Platform.OS === "android" ? { includeFontPadding: true } : {}),
    },
    metaSubtitle: {
      ...quranSurahListTypography.metaSubtitle,
      color: palette.subtitle,
      marginTop: 4,
    },
    rightCol: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexShrink: 0,
      paddingLeft: 4,
    },
    rightColHatim: {
      flexDirection: "column",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 2,
      minWidth: 52,
      maxWidth: 168,
    },
    rightColFoot: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-end",
    },
    pageIndex: {
      ...quranSurahListTypography.pageIndex,
      fontVariant: ["tabular-nums"],
      color: palette.pageNum,
      minWidth: 24,
      maxWidth: 44,
      textAlign: "right",
      ...(Platform.OS === "web"
        ? { fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }
        : null),
    },
    progressDot: {
      color: palette.subtitle,
      fontSize: 10,
      marginRight: 2,
    },
  });
}

/** Хатым тізімі: сол жақта белгілеу чекбоксы. */
export function QuranSurahListCheckbox({
  checked,
  onToggle,
  accessibilityLabel,
  colors,
  isDark,
}: {
  checked: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const palette = useMemo(() => quranSurahListPalette(colors, isDark), [colors, isDark]);
  return (
    <Pressable
      style={({ pressed }) => [
        {
          justifyContent: "center",
          paddingLeft: 4,
          paddingRight: 8,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: checked ? colors.accent : colors.border,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: checked ? `${colors.accent}22` : isDark ? colors.card : palette.screenBg,
        }}
      >
        {checked ? (
          <Text style={{ color: colors.accent, fontWeight: "900", fontSize: 16 }}>✓</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Хатым тізімі: сүре жолының шамамен биіктігі (marginBottom қосылған). */
export const HATIM_SURAH_ROW_APPROX = 76;
