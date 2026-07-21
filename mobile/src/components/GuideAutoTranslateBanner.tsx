import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useAppLocale, useLocaleRevision } from "../i18n/runtime";

/** Машиналық аударма көрсетілгенде үстінде шығатын ескерту жолағы. */
export function GuideAutoTranslateBanner({
  colors,
  visible,
}: {
  colors: ThemeColors;
  visible: boolean;
}) {
  useAppLocale();
  useLocaleRevision();
  if (!visible) return null;
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.accentSurface, borderColor: colors.border },
      ]}
    >
      <MaterialIcons name="translate" size={15} color={colors.muted} />
      <Text style={[styles.text, { color: colors.muted }]}>{kk.common.autoTranslateNotice}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, fontSize: 11, fontWeight: "600" },
});
