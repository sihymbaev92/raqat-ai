import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { kk } from "../i18n/kk";
import type { ThemeColors } from "../theme/colors";

type Props = {
  colors: ThemeColors;
  apiBase: string | null;
  onOpenSettings: () => void;
};

function apiHostLabel(base: string | null): string {
  if (!base) return "—";
  try {
    return new URL(base).host;
  } catch {
    return base.slice(0, 48);
  }
}

/** AI чатта қысқа жолақ: толық баптаулар экранына өтеді. */
export function RaqatAiChatSettingsPanel({ colors, apiBase, onOpenSettings }: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <MaterialIcons name="tune" size={22} color={colors.accent} />
        <View style={styles.textCol}>
          <Text style={styles.title}>{kk.aiChat.settingsPanelTitle}</Text>
          <Text style={styles.sub}>
            {apiBase
              ? kk.aiChat.activeApiHost(apiHostLabel(apiBase))
              : kk.aiChat.configBody}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel={kk.aiChat.openSettingsTab}
        >
          <Text style={styles.btnTxt}>{kk.aiChat.openSettingsShort}</Text>
          <MaterialIcons name="chevron-right" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: 12,
      marginTop: 8,
      marginBottom: 4,
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.text,
    },
    sub: {
      marginTop: 4,
      fontSize: 11,
      lineHeight: 16,
      color: colors.muted,
    },
    btn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.accent,
    },
    btnTxt: {
      fontSize: 13,
      fontWeight: "800",
      color: "#fff",
    },
  });
}
