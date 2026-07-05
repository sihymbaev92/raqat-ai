import React from "react";
import { Text, StyleSheet, type StyleProp, type TextStyle } from "react-native";
import type { ThemeColors } from "../../theme/colors";
import type { AppLocale } from "../../i18n/runtime";
import { useQuranTranslationAttribution } from "../../hooks/useQuranTranslationAttribution";

type Props = {
  locale: AppLocale;
  colors: ThemeColors;
  style?: StyleProp<TextStyle>;
};

export function QuranTranslationAttributionFooter({ locale, colors, style }: Props) {
  const line = useQuranTranslationAttribution(locale);
  return <Text style={[styles.footer, { color: colors.muted }, style]}>{line}</Text>;
}

const styles = StyleSheet.create({
  footer: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
    textAlign: "center",
  },
});
