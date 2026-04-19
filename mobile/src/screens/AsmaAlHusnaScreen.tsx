import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Platform,
} from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";

type AsmaRow = { n: number; ar: string; kk: string };

function loadNames(): AsmaRow[] {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const raw = require("../../assets/bundled/asma-al-husna-kk.json") as AsmaRow[];
    /* eslint-enable @typescript-eslint/no-require-imports */
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function AsmaAlHusnaScreen() {
  const { colors, isDark } = useAppTheme();
  const rows = useMemo(() => loadNames(), []);
  const [q, setQ] = useState("");
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        String(r.n).includes(t) ||
        r.kk.toLowerCase().includes(t) ||
        r.ar.includes(q.trim())
    );
  }, [rows, q]);

  const header = (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroAr}>الله</Text>
        <Text style={styles.heroSub}>{kk.asma.heroSubtitle}</Text>
      </View>
      <Text style={styles.intro}>{kk.asma.intro}</Text>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={kk.asma.searchPh}
        placeholderTextColor={colors.muted}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.n)}
        contentContainerStyle={styles.listPad}
        initialNumToRender={20}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.num}>№{item.n}</Text>
            <Text style={styles.ar}>{item.ar}</Text>
            <Text style={styles.kk}>{item.kk}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.muted}>{kk.asma.empty}</Text>}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    hero: {
      alignItems: "center",
      paddingTop: 4,
      paddingBottom: 14,
      paddingHorizontal: 16,
      marginBottom: 4,
    },
    heroAr: {
      fontSize: 40,
      lineHeight: 52,
      color: colors.text,
      writingDirection: "rtl",
      textAlign: "center",
      fontWeight: "700",
    },
    heroSub: {
      marginTop: 10,
      fontSize: 17,
      fontWeight: "800",
      color: colors.accent,
      textAlign: "center",
    },
    intro: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
    },
    search: {
      marginHorizontal: 16,
      marginBottom: 10,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      color: colors.text,
      fontSize: 15,
    },
    listPad: { paddingHorizontal: 16, paddingBottom: 32 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.15 : 0.06,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    num: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 6,
    },
    ar: {
      color: colors.text,
      fontSize: 20,
      lineHeight: 34,
      textAlign: "right",
      writingDirection: "rtl",
      marginBottom: 8,
    },
    kk: { color: colors.text, fontSize: 15, lineHeight: 22 },
    muted: { color: colors.muted, textAlign: "center", marginTop: 24 },
  });
}
