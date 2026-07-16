import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
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

type Props = {
  onOpenPage: (page: number) => void;
};

export function TajweedGuideHome({ onOpenPage }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tr, translated } = useKkAutoTranslator();
  const t = useI18n();
  const [bookOpen, setBookOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const quickNavGroups = useMemo(() => buildTajweedTocGroups(TAJWEED_APP_SECTIONS), []);

  return (
    <View style={styles.wrap}>
      <TajweedAlphabetGrid />

      <View style={styles.studyCard}>
        <Text style={styles.studyTitle}>{t.tajweedGuide.chaptersTitle}</Text>
        <Text style={styles.studyHint}>
          {t.tajweedGuide.chaptersHint}
        </Text>
        {quickNavGroups.map((group) => (
          <View key={`quick-${group.id}`} style={styles.studyGroup}>
            <Text style={styles.studyGroupTitle}>{tr(group.part?.title ?? kk.tajweedGuide.tocGroupPreface)}</Text>
            <View style={styles.chapterGrid}>
              {group.chapters.map((sec) => (
                <Pressable
                  key={sec.id}
                  onPress={() => onOpenPage(sec.startPage)}
                  style={({ pressed }) => [styles.chapterChip, pressed && { opacity: 0.9 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${sec.title}, ${sec.startPage}`}
                >
                  <Text style={styles.chapterChipTitle} numberOfLines={2}>
                    {tr(sec.title)}
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
      </View>

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
        <TajweedRulesLegendPanel compact />
      </GuideAccordionSection>

      <GuideAutoTranslateBanner colors={colors} visible={translated} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 32, gap: 4 },
    studyCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
    },
    studyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
      marginBottom: 4,
    },
    studyHint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
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
