import React, { useMemo } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { DUA_CATEGORIES } from "../content/spiritualContent";
import { kk } from "../i18n/kk";

export function DuasScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{kk.duas.intro}</Text>
      {DUA_CATEGORIES.map((cat) => (
        <View key={cat.title} style={styles.category}>
          <Text style={styles.catTitle}>{cat.title}</Text>
          {cat.blocks.map((b) => (
            <View key={`${cat.title}::${b.title}`} style={styles.card}>
              <Text style={styles.cardTitle}>{b.title}</Text>
              <Text style={styles.ar}>{b.ar}</Text>
              <Text style={styles.kk}>{b.kk}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    intro: { color: colors.muted, marginBottom: 16, lineHeight: 20, fontSize: 13 },
    category: { marginBottom: 8 },
    catTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 16,
      marginBottom: 12,
      marginTop: 8,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: { color: colors.accent, fontWeight: "700", marginBottom: 8 },
    ar: {
      color: colors.text,
      fontSize: 18,
      lineHeight: 30,
      writingDirection: "rtl",
      textAlign: "right",
    },
    kk: { color: colors.muted, marginTop: 10, lineHeight: 20, fontSize: 14 },
  });
}
