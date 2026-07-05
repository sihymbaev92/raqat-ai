import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";

type Props = {
  colors: ThemeColors;
  hint: string;
  badge?: string;
};

/** Ақпараттық құрал экрандары: ресми пәтуа/қол қою жоқ ескертуі. */
export function InformationalToolBanner({ colors, hint, badge = kk.common.informationalToolBadge }: Props) {
  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="text"
    >
      <MaterialIcons name="info-outline" size={16} color={colors.accent} />
      <View style={styles.textCol}>
        <Text style={[styles.badge, { color: colors.accent }]}>{badge}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textCol: { flex: 1, minWidth: 0, gap: 2 },
  badge: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3, textTransform: "uppercase" },
  hint: { fontSize: 12, lineHeight: 17, fontWeight: "600" },
});
