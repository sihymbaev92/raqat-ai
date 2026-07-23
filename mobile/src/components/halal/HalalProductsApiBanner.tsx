import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import type { HalalProductsApiProbe } from "../../services/halalProductsApiProbe";
import { useAppLocale } from "../../i18n/runtime";

type Props = {
  colors: ThemeColors;
  probe: HalalProductsApiProbe | null;
  loading: boolean;
  seedCount?: number;
  additiveSeedCount?: number;
  onOpenDocs?: () => void;
};

export function HalalProductsApiBanner({
  colors,
  probe,
  loading,
  seedCount = 0,
  additiveSeedCount = 0,
  onOpenDocs,
}: Props) {
  useAppLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (loading && !probe) {
    return (
      <View style={[styles.wrap, styles.wrapMuted]}>
        <MaterialIcons name="hourglass-empty" size={18} color={colors.muted} />
        <Text style={[styles.body, { color: colors.muted }]}>{kk.features.halalProductsApiChecking}</Text>
      </View>
    );
  }

  if (!probe || probe.hasProducts) return null;

  return (
    <View style={[styles.wrap, styles.wrapWarn]}>
      <MaterialIcons name="info-outline" size={20} color="#b45309" />
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: colors.text }]}>{kk.features.halalProductsApiEmptyTitle}</Text>
        <Text style={[styles.body, { color: colors.muted }]}>{kk.features.halalProductsApiEmptyBody}</Text>
        {seedCount > 0 ? (
          <Text style={[styles.body, { color: colors.muted, marginTop: 4 }]}>
            {kk.features.halalProductsApiEmptySeed(seedCount)}
          </Text>
        ) : null}
        {additiveSeedCount > 0 ? (
          <Text style={[styles.body, { color: colors.muted, marginTop: 4 }]}>
            {kk.features.halalAdditivesApiEmptySeed(additiveSeedCount)}
          </Text>
        ) : null}
      </View>
      {onOpenDocs ? (
        <Pressable
          onPress={onOpenDocs}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={kk.features.halalProductsApiLearnMore}
          style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1, padding: 4 }]}
        >
          <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 10,
    },
    wrapWarn: {
      borderColor: "rgba(245,158,11,0.45)",
      backgroundColor: "rgba(245,158,11,0.08)",
    },
    wrapMuted: {
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 12,
      fontWeight: "800",
    },
    body: {
      marginTop: 3,
      fontSize: 11,
      lineHeight: 15,
    },
  });
}
