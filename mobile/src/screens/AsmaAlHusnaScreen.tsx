import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Platform
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "../components/GuideAutoTranslateBanner";
import { getAsmaChapters } from "../content/asmaChapters";
import { useAppLocale } from "../i18n/runtime";

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
  useAppLocale();
  const { colors, isDark } = useAppTheme();
  const { tr, translated } = useKkAutoTranslator();
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
        <Text style={styles.heroSub}>{tr(kk.asma.heroSubtitle)}</Text>
      </View>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={tr(kk.asma.searchPh)}
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
                <View style={styles.cardHead}>
                  <View style={styles.indexPill}>
                    <Text style={styles.indexNum}>{item.n}</Text>
                  </View>
                  <View style={styles.nameCol}>
                    <Text style={styles.ar}>{item.ar}</Text>
                    <Text style={styles.kk}>{tr(item.kk)}</Text>
                  </View>
                  <Text style={styles.chevron}>{open ? "▲" : "▼"}</Text>
                </View>
                {open ? <Text style={styles.tapHint}>{tr(kk.asma.collapseHint)}</Text> : null}
              </Pressable>
              {open ? (
                <View style={styles.detailBody}>
                  {chapters.map((ch, idx) => (
                    <View key={`${item.n}-d-${idx}`} style={styles.flatSection}>
                      <Text style={styles.flatTitle}>{tr(ch.title)}</Text>
                      <Text style={styles.flatBody}>{tr(ch.body)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.muted}>{tr(kk.asma.empty)}</Text>}
        ListFooterComponent={<GuideAutoTranslateBanner colors={colors} visible={translated} />}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingTop: 2,
      paddingBottom: 10,
      paddingHorizontal: 16,
    },
    heroAr: {
      fontSize: 32,
      lineHeight: 42,
      color: colors.scriptureArabic,
      writingDirection: "rtl",
      textAlign: "center",
      fontWeight: "700",
    },
    heroSub: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.scriptureMeaningKk,
      textAlign: "center",
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
      padding: 10,
      marginBottom: 8,
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
      paddingVertical: 2,
      paddingHorizontal: 2,
    },
    nameBlockPressed: { opacity: 0.88 },
    cardHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    indexPill: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    nameCol: { flex: 1, minWidth: 0 },
    chevron: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "800",
      paddingLeft: 4,
    },
    tapHint: {
      marginTop: 6,
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
    },
    detailBody: {
      marginTop: 10,
      alignSelf: "stretch",
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    flatSection: {
      marginBottom: 10,
      alignSelf: "stretch",
    },
    flatTitle: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 4,
      lineHeight: 18,
    },
    flatBody: {
      color: colors.scriptureMeaningKk,
      fontSize: 13,
      lineHeight: 20,
    },
    indexNum: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.accent,
      fontVariant: ["tabular-nums"],
    },
    ar: {
      color: colors.scriptureArabic,
      fontSize: 19,
      lineHeight: 28,
      textAlign: "right",
      writingDirection: "rtl",
      marginBottom: 2,
    },
    kk: { color: colors.scriptureMeaningKk, fontSize: 14, lineHeight: 20, marginBottom: 0 },
    muted: { color: colors.muted, textAlign: "center", marginTop: 24 },
  });
}
