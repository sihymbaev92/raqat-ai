import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "../theme/colors";
import type { OrnamentTone } from "../theme/ornamentAssets";

type Props = {
  colors: ThemeColors;
  title: string;
  subtitle?: string;
  tone?: OrnamentTone;
};

/** Тақырып баннері — орнаментсіз, қарапайым карточка. */
export function KazakhOrnamentTitleBanner({ colors, title, subtitle }: Props) {
  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
