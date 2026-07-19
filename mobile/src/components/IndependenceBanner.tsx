import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";

type Props = {
  colors: ThemeColors;
  /** Ықшам жол (дашборд). */
  compact?: boolean;
};

/** Тәуелсіздік ескертуі — ҚМДБ/Muftyat ресми қолданбасы емес. */
export function IndependenceBanner({ colors, compact = false }: Props) {
  useAppLocale();
  const styles = useMemo(() => makeStyles(colors, compact), [colors, compact]);
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <MaterialIcons name="info-outline" size={compact ? 16 : 18} color={colors.accent} />
      <Text style={styles.txt}>
        {compact ? kk.transparency.independenceShort : kk.transparency.independenceFull}
      </Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors, compact: boolean) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginHorizontal: compact ? 12 : 0,
      marginBottom: compact ? 8 : 0,
      paddingVertical: compact ? 8 : 10,
      paddingHorizontal: compact ? 10 : 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    txt: {
      flex: 1,
      minWidth: 0,
      color: colors.muted,
      fontSize: compact ? 11 : 12,
      lineHeight: compact ? 16 : 18,
      fontWeight: "600",
    },
  });
}
