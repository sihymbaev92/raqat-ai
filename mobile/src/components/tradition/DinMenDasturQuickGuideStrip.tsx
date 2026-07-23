import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { DIN_MEN_DASTUR_QUICK_GUIDE } from "../../content/dinMenDasturQuickGuide";
import type { TraditionKazakhPalette } from "../../theme/traditionKazakhTheme";
import { useI18n } from "../../i18n/useI18n";

type Props = {
  palette: TraditionKazakhPalette;
  tr: (text: string) => string;
  onOpenTopic: (topicId: string) => void;
};

/** Хабтағы қысқа 4 карточка — терең тақырыпқа кіріспе. */
export function DinMenDasturQuickGuideStrip({ palette, tr, onOpenTopic }: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const g = useI18n().features.traditionGuide;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{g.quickChewTitle}</Text>
      <Text style={styles.lead}>{g.quickChewLead}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {DIN_MEN_DASTUR_QUICK_GUIDE.map((item) => (
          <Pressable
            key={item.id}
            oyuBackdrop={false}
            onPress={() => onOpenTopic(item.topicId)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel={tr(item.title)}
          >
            <Text style={styles.cardTitle} numberOfLines={2}>
              {tr(item.title)}
            </Text>
            <Text style={styles.label}>{g.quickShariatLabel}</Text>
            <Text style={styles.shariat} numberOfLines={2}>
              {tr(item.shariat)}
            </Text>
            <Text style={styles.cta}>{g.quickReadFull} ›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: { marginBottom: 10, gap: 6 },
    title: { color: p.text, fontSize: 14, fontWeight: "900" },
    lead: { color: p.muted, fontSize: 12, fontWeight: "600", lineHeight: 16, marginBottom: 2 },
    row: { gap: 8, paddingRight: 4 },
    card: {
      width: 200,
      backgroundColor: p.cardBg,
      borderRadius: 12,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      gap: 4,
    },
    cardTitle: { color: p.text, fontSize: 13, fontWeight: "900", lineHeight: 17, minHeight: 34 },
    label: { color: p.muted, fontSize: 10, fontWeight: "700", marginTop: 2 },
    shariat: { color: p.text, fontSize: 12, fontWeight: "700", lineHeight: 16 },
    cta: { color: p.bannerBg, fontSize: 12, fontWeight: "900", marginTop: 6 },
  });
}
