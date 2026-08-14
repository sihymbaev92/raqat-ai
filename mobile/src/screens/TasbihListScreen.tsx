import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { migrateLegacyTasbihCountIntoMap, getAllDhikrCounts } from "../storage/prefs";
import { useI18n } from "../i18n/useI18n";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAccordionSection } from "../components/GuideAccordion";
import { DHIKR_CHAPTERS } from "../content/dhikrChapters";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TasbihStackParamList } from "../navigation/types";
import { useTabHomeBackHeader } from "../navigation/useTabHomeBackHeader";
import { loadDhikrItems } from "./tasbihShared";
import { pickBestTranslit, isRedundantTranslitTitle } from "../utils/translitKk";

type Props = NativeStackScreenProps<TasbihStackParamList, "TasbihList">;

export function TasbihListScreen({ navigation }: Props) {
  const kk = useI18n();
  const { tr } = useKkAutoTranslator();
  const items = useMemo(() => loadDhikrItems(), []);
  const { colors, isDark } = useAppTheme();
  useTabHomeBackHeader(navigation, colors);
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

  useEffect(() => {
    if (expandedChapterIndex == null) {
      setExpandedChapterIndex(0);
    }
  }, [expandedChapterIndex]);

  const renderDhikrRows = (ids: number[]) =>
    ids.map((id) => {
      const d = items.find((i) => i.id === id);
      if (!d) return null;
      const c = dhikrCounts[id] ?? 0;
      const show = String(c);
      const translit = pickBestTranslit(d.textAr || "", d.translitKk);
      const title = tr(d.textKk);
      const hideTitle = Boolean(translit && isRedundantTranslitTitle(title, translit));
      return (
        <View key={id} style={styles.listRowWrap}>
          <Pressable
            onPress={() => {
              navigation.navigate("TasbihCounter", {
                dhikrId: d.id,
                titleKk: d.textKk,
              });
            }}
            style={({ pressed }) => [styles.listRow, pressed && styles.listRowPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${title}. ${show}. ${kk.tasbih.openCounterA11y}`}
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
              {hideTitle ? null : (
                <Text style={styles.listRowTitle} numberOfLines={2}>
                  {title}
                </Text>
              )}
              {translit ? (
                <Text style={styles.listRowTranslit} numberOfLines={3}>
                  {tr(translit)}
                </Text>
              ) : null}
              {d.meaningKk ? (
                <Text style={styles.listRowMeaning} numberOfLines={2}>
                  {tr(d.meaningKk)}
                </Text>
              ) : null}
              <Text style={styles.listRowProgress}>{show}</Text>
            </View>
            <Text style={styles.listRowChev}>›</Text>
          </Pressable>
        </View>
      );
    });

  if (!items.length) {
    return (
      <View style={styles.root}>
        <View style={[styles.emptyWrap, { paddingTop: Math.max(16, insets.top) }]}>
          <Text style={styles.muted}>{kk.tasbih.loadFailedHint}</Text>
        </View>
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
        {DHIKR_CHAPTERS.map((ch, idx) => {
          const isMainTasbih = ch.ids.length === 1 && ch.ids[0] === 1;
          if (isMainTasbih) {
            return <View key="main-tasbih">{renderDhikrRows(ch.ids)}</View>;
          }
          return (
            <GuideAccordionSection
              key={ch.titleKk}
              title={tr(ch.titleKk)}
              subtitle={tr(ch.subtitleKk ?? "")}
              expanded={expandedChapterIndex === idx}
              onToggle={() => setExpandedChapterIndex(expandedChapterIndex === idx ? null : idx)}
              colors={colors}
            >
              {renderDhikrRows(ch.ids)}
            </GuideAccordionSection>
          );
        })}
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
    emptyWrap: { flex: 1, padding: 24, justifyContent: "center" },
    muted: { color: colors.muted, textAlign: "center", fontSize: 15, lineHeight: 22 },
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
      color: colors.text,
      fontSize: 15,
      marginTop: 4,
      lineHeight: 22,
      fontWeight: "900",
    },
    listRowMeaning: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 19,
      fontWeight: "600",
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
