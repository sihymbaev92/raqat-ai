import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import type { GuidanceModuleId } from "../content/moduleContentDepth";
import { getModuleDepthSnapshot } from "../content/moduleContentDepth";

type Props = {
  moduleId: GuidanceModuleId;
  colors: ThemeColors;
  /** Аударғыш — kk auto-translate */
  tr?: (text: string) => string;
};

/**
 * Модуль тереңдігі: кезең/сабақ/тақырып саны — барлық рухани экрандарда біркелкі.
 */
export function ModuleDepthStatsBar({ moduleId, colors, tr = (s) => s }: Props) {
  const snap = getModuleDepthSnapshot(moduleId);
  const styles = makeStyles(colors);
  if (!snap.depthLineKk) return null;

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <MaterialIcons name="layers" size={16} color={colors.accent} />
      <Text style={styles.text}>{tr(snap.depthLineKk)}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      alignSelf: "stretch",
    },
    text: {
      flex: 1,
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
    },
  });
}
