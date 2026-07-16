import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import {
  DIN_DASTUR_CONNECTION_RULES,
  DIN_DASTUR_CONNECTION_SUMMARY,
  DIN_DASTUR_PILLARS,
} from "../../content/dinMenDasturConnectionGuide";
import type { TraditionKazakhPalette } from "../../theme/traditionKazakhTheme";

type Props = {
  palette: TraditionKazakhPalette;
  tr: (text: string) => string;
  onOpenFoundation: () => void;
  onOpenBata: () => void;
  bataCount: number;
};

export function DinDasturConnectionCard({ palette, tr, onOpenFoundation, onOpenBata, bataCount }: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <MaterialIcons name="account-balance" size={20} color={palette.bannerBg} />
        <Text style={styles.headTitle}>{tr("Дін мен дәстүр: байланыс")}</Text>
      </View>
      <Text style={styles.summary}>{tr(DIN_DASTUR_CONNECTION_SUMMARY)}</Text>

      {DIN_DASTUR_PILLARS.map((pillar) => (
        <View key={pillar.id} style={styles.pillar}>
          <Text style={styles.pillarTitle}>{tr(pillar.title)}</Text>
          <Text style={styles.pillarBody}>{tr(pillar.traditionRole)}</Text>
          <Text style={styles.pillarMeasure}>{tr(pillar.religionMeasure)}</Text>
        </View>
      ))}

      <Text style={styles.rulesTitle}>{tr("5 ереже")}</Text>
      {DIN_DASTUR_CONNECTION_RULES.map((rule) => (
        <View key={rule.id} style={styles.ruleRow}>
          <Text style={styles.ruleTitle}>{tr(rule.title)}</Text>
          <Text style={styles.ruleBody}>{tr(rule.body)}</Text>
          <Text style={styles.ruleEvidence}>{tr(rule.evidenceHint)}</Text>
        </View>
      ))}

      <View style={styles.actions}>
        <Pressable
          oyuBackdrop={false}
          onPress={onOpenFoundation}
          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
        >
          <Text style={styles.btnPrimaryText}>{tr("Негіз тақырыбы + дәлелдер")}</Text>
        </Pressable>
        <Pressable
          oyuBackdrop={false}
          onPress={onOpenBata}
          style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
        >
          <Text style={styles.btnSecondaryText}>{tr(`100 бата мәтіні (${bataCount})`)}</Text>
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
    headTitle: { color: p.text, fontSize: 15, fontWeight: "900", flex: 1 },
    summary: { color: p.muted, fontSize: 13, lineHeight: 19, fontWeight: "600" },
    pillar: {
      backgroundColor: p.cardBg,
      borderRadius: 12,
      padding: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      gap: 4,
    },
    pillarTitle: { color: p.text, fontSize: 13, fontWeight: "900" },
    pillarBody: { color: p.muted, fontSize: 12, lineHeight: 17, fontWeight: "600" },
    pillarMeasure: { color: p.text, fontSize: 12, lineHeight: 17, fontWeight: "700" },
    rulesTitle: { color: p.text, fontSize: 13, fontWeight: "900", marginTop: 4 },
    ruleRow: { gap: 2 },
    ruleTitle: { color: p.text, fontSize: 12, fontWeight: "800" },
    ruleBody: { color: p.muted, fontSize: 12, lineHeight: 17, fontWeight: "600" },
    ruleEvidence: { color: p.bannerBg, fontSize: 11, fontWeight: "700" },
    actions: { gap: 8, marginTop: 4 },
    btn: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12, alignItems: "center" },
    btnPrimary: { backgroundColor: p.buttonGoldBg },
    btnPrimaryText: { color: p.buttonGoldText, fontSize: 13, fontWeight: "900" },
    btnSecondary: {
      backgroundColor: p.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
    },
    btnSecondaryText: { color: p.text, fontSize: 13, fontWeight: "800" },
  });
}
