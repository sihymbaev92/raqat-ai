import React, { useMemo } from "react";
import { Text, StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { useAppTheme } from "../../theme/ThemeContext";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import {
  HADITH_CONTENT_TYPES,
  type HadithContentTypeId,
} from "../../content/hadithContentTypes";

type Props = {
  type: HadithContentTypeId;
  /** compact — hub list rows; default — detail headers */
  variant?: "compact" | "default";
  style?: TextStyle;
};

export function HadithContentTypeBadge({ type, variant = "default", style }: Props) {
  const { colors } = useAppTheme();
  const { tr } = useKkAutoTranslator();
  const styles = useMemo(() => makeStyles(colors, variant), [colors, variant]);
  const def = HADITH_CONTENT_TYPES[type];
  const label = tr(kk.hadith.contentTypes[def.badgeI18nKey]);

  return (
    <Text
      style={[styles.badge, type === "sahihCorpus" && styles.sahih, style]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {label}
    </Text>
  );
}

function makeStyles(colors: ThemeColors, variant: "compact" | "default") {
  const base: TextStyle = {
    alignSelf: "flex-start",
    fontWeight: "800",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: variant === "compact" ? 8 : 10,
    paddingVertical: variant === "compact" ? 3 : 5,
  };
  return StyleSheet.create({
    badge: {
      ...base,
      fontSize: variant === "compact" ? 10 : 11,
      color: colors.muted,
      backgroundColor: colors.card,
      borderColor: colors.border,
    } as ViewStyle & TextStyle,
    sahih: {
      color: colors.accent,
      backgroundColor: colors.accentSurface,
      borderColor: `${colors.accent}55`,
    },
  });
}
