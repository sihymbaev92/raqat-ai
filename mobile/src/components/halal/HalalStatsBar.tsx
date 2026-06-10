import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";

type Props = {
  colors: ThemeColors;
  totalItems: number;
  syncedAt: string | null;
  fromCache: boolean;
  loading: boolean;
  onRefresh: () => void;
  onOpenSite: () => void;
  /** footer — экранның төменгі жолағы */
  placement?: "top" | "footer";
};

export function HalalStatsBar({
  colors,
  totalItems,
  syncedAt,
  fromCache,
  loading,
  onRefresh,
  onOpenSite,
  placement = "top",
}: Props) {
  const styles = useMemo(() => makeStyles(colors, placement), [colors, placement]);
  const sub = loading
    ? kk.features.halalSyncInProgress
    : kk.features.halalSyncLine(totalItems, syncedAt, fromCache);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onRefresh}
        disabled={loading}
        style={({ pressed }) => [styles.refreshBtn, pressed && !loading && { opacity: 0.88 }]}
        accessibilityRole="button"
        accessibilityLabel={kk.common.retry}
      >
        {loading ? (
          <RaqatOrnamentSpinner size={18} />
        ) : (
          <MaterialIcons name="refresh" size={20} color={colors.accent} />
        )}
      </Pressable>
      <Pressable
        onPress={onOpenSite}
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={kk.features.halalSyncOpenSite}
      >
        <MaterialIcons name="verified" size={18} color={colors.accent} />
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {kk.features.halalSyncTitle}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            {sub}
          </Text>
        </View>
        <MaterialIcons name="open-in-new" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ThemeColors, placement: "top" | "footer") {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 8,
      marginTop: placement === "footer" ? 16 : 0,
      marginBottom: placement === "footer" ? 0 : 10,
    },
    refreshBtn: {
      width: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    main: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.accentSurface,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 12,
      fontWeight: "900",
      color: colors.text,
    },
    sub: {
      marginTop: 2,
      fontSize: 11,
      lineHeight: 15,
      color: colors.muted,
    },
  });
}
