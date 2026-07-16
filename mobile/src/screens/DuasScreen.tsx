import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppLocale } from "../i18n/runtime";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { DUA_CATEGORIES } from "../content/spiritualContent";
import type { DuaBlock } from "../content/duasCatalog";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "../components/GuideAutoTranslateBanner";
import type { DuasStackParamList, MoreStackParamList } from "../navigation/types";
import { useTabHomeBackHeader } from "../navigation/useTabHomeBackHeader";
import { QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";
import { pickBestTranslit } from "../utils/translitKk";

/** Таб ішіндегі DuasStack және MoreStack-тегі «extra-duas» бір экран */
type Props =
  | NativeStackScreenProps<DuasStackParamList, "DuasHome">
  | NativeStackScreenProps<MoreStackParamList, "Duas">;

function duaCardKey(catTitle: string, blockIndex: number, blockTitle: string) {
  return `${catTitle}::${blockIndex}::${blockTitle}`;
}

function duaArabicTextStyle() {
  const face = QURAN_BOOK_FONT_FACE.amiri;
  return {
    writingDirection: "rtl" as const,
    textAlign: "right" as const,
    ...(Platform.OS === "web"
      ? { fontFamily: `"${face}", "Scheherazade New", "Noto Naskh Arabic", "Arabic Typesetting", serif` }
      : { fontFamily: face }),
  };
}

export function DuasScreen({ navigation }: Props) {
  useAppLocale();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  useTabHomeBackHeader(navigation, colors);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tr, translated } = useKkAutoTranslator();
  const scrollBottomPad = useMemo(() => Math.max(40, 20 + insets.bottom), [insets.bottom]);
  /** Тақырып қалтасы (бөлім) ашық/жабық */
  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>({});
  /** Дұға карточкасы ішінде оқылу+мағына ашық */
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleCategory = useCallback((title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoryOpen((o) => ({ ...o, [title]: !o[title] }));
  }, []);

  const toggleCard = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((o) => ({ ...o, [key]: !o[key] }));
  }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
    >
      {DUA_CATEGORIES.map((cat) => {
        const isCategoryOpen = !!categoryOpen[cat.title];
        return (
          <View
            key={cat.title}
            style={styles.catPocket}
          >
            <Pressable
              onPress={() => toggleCategory(cat.title)}
              style={({ pressed }) => [styles.catHead, pressed && styles.catHeadPressed]}
              accessibilityRole="button"
              accessibilityState={{ expanded: isCategoryOpen }}
              accessibilityLabel={`${cat.title}. ${kk.duas.duaCount(cat.blocks.length)}`}
              accessibilityHint={
                isCategoryOpen ? kk.duas.categoryCollapseHint : kk.duas.categoryExpandHint
              }
            >
              <View style={styles.catHeadText}>
                <Text style={styles.catHeadTitle}>{tr(cat.title)}</Text>
                <Text style={styles.catHeadSub}>{tr(kk.duas.duaCount(cat.blocks.length))}</Text>
              </View>
              <Text style={styles.catChevron}>{isCategoryOpen ? "▲" : "▼"}</Text>
            </Pressable>
            {isCategoryOpen ? (
              <View style={styles.catBody}>
                {cat.blocks.map((b: DuaBlock, blockIdx: number) => {
                  const key = duaCardKey(cat.title, blockIdx, b.title);
                  const open = !!expanded[key];
                  return (
                    <View key={key} style={styles.card}>
                      <Pressable
                        onPress={() => toggleCard(key)}
                        style={({ pressed }) => [styles.duaNameBlock, pressed && styles.duaNameBlockPressed]}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: open }}
                        accessibilityLabel={`${b.title}. ${b.ar}`}
                        accessibilityHint={open ? kk.duas.collapseTapHint : kk.duas.expandTapHint}
                      >
                        <Text style={styles.cardTitle}>{tr(b.title)}</Text>
                        <Text style={styles.ar}>{b.ar}</Text>
                        <Text style={styles.tapHint}>{tr(open ? kk.duas.collapseTapHint : kk.duas.expandTapHint)}</Text>
                        {open ? (
                          <View style={styles.detailBody}>
                            <Text style={styles.caption}>{tr(kk.duas.translitCaption)}</Text>
                            <Text style={styles.kiril}>{pickBestTranslit(b.ar, b.translitKk)}</Text>
                            <Text style={styles.caption}>{tr(kk.duas.meaningCaption)}</Text>
                            <Text style={styles.kk}>{tr(b.meaningKk)}</Text>
                          </View>
                        ) : null}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
      <GuideAutoTranslateBanner colors={colors} visible={translated} />
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 0 },
    communityCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    communityThumbWrap: { width: 48, height: 48, borderRadius: 12, overflow: "hidden" },
    communityThumb: { width: 48, height: 48, borderRadius: 12 },
    communityThumbOverlay: {
      ...StyleSheet.absoluteFillObject,
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      opacity: 0.12,
    },
    communityTextCol: { flex: 1, minWidth: 0 },
    communityTitle: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 16,
      marginBottom: 4,
    },
    communitySub: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
    },
    communityChev: {
      color: colors.muted,
      fontSize: 22,
      fontWeight: "700",
      paddingLeft: 4,
    },
    catPocket: {
      marginBottom: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    catHead: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 10,
    },
    catHeadPressed: { opacity: 0.92 },
    catHeadText: { flex: 1, minWidth: 0 },
    catHeadTitle: {
      color: colors.accent,
      fontWeight: "800",
      fontSize: 16,
      lineHeight: 22,
    },
    catHeadSub: {
      marginTop: 4,
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    catChevron: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: "800",
      paddingLeft: 4,
    },
    catBody: {
      paddingHorizontal: 10,
      paddingBottom: 10,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    duaNameBlock: {
      alignSelf: "stretch",
      borderRadius: 10,
      paddingVertical: 2,
      paddingHorizontal: 0,
    },
    duaNameBlockPressed: { opacity: 0.9 },
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
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    cardTitle: { color: colors.accent, fontWeight: "700", marginBottom: 8 },
    caption: {
      marginTop: 8,
      fontSize: 11,
      fontWeight: "800",
      color: colors.muted,
      letterSpacing: 0.2,
    },
    ar: {
      color: colors.scriptureArabic,
      fontSize: 18,
      lineHeight: 30,
      ...duaArabicTextStyle(),
    },
    kiril: {
      color: colors.scriptureTranslit,
      marginTop: 6,
      lineHeight: 21,
      fontSize: 14,
      fontWeight: "600",
    },
    kk: { color: colors.scriptureMeaningKk, marginTop: 8, lineHeight: 22, fontSize: 15, fontWeight: "600" },
  });
}
