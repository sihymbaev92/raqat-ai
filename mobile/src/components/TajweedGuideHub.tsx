import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useI18n } from "../i18n/useI18n";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "./GuideAutoTranslateBanner";
import { GuideAccordionSection } from "./GuideAccordion";
import { TajweedAlphabetGrid } from "./TajweedAlphabetGrid";
import { TajweedMuftyatToc } from "./TajweedMuftyatToc";
import { TajweedRulesLegendPanel } from "./TajweedRulesLegendPanel";
import {
  TAJWEED_APP_PAGE_COUNT,
  TAJWEED_APP_SECTIONS,
  buildTajweedTocGroups,
} from "../content/tajweedMuftyatScope";
import { tajweedSectionDisplayTitle } from "../content/tajweedSectionTitlesLocale";
import { useAppLocale } from "../i18n/runtime";
import type { MoreStackParamList } from "../navigation/types";
import { navigateToQuranSurah } from "../navigation/navigateToMoreStack";

type Props = {
  onOpenPage: (page: number) => void;
  onOpenQuran?: () => void;
  onOpenColoredList?: () => void;
};

/** Нөлден оқу: әліпби → ережелер → оқулық → Құранға кіру. */
export function TajweedGuideHome({ onOpenPage, onOpenQuran, onOpenColoredList }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useAppLocale();
  const { tr, translated } = useKkAutoTranslator();
  const t = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [bookOpen, setBookOpen] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [openingSurah, setOpeningSurah] = useState(false);
  const quickNavGroups = useMemo(() => buildTajweedTocGroups(TAJWEED_APP_SECTIONS), []);

  const sectionTitle = useCallback(
    (titleKk: string) => tajweedSectionDisplayTitle(titleKk, locale, tr),
    [locale, tr]
  );

  const openColoredList = useCallback(() => {
    if (onOpenColoredList) {
      onOpenColoredList();
      return;
    }
    navigation.navigate("HatimTajweedList");
  }, [navigation, onOpenColoredList]);

  const openColoredFatiha = useCallback(async () => {
    if (openingSurah) return;
    if (onOpenQuran) {
      onOpenQuran();
      return;
    }
    setOpeningSurah(true);
    try {
      navigateToQuranSurah(
        {
          surahNumber: 1,
          englishName: "Al-Fatiha",
          arabicName: "الفاتحة",
        },
        navigation
      );
    } finally {
      setOpeningSurah(false);
    }
  }, [navigation, onOpenQuran, openingSurah]);

  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>{t.tajweedGuide.sectionAlphabet}</Text>
        <Text style={styles.heroTitle}>{t.tajweedGuide.alphabetHeading}</Text>
        <Text style={styles.heroIntro}>{t.tajweedGuide.intro}</Text>
      </View>

      <TajweedAlphabetGrid />

      <GuideAccordionSection
        title={tr(kk.tajweedGuide.sectionLaterTitle)}
        subtitle={tr(kk.tajweedGuide.sectionLaterSub)}
        expanded={chaptersOpen}
        onToggle={() => setChaptersOpen((open) => !open)}
        colors={colors}
      >
        <Text style={styles.studyHint}>{t.tajweedGuide.chaptersHint}</Text>
        {quickNavGroups.map((group) => (
          <View key={`quick-${group.id}`} style={styles.studyGroup}>
            <Text style={styles.studyGroupTitle}>
              {sectionTitle(group.part?.title ?? kk.tajweedGuide.tocGroupPreface)}
            </Text>
            <View style={styles.chapterGrid}>
              {group.chapters.map((sec) => (
                <Pressable
                  key={sec.id}
                  onPress={() => onOpenPage(sec.startPage)}
                  style={({ pressed }) => [styles.chapterChip, pressed && { opacity: 0.9 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${sectionTitle(sec.title)}, ${sec.startPage}`}
                >
                  <Text style={styles.chapterChipTitle} numberOfLines={2}>
                    {sectionTitle(sec.title)}
                  </Text>
                  <Text style={styles.chapterChipPages}>
                    {sec.startPage}
                    {sec.endPage > sec.startPage ? `–${sec.endPage}` : ""}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </GuideAccordionSection>

      <GuideAccordionSection
        title={tr(kk.tajweedGuide.sectionBook)}
        subtitle={tr(kk.tajweedGuide.sectionBookSub(TAJWEED_APP_PAGE_COUNT))}
        expanded={bookOpen}
        onToggle={() => setBookOpen((open) => !open)}
        colors={colors}
      >
        <TajweedMuftyatToc embedded onPickPage={onOpenPage} />
      </GuideAccordionSection>

      <GuideAccordionSection
        title={tr(kk.tajweedGuide.sectionQuranColors)}
        subtitle={tr(kk.tajweedGuide.quranColorsHint)}
        expanded={rulesOpen}
        onToggle={() => setRulesOpen((o) => !o)}
        colors={colors}
      >
        <TajweedRulesLegendPanel compact onOpenColoredList={openColoredList} />
      </GuideAccordionSection>

      <View style={styles.studyCard}>
        <Text style={styles.studyCardHint}>{t.tajweedGuide.openQuranHint}</Text>
        <Pressable
          onPress={() => void openColoredFatiha()}
          disabled={openingSurah}
          style={({ pressed }) => [styles.practiceCta, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel={t.tajweedGuide.openQuranA11y}
        >
          {openingSurah ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.practiceTitle}>{t.tajweedGuide.openQuranCta}</Text>
          )}
        </Pressable>
        <Pressable
          onPress={openColoredList}
          style={({ pressed }) => [styles.secondaryLink, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={t.tajweedGuide.openColoredListA11y}
        >
          <Text style={styles.secondaryLinkText}>{t.tajweedGuide.openColoredListCta}</Text>
        </Pressable>
      </View>

      <GuideAutoTranslateBanner colors={colors} visible={translated} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 32, gap: 4 },
    heroCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
      gap: 4,
    },
    heroEyebrow: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    heroTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "900",
      lineHeight: 28,
    },
    heroIntro: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 2,
    },
    studyCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 14,
      marginTop: 10,
      marginBottom: 10,
      gap: 10,
    },
    studyCardHint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600",
    },
    practiceCta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    practiceTitle: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
      lineHeight: 21,
      textAlign: "center",
      flex: 1,
    },
    secondaryLink: {
      alignSelf: "flex-start",
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    secondaryLinkText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 20,
    },
    studyHint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 10,
    },
    studyGroup: {
      gap: 8,
      marginTop: 10,
    },
    studyGroupTitle: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
      lineHeight: 18,
    },
    chapterGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chapterChip: {
      width: "48%",
      minWidth: 132,
      flexGrow: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.accentSurface,
      paddingHorizontal: 11,
      paddingVertical: 10,
    },
    chapterChipTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
      lineHeight: 18,
    },
    chapterChipPages: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "800",
      marginTop: 5,
    },
  });
}
