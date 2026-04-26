import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Platform,
  Pressable,
} from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { getAsmaChapters } from "../content/asmaChapters";

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
  /** Толық түсінік: карточканың үстіңгі бөлігін басқанда ашылады */
  const [detailOpen, setDetailOpen] = useState<Record<number, boolean>>({});
  const toggleDetail = useCallback((n: number) => {
    setDetailOpen((o) => ({ ...o, [n]: !o[n] }));
  }, []);
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
        extraData={detailOpen}
        keyExtractor={(item) => String(item.n)}
        contentContainerStyle={styles.listPad}
        initialNumToRender={20}
        ListHeaderComponent={header}
        renderItem={({ item }) => {
          const open = !!detailOpen[item.n];
          const chapters = getAsmaChapters(item.n, item.kk);
          return (
            <View style={styles.card}>
              <Pressable
                onPress={() => toggleDetail(item.n)}
                style={({ pressed }) => [styles.nameBlock, pressed && styles.nameBlockPressed]}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={`№${item.n}. ${item.kk}`}
                accessibilityHint={open ? kk.asma.collapseHint : kk.asma.tapDetailHint}
              >
                <Text style={styles.num}>№{item.n}</Text>
                <Text style={styles.ar}>{item.ar}</Text>
                <Text style={styles.kk}>{item.kk}</Text>
                <Text style={styles.tapHint}>{open ? kk.asma.collapseHint : kk.asma.tapDetailHint}</Text>
              </Pressable>
              {open ? (
                <View style={styles.detailBody}>
                  {chapters.map((ch, idx) => (
                    <View key={`${item.n}-d-${idx}`} style={styles.flatSection}>
                      <Text style={styles.flatTitle}>{ch.title}</Text>
                      <Text style={styles.flatBody}>{ch.body}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
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
      color: colors.scriptureArabic,
      writingDirection: "rtl",
      textAlign: "center",
      fontWeight: "700",
    },
    heroSub: {
      marginTop: 10,
      fontSize: 17,
      fontWeight: "800",
      color: colors.scriptureMeaningKk,
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
    nameBlock: {
      alignSelf: "stretch",
      borderRadius: 10,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    nameBlockPressed: { opacity: 0.88 },
    tapHint: {
      marginTop: 8,
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
    },
    detailBody: {
      marginTop: 12,
      alignSelf: "stretch",
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    flatSection: {
      marginBottom: 16,
      alignSelf: "stretch",
    },
    flatTitle: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 8,
      lineHeight: 20,
    },
    flatBody: {
      color: colors.scriptureMeaningKk,
      fontSize: 14,
      lineHeight: 22,
    },
    num: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 6,
    },
    ar: {
      color: colors.scriptureArabic,
      fontSize: 20,
      lineHeight: 34,
      textAlign: "right",
      writingDirection: "rtl",
      marginBottom: 8,
    },
    kk: { color: colors.scriptureMeaningKk, fontSize: 15, lineHeight: 22, marginBottom: 0 },
    muted: { color: colors.muted, textAlign: "center", marginTop: 24 },
  });
}
