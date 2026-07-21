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

/**
 * Бір карта: дін–дәстүр–ырым байланысын толық әрі жеңіл түсіндіреді.
 * Майда ереже тізімі жоқ — үш анық ой + бір негізгі жол.
 */
export function DinDasturConnectionCard({ palette, tr, onOpenFoundation, onOpenYrym }: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const g = useI18n().features.traditionGuide;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <MaterialIcons name="lightbulb-outline" size={20} color={palette.bannerBg} />
        <Text style={styles.headTitle}>{g.dinDasturConnectionTitle}</Text>
      </View>

      <Text style={styles.summary}>{tr(DIN_DASTUR_CONNECTION_SUMMARY)}</Text>

      <Text style={styles.pointsLabel}>{g.dinDasturPointsTitle}</Text>
      {DIN_DASTUR_PLAIN_POINTS.map((point, index) => (
        <View key={point.id} style={styles.pointRow}>
          <View style={styles.pointNo}>
            <Text style={styles.pointNoText}>{index + 1}</Text>
          </View>
          <View style={styles.pointBody}>
            <Text style={styles.pointTitle}>{tr(point.title)}</Text>
            <Text style={styles.pointText}>{tr(point.body)}</Text>
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
          <Text style={styles.btnPrimaryText}>{g.dinDasturFoundationBtn}</Text>
        </Pressable>
        <Pressable
          oyuBackdrop={false}
          onPress={onOpenYrym}
          style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel={g.dinDasturYrymBtn}
        >
          <Text style={styles.btnSecondaryText}>{g.dinDasturYrymBtn}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: p.goldSurface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
      gap: 10,
    },
    head: { flexDirection: "row", alignItems: "center", gap: 8 },
    headTitle: { color: p.text, fontSize: 16, fontWeight: "900", flex: 1 },
    summary: { color: p.text, fontSize: 14, lineHeight: 21, fontWeight: "600" },
    pointsLabel: { color: p.muted, fontSize: 12, fontWeight: "800", marginTop: 2 },
    pointRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    pointNo: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: p.buttonGoldBg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    pointNoText: { color: p.buttonGoldText, fontSize: 12, fontWeight: "900" },
    pointBody: { flex: 1, gap: 2 },
    pointTitle: { color: p.text, fontSize: 14, fontWeight: "900" },
    pointText: { color: p.muted, fontSize: 13, lineHeight: 19, fontWeight: "600" },
    actions: { gap: 8, marginTop: 4 },
    btn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, alignItems: "center" },
    btnPrimary: { backgroundColor: p.buttonGoldBg },
    btnPrimaryText: { color: p.buttonGoldText, fontSize: 14, fontWeight: "900" },
    btnSecondary: {
      backgroundColor: p.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
    },
    btnSecondaryText: { color: p.text, fontSize: 14, fontWeight: "800" },
  });
}
