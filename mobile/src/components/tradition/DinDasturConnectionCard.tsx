import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import {
  DIN_DASTUR_CONNECTION_SUMMARY,
  DIN_DASTUR_PLAIN_POINTS,
} from "../../content/dinMenDasturConnectionGuide";
import type { TraditionKazakhPalette } from "../../theme/traditionKazakhTheme";
import { useI18n } from "../../i18n/useI18n";

type Props = {
  palette: TraditionKazakhPalette;
  tr: (text: string) => string;
  onOpenFoundation: () => void;
  onOpenYrym: () => void;
};

/** Жинақы түсіндірме: қысқа мәтін + 3 жол + екі батырма қатар. */
export function DinDasturConnectionCard({ palette, tr, onOpenFoundation, onOpenYrym }: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const g = useI18n().features.traditionGuide;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <MaterialIcons name="lightbulb-outline" size={18} color={palette.bannerBg} />
        <Text style={styles.headTitle}>{g.dinDasturConnectionTitle}</Text>
      </View>

      <Text style={styles.summary}>{tr(DIN_DASTUR_CONNECTION_SUMMARY)}</Text>

      {DIN_DASTUR_PLAIN_POINTS.map((point, index) => (
        <View key={point.id} style={styles.pointRow}>
          <Text style={styles.pointNo}>{index + 1}.</Text>
          <View style={styles.pointBody}>
            <Text style={styles.pointTitle}>{tr(point.title)}</Text>
            <Text style={styles.pointText} numberOfLines={2}>
              {tr(point.body)}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.actions}>
        <Pressable
          oyuBackdrop={false}
          onPress={onOpenFoundation}
          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel={g.dinDasturFoundationBtn}
        >
          <Text style={styles.btnPrimaryText} numberOfLines={1}>
            {g.dinDasturFoundationBtn}
          </Text>
        </Pressable>
        <Pressable
          oyuBackdrop={false}
          onPress={onOpenYrym}
          style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel={g.dinDasturYrymBtn}
        >
          <Text style={styles.btnSecondaryText} numberOfLines={1}>
            {g.dinDasturYrymBtn}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: p.goldSurface,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
      gap: 8,
    },
    head: { flexDirection: "row", alignItems: "center", gap: 6 },
    headTitle: { color: p.text, fontSize: 15, fontWeight: "900", flex: 1 },
    summary: { color: p.text, fontSize: 13, lineHeight: 19, fontWeight: "600" },
    pointRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
    pointNo: { color: p.bannerBg, fontSize: 13, fontWeight: "900", width: 18, marginTop: 1 },
    pointBody: { flex: 1, minWidth: 0, gap: 1 },
    pointTitle: { color: p.text, fontSize: 13, fontWeight: "900" },
    pointText: { color: p.muted, fontSize: 12, lineHeight: 17, fontWeight: "600" },
    actions: { flexDirection: "row", gap: 8, marginTop: 2 },
    btn: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: "center",
    },
    btnPrimary: { backgroundColor: p.buttonGoldBg },
    btnPrimaryText: { color: p.buttonGoldText, fontSize: 12, fontWeight: "900" },
    btnSecondary: {
      backgroundColor: p.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
    },
    btnSecondaryText: { color: p.text, fontSize: 12, fontWeight: "800" },
  });
}
