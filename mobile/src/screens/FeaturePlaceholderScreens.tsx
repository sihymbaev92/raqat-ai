import React from "react";
import { Text, StyleSheet, ScrollView, View } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { HAJJ_SECTIONS } from "../content/spiritualContent";

function SectionedGuide({
  title,
  intro,
  sections,
}: {
  title: string;
  intro?: string;
  sections: { title: string; body: string }[];
}) {
  const { colors } = useAppTheme();
  const styles = makeGuideStyles(colors);
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>{title}</Text>
      {intro ? <Text style={styles.intro}>{intro}</Text> : null}
      {sections.map((s) => (
        <View key={s.title} style={styles.block}>
          <Text style={styles.blockTitle}>{s.title}</Text>
          <Text style={styles.blockBody}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export function HajjScreen() {
  return (
    <SectionedGuide title={kk.features.hajjTitle} intro={kk.features.hajjIntro} sections={HAJJ_SECTIONS} />
  );
}

function makeGuideStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 18, paddingBottom: 40 },
    h1: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 10 },
    intro: { fontSize: 14, lineHeight: 22, color: colors.muted, marginBottom: 16 },
    block: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    blockTitle: { color: colors.accent, fontWeight: "800", fontSize: 15, marginBottom: 8 },
    blockBody: { color: colors.text, fontSize: 15, lineHeight: 24 },
  });
}

