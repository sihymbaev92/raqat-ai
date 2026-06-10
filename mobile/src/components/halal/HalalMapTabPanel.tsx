import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";

type Props = {
  colors: ThemeColors;
  companyCount: number;
  onOpenMap: () => void;
};

export function HalalMapTabPanel({ colors, companyCount, onOpenMap }: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <View style={[styles.heroCard, { borderColor: colors.border, backgroundColor: colors.accentSurface }]}>
        <MaterialIcons name="place" size={44} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>{kk.features.halalMapTabTitle}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>{kk.features.halalMapTabHint}</Text>
        <Text style={[styles.stat, { color: colors.muted }]}>
          {kk.features.halalMapTabStat(companyCount)}
        </Text>
        <Pressable
          onPress={onOpenMap}
          style={({ pressed }) => [
            styles.openBtn,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.9 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={kk.features.halalMapOpenBtn}
        >
          <MaterialIcons name="map" size={22} color="#fff" />
          <Text style={styles.openBtnTxt}>{kk.features.halalMapOpenBtn}</Text>
        </Pressable>
      </View>
      <Text style={[styles.footNote, { color: colors.muted }]}>{kk.features.halalMapFooterNote}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    section: {
      marginTop: 4,
    },
    heroCard: {
      alignItems: "center",
      paddingVertical: 28,
      paddingHorizontal: 20,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 10,
    },
    title: {
      fontSize: 18,
      fontWeight: "900",
      textAlign: "center",
    },
    hint: {
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
      maxWidth: 320,
    },
    stat: {
      fontSize: 12,
      fontWeight: "700",
      marginTop: 4,
    },
    openBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 12,
    },
    openBtnTxt: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
    },
    footNote: {
      marginTop: 14,
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
    },
  });
}
