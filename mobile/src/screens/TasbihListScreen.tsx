import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { migrateLegacyTasbihCountIntoMap, getAllDhikrCounts } from "../storage/prefs";
import { kk } from "../i18n/kk";
import { GuideAccordionSection } from "../components/GuideAccordion";
import { DHIKR_CHAPTERS } from "../content/dhikrChapters";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TasbihStackParamList } from "../navigation/types";
import { loadDhikrItems, effectiveGoalForItem } from "./tasbihShared";

type Props = NativeStackScreenProps<TasbihStackParamList, "TasbihList">;

export function TasbihListScreen({ navigation }: Props) {
  const items = useMemo(() => loadDhikrItems(), []);
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [expandedChapterIndex, setExpandedChapterIndex] = useState<number | null>(0);
  const [dhikrCounts, setDhikrCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await migrateLegacyTasbihCountIntoMap();
      const map = await getAllDhikrCounts();
      if (!cancelled) setDhikrCounts(map);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      void (async () => {
        const map = await getAllDhikrCounts();
        setDhikrCounts(map);
      })();
    });
    return unsub;
  }, [navigation]);

  const scrollBottomPad = Math.max(insets.bottom, 16) + 8;

  if (!items.length) {
    return (
      <View style={styles.scroll}>
        <Text style={styles.muted}>Зікір тізімі жүктелмеді.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.listHero}>{kk.tasbih.zikirSection}</Text>
        <Text style={styles.listIntro}>{kk.tasbih.listIntro}</Text>

        {DHIKR_CHAPTERS.map((ch, idx) => (
          <GuideAccordionSection
            key={ch.titleKk}
            title={ch.titleKk}
            subtitle={ch.subtitleKk}
            expanded={expandedChapterIndex === idx}
            onToggle={() => setExpandedChapterIndex(expandedChapterIndex === idx ? null : idx)}
            colors={colors}
          >
            {ch.ids.map((id) => {
              const d = items.find((i) => i.id === id);
              if (!d) return null;
              const g = effectiveGoalForItem(d, null);
              const c = dhikrCounts[id] ?? 0;
              const show = `${c} / ${g}`;
              return (
                <View key={id} style={styles.listRowWrap}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      navigation.navigate("TasbihCounter", {
                        dhikrId: d.id,
                        titleKk: d.textKk,
                      });
                    }}
                    style={({ pressed }) => [styles.listRow, pressed && styles.listRowPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${d.textKk}. ${show}. ${kk.tasbih.openCounterA11y}`}
                  >
                    <View style={styles.listBadge}>
                      <Text style={styles.listBadgeTxt}>{id}</Text>
                    </View>
                    <View style={styles.listRowMain}>
                      {d.textAr ? (
                        <Text style={styles.listRowAr} numberOfLines={2}>
                          {d.textAr}
                        </Text>
                      ) : null}
                      <Text style={styles.listRowTitle} numberOfLines={2}>
                        {d.textKk}
                      </Text>
                      {d.translitKk ? (
                        <Text style={styles.listRowTranslit} numberOfLines={2}>
                          {d.translitKk}
                        </Text>
                      ) : null}
                      <Text style={styles.listRowProgress}>{show}</Text>
                    </View>
                    <Text style={styles.listRowChev}>›</Text>
                  </Pressable>
                </View>
              );
            })}
          </GuideAccordionSection>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1, backgroundColor: colors.bg },
    scrollContent: {
      padding: 20,
      paddingBottom: 16,
    },
    muted: { color: colors.muted, textAlign: "center", marginTop: 24 },
    listHero: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 8,
    },
    listIntro: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 16,
    },
    listRowWrap: {
      marginBottom: 10,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      gap: 10,
    },
    listRowPressed: { opacity: 0.92 },
    listBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(46, 125, 50, 0.35)" : "rgba(46, 125, 50, 0.18)",
      borderWidth: 1,
      borderColor: colors.accentDark,
      justifyContent: "center",
      alignItems: "center",
    },
    listBadgeTxt: {
      color: colors.accentDark,
      fontWeight: "800",
      fontSize: 14,
      fontVariant: ["tabular-nums"],
    },
    listRowMain: { flex: 1, minWidth: 0 },
    listRowAr: {
      color: colors.scriptureArabic,
      fontSize: 16,
      lineHeight: 26,
      fontWeight: "700",
      writingDirection: "rtl",
      textAlign: "right",
      marginBottom: 4,
    },
    listRowTitle: { color: colors.scriptureMeaningKk, fontWeight: "800", fontSize: 15 },
    listRowTranslit: {
      color: colors.scriptureTranslit,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
    },
    listRowProgress: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      marginTop: 6,
      fontVariant: ["tabular-nums"],
    },
    listRowChev: {
      color: colors.muted,
      fontSize: 22,
      fontWeight: "600",
      paddingLeft: 4,
    },
  });
}
