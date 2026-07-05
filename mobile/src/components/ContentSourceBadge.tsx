import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";

export type ContentSourceKind =
  | "hadith"
  | "muftiyat"
  | "fatua"
  | "official"
  | "quran";

type Props = {
  colors: ThemeColors;
  kind: ContentSourceKind;
  label?: string;
  compact?: boolean;
};

/** @deprecated use ContentSourceBadge + i18n */
export const DEFAULT_LABELS: Record<ContentSourceKind, string> = {
  hadith: kk.contentSource.hadith,
  muftiyat: kk.contentSource.muftiyat,
  fatua: kk.contentSource.fatua,
  official: kk.contentSource.official,
  quran: kk.contentSource.quran,
};

export function ContentSourceBadge({ colors, kind, label, compact }: Props) {
  const { tr } = useKkAutoTranslator();
  const text = label?.trim() || tr(kk.contentSource[kind]);
  return (
    <View
      style={[
        styles.wrap,
        compact ? styles.wrapCompact : null,
        {
          backgroundColor: `${colors.accent}14`,
          borderColor: `${colors.accent}44`,
        },
      ]}
      accessibilityRole="text"
    >
      <Text
        style={[styles.text, compact ? styles.textCompact : null, { color: colors.accent }]}
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  wrapCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  textCompact: {
    fontSize: 10,
  },
});
